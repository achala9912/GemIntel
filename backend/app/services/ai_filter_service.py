import os
import subprocess
import json
import numpy as np
import cv2
import torch
import torchvision.models as models
from torchvision import transforms
import torch.nn as nn
from PIL import Image
from dataclasses import dataclass, field
from pathlib import Path
from app.config import AI_FILTER_MODEL_PATH, AI_FILTER_THRESHOLD, W_FREQ, W_CNN, W_META

# Define the local model path from backend configuration
MODEL_PATH = Path(AI_FILTER_MODEL_PATH)

def verify_model_exists():
    """Verify the model file exists at the specified path"""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file not found at:\n{MODEL_PATH}\n\n"
            "Please make sure the file exists."
        )
    print(f"[ModelLoader] Found model: {MODEL_PATH.name} ({MODEL_PATH.stat().st_size / 1024 / 1024:.1f} MB)")
    return True

@dataclass
class FilterResult:
    score_a: float = 0.0
    score_b: float = 0.0
    score_c: float = 0.0
    confidence: float = 0.0
    result: str = "unknown"
    details: dict = field(default_factory=dict)

# ─────────────────────────────────────────────
# 1. Score A — Frequency analysis  (DCT / FFT)
# ─────────────────────────────────────────────

class FrequencyAnalyser:
    """
    AI-generated images lack the high-frequency noise present in real
    camera captures.  We compute both an FFT noise score and a DCT
    energy score and combine them.
    """

    def analyse(self, img_bgr: np.ndarray) -> tuple[float, dict]:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)

        fft_score  = self._fft_score(gray)
        dct_score  = self._dct_score(gray)

        # Both scores are in [0, 1]; higher → more likely AI-generated
        combined = 0.5 * fft_score + 0.5 * dct_score

        return combined, {
            "fft_score": round(fft_score, 4),
            "dct_score": round(dct_score, 4),
        }

    # ── FFT: measure how "smooth" the frequency spectrum is ──────────────
    def _fft_score(self, gray: np.ndarray) -> float:
        f      = np.fft.fft2(gray)
        fshift = np.fft.fftshift(f)
        mag    = np.log1p(np.abs(fshift))

        h, w = mag.shape
        # Outer ring = high-frequency content
        center_mask = np.zeros_like(mag, dtype=bool)
        cy, cx = h // 2, w // 2
        r = min(h, w) // 4
        y, x = np.ogrid[:h, :w]
        center_mask[(y - cy) ** 2 + (x - cx) ** 2 <= r ** 2] = True

        high_freq_energy = mag[~center_mask].mean()
        total_energy     = mag.mean()

        ratio = high_freq_energy / (total_energy + 1e-8)
        # Real photos have ratio ≈ 0.8–0.95; AI images tend to be lower
        score = max(0.0, min(1.0, 1.0 - ratio))
        return float(score)

    # ── DCT: AI images have unnaturally low high-band energy ─────────────
    def _dct_score(self, gray: np.ndarray) -> float:
        resized = cv2.resize(gray, (256, 256))
        dct     = cv2.dct(resized)
        total   = np.abs(dct).sum() + 1e-8

        h, w = dct.shape
        low_band  = np.abs(dct[:h // 4, :w // 4]).sum()
        high_band = total - low_band

        low_ratio = low_band / total
        # Real images: low_ratio ≈ 0.55–0.70; AI images often > 0.80
        score = max(0.0, min(1.0, (low_ratio - 0.55) / 0.30))
        return float(score)

# ─────────────────────────────────────────────
# 2b. Score B — EfficientNet-B0 CNN detector
# ─────────────────────────────────────────────
class DetectorModel:
    """
    Fine-tuned EfficientNet-B0 binary classifier.
    Loads model from fixed path.
    """
    _TRANSFORM = None

    def __init__(self, model_path: Path | str | None = None):
        """
        Parameters
        ----------
        model_path : override default model path if needed
        """
        self._device = "cuda" if torch.cuda.is_available() else "cpu"

        # Use provided path or default
        if model_path:
            self.weights_path = Path(model_path)
        else:
            self.weights_path = MODEL_PATH

        verify_model_exists()

        print(f"[DetectorModel] Loading weights from: {self.weights_path}")

        # ── Build EfficientNet-B0 with binary head ────────────────────────
        m = models.efficientnet_b0(weights=None)
        m.classifier[1] = nn.Linear(m.classifier[1].in_features, 2)

        # Load checkpoint
        state = torch.load(str(self.weights_path), map_location=self._device)

        # Handle different checkpoint formats
        if isinstance(state, dict) and "model_state_dict" in state:
            state = state["model_state_dict"]
        elif isinstance(state, dict) and "state_dict" in state:
            state = state["state_dict"]

        m.load_state_dict(state)
        m.eval()
        self._model = m.to(self._device)

        print(f"[DetectorModel] EfficientNet-B0 loaded successfully on {self._device.upper()}.")

        # ── Pre-processing transform ──────────────────────────────────────
        self._tf = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225]),
        ])

    # ── Predict ───────────────────────────────────────────────────────────
    def predict(self, img_bgr: np.ndarray) -> tuple[float, dict]:
        from PIL import Image as PILImage

        pil = PILImage.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
        tensor = self._tf(pil).unsqueeze(0).to(self._device)

        with torch.no_grad():
            logits = self._model(tensor)
            probs = torch.softmax(logits, dim=1)

        prob_ai = probs[0, 0].item()                  # class 0 = AI-generated
        prob_authentic = probs[0, 1].item()           # class 1 = Authentic

        return float(prob_ai), {
            "backend": "efficientnet_b0",
            "prob_ai": round(prob_ai, 4),
            "prob_real": round(prob_authentic, 4),
            "device": self._device,
            "model_path": str(self.weights_path.name)
        }

# ─────────────────────────────────────────────
# 3. Score C — Metadata check  (EXIF / provenance)
# ─────────────────────────────────────────────

class MetadataChecker:
    """
    Improved metadata checker that handles JPEG + PNG properly.
    """
    AI_SOFTWARE_KEYWORDS = [
        # Original popular ones (kept for compatibility)
        "midjourney", "stable diffusion", "dall-e", "dall·e", "dall e",
        "firefly", "imagen", "nightcafe", "leonardo", "ideogram",
        "playground ai", "suno", "kling", "recraft",

        # Newer / Major 2025-2026 models
        "nano banana", "nanobanana", "gemini", "gpt image", "grok imagine",
        "grok image", "aurora", "flux", "flux 1", "flux 2", "flux pro",
        "reve", "seedream", "luma", "runway", "higgsfield", "lucid origin",
        "frames", "getimg", "openart", "tensor art",

        # Common generic / obvious tags
        "ai generated", "generated by ai", "synthetic image",
        "made with ai", "ai art", "generative ai"
    ]

    SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.avif'}

    def validate_format(self, image_path: str) -> bool:
        """Validate if the file is a supported image format"""
        if not os.path.exists(image_path):
            return False

        ext = os.path.splitext(image_path)[1].lower()
        if ext not in self.SUPPORTED_EXTENSIONS:
            return False

        # Quick magic number / PIL validation
        try:
            with Image.open(image_path) as img:
                return img.format is not None
        except:
            return False

    def check(self, image_path: str) -> tuple[float, dict]:
        if not self.validate_format(image_path):
            return 1.0, {"error": "Unsupported or invalid image format",
                        "supported": list(self.SUPPORTED_EXTENSIONS)}

        meta = self._read_meta(image_path)
        signals = {}
        penalty = 0.0

        file_type = meta.get("FileType", "").upper() or meta.get("MIMEType", "").upper()
        ext = os.path.splitext(image_path)[1].lower()

        is_png = "PNG" in file_type or ext == ".png"
        is_jpeg = any(x in file_type for x in ["JPEG", "JPG"]) or ext in [".jpg", ".jpeg"]
        is_webp = "WEBP" in file_type or ext == ".webp"
        is_avif = "AVIF" in file_type or ext == ".avif"

        # ── 3a. AI Software Tag ─────────────────────────────────────
        software_str = " ".join(str(meta.get(k, "")) for k in [
            "Software", "CreatorTool", "Creator", "Generator",
            "Application", "Producer", "EditingSoftware"
        ]).lower()

        if any(kw in software_str for kw in self.AI_SOFTWARE_KEYWORDS):
            signals["ai_software"] = software_str.strip()
            penalty += 0.75

        # ── 3b. Metadata Quality ────────────────────────────────────
        file_keys = [k for k in meta.keys() if k.startswith(("File", "ExifTool", "Directory", "SourceFile"))]
        meaningful_count = len(meta) - len(file_keys)

        if meaningful_count < 6:
            signals["very_minimal_meta"] = True
            penalty += 0.50
        elif meaningful_count < 12:
            signals["minimal_meta"] = True
            penalty += 0.35

        # ── 3c. Camera / Device Info ────────────────────────────────
        has_camera = any(meta.get(k) for k in ["Make", "Model", "Camera", "Device", "Manufacturer"])
        if not has_camera:
            signals["no_camera_info"] = True
            if is_jpeg or is_webp:
                penalty += 0.30
            else:
                penalty += 0.22

        # ── 3d. Timestamp ───────────────────────────────────────────
        has_timestamp = any(meta.get(k) for k in [
            "DateTimeOriginal", "CreateDate", "DateTime", "ModifyDate"
        ])
        if not has_timestamp:
            signals["no_timestamp"] = True
            penalty += 0.28 if (is_jpeg or is_webp) else 0.18

        # ── Format-specific checks ──────────────────────────────────
        if is_png or is_avif:
            if not has_camera and not has_timestamp:
                signals["modern_format_no_exif"] = True
                penalty += 0.40   # AI tools commonly output clean PNG/AVIF

        if is_webp:
            if "XMP" not in str(meta) and "EXIF" not in str(meta):
                signals["webp_no_extended_meta"] = True
                penalty += 0.25

        # Final Score
        score = float(np.clip(penalty, 0.0, 1.0))

        result = ("Strong Real" if score < 0.35 else
                  "Likely AI" if score >= 0.65 else "Suspicious")

        return score, {
            "signals": signals,
            "raw_meta_keys": list(meta.keys()),
            "meta_count": len(meta),
            "meaningful_meta": meaningful_count,
            "file_type": file_type,
            "format": ext,
            "result": result
        }

    def _read_meta(self, path: str) -> dict:
        """Robust metadata reader with better WebP & AVIF support"""
        meta = {}

        # 1. exiftool (best for all formats)
        try:
            out = subprocess.run(
                ["exiftool", "-json", "-a", "-G", "-m", path],
                capture_output=True, text=True, timeout=10
            )
            if out.returncode == 0:
                data = json.loads(out.stdout)
                if data:
                    meta = data[0]
                    # Clean keys
                    meta = {k.split(':')[-1]: v for k, v in meta.items()}
                    return meta
        except:
            pass

        # 2. Pillow fallback (good for PNG, JPEG, WebP, AVIF)
        try:
            with Image.open(path) as img:
                # Basic info
                meta["Format"] = img.format
                meta["ImageWidth"] = img.width
                meta["ImageHeight"] = img.height

                # EXIF
                if hasattr(img, "_getexif") and img._getexif():
                    exif = img._getexif()
                    from PIL.ExifTags import TAGS
                    meta.update({TAGS.get(k, k): v for k, v in exif.items()})

                # PNG text chunks
                if hasattr(img, "text") and img.text:
                    meta.update(img.text)

                # General info
                if hasattr(img, "info") and img.info:
                    meta.update(img.info)
        except Exception as e:
            meta["Pillow_Error"] = str(e)

        return meta

# ─────────────────────────────────────────────
# 4. Score aggregator  (weighted fusion → confidence 0–1)
# ─────────────────────────────────────────────

class ScoreAggregator:
    """
    Fuses the three branch scores into a single synthetic-likelihood
    confidence value in [0, 1].

    Default weights  (sum to 1.0):
      w_a = 0.30  — Frequency analysis
      w_b = 0.40  — Detector model      (highest weight: trained signal)
      w_c = 0.30  — Metadata check
    """

    def __init__(self, w_a: float = 0.30, w_b: float = 0.40, w_c: float = 0.30):
        assert abs(w_a + w_b + w_c - 1.0) < 1e-6, "Weights must sum to 1.0"
        self.w_a, self.w_b, self.w_c = w_a, w_b, w_c

    def fuse(self, score_a: float, score_b: float, score_c: float) -> float:
        return float(np.clip(
            self.w_a * score_a + self.w_b * score_b + self.w_c * score_c,
            0.0, 1.0,
        ))


# ─────────────────────────────────────────────
# 5. Threshold gate  (Score > τ → Dropout / Accept)
# ─────────────────────────────────────────────

class ThresholdGate:
    """
    Applies the threshold τ.

    result = "ai_generated"  (Dropout / Quarantine) if confidence > threshold
    result = "authentic"     (Accept / passes to auth model) otherwise
    """

    def __init__(self, threshold: float = 0.55):
        self.threshold = threshold

    def decide(self, confidence: float) -> str:
        return "ai_generated" if confidence > self.threshold else "authentic"


# ─────────────────────────────────────────────
# 6. Main pipeline
# ─────────────────────────────────────────────

class GemstoneAIFilter:
    """
    End-to-end filter matching the planned architecture:

        Input image
            ├── Frequency analysis  → score A
            ├── EfficientNet-B0     → score B  (weights from AI_Dataset)
            └── Metadata check      → score C
                        ↓
                Score aggregator  (weighted fusion)
                        ↓
                Confidence score  (0–1)
                        ↓
                Threshold gate    (score > τ ?)
               yes ↙          ↘ no
           Dropout           Accept
        (AI-generated)    (authentic)
    """

    def __init__(
        self,
        local_model_path: str | None = None,
        weights: tuple[float, float, float] = (0.30, 0.40, 0.30),
        threshold: float = 0.55,
    ):
        """
        Parameters
        ----------
        local_model_path : optional local .pt path
        weights          : (w_a, w_b, w_c) must sum to 1.0
        threshold        : confidence threshold; score > threshold → AI-generated
        """
        self.detector = DetectorModel(local_model_path)
        self.freq_analyser = FrequencyAnalyser()
        self.meta_checker  = MetadataChecker()
        self.aggregator    = ScoreAggregator(*weights)
        self.gate          = ThresholdGate(threshold)

    # ── Main entry point ─────────────────────────────────────────────────
    def run(self, image_path: str) -> FilterResult:
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")

        img_bgr = cv2.imread(str(path))
        if img_bgr is None:
            raise ValueError(f"Could not decode image: {image_path}")

        result = FilterResult()

        # Branch A — frequency
        result.score_a, freq_details = self.freq_analyser.analyse(img_bgr)

        # Branch B — detector model
        result.score_b, model_details = self.detector.predict(img_bgr)

        # Branch C — metadata
        result.score_c, meta_details = self.meta_checker.check(str(path))

        # Aggregator
        result.confidence = self.aggregator.fuse(
            result.score_a, result.score_b, result.score_c
        )

        # Threshold gate
        result.result = self.gate.decide(result.confidence)

        result.details = {
            "frequency": freq_details,
            "model":     model_details,
            "metadata":  meta_details,
            "threshold": self.gate.threshold,
        }

        return result

    # ── Convenience: pretty-print ─────────────────────────────────────────
    def report(self, result: FilterResult) -> str:
        result_label = (
            "[AI-GENERATED]  (Dropout / Quarantine)"
            if result.result == "ai_generated"
            else "[AUTHENTIC]  (Accept -> auth model)"
        )
        lines = [
            "=" * 54,
            "  Gemstone AI Detection Filter - Result",
            "=" * 54,
            f"  Score A  (frequency) : {result.score_a:.4f}",
            f"  Score B  (model)     : {result.score_b:.4f}",
            f"  Score C  (metadata)  : {result.score_c:.4f}",
            f"  -------------------------------------",
            f"  Confidence           : {result.confidence:.4f}",
            f"  result              : {result_label}",
            "=" * 54,
        ]
        if result.details.get("metadata", {}).get("signals"):
            lines.append("  Metadata signals:")
            for k, v in result.details["metadata"]["signals"].items():
                lines.append(f"    - {k}: {v}")
        return "\n".join(lines)


# ─────────────────────────────────────────────
# 7. Integration wrapper for routes.py
# ─────────────────────────────────────────────

_filter_instance = None

def load_ai_filter_model():
    """Triggered on startup to load the Colab pipeline into memory."""
    global _filter_instance
    if _filter_instance is None:
        print("[AI Filter] Initializing user pipeline...")
        _filter_instance = GemstoneAIFilter(
            local_model_path=str(MODEL_PATH),
            weights=(W_FREQ, W_CNN, W_META),
            threshold=AI_FILTER_THRESHOLD
        )

def analyze_image_origin(image: Image.Image) -> dict:
    """
    Saves PIL Image to a temp path, runs the Colab pipeline, 
    and returns a payload expected by the FastAPI routes.py.
    """
    global _filter_instance
    if _filter_instance is None:
        load_ai_filter_model()
        
    import tempfile
    
    # Save the PIL image to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_file:
        image.save(temp_file, format="PNG")
        temp_path = temp_file.name
        
    try:
        run_res = _filter_instance.run(temp_path)
        
        is_ai = run_res.result == "ai_generated"
        return {
            "is_ai_generated": is_ai,
            "aggregated_score": run_res.confidence,
            "threshold": _filter_instance.gate.threshold,
            "breakdown": {
                "frequency_analysis": {
                    "score": run_res.score_a,
                    "weight": _filter_instance.aggregator.w_a
                },
                "detector_model": {
                    "score": run_res.score_b,
                    "weight": _filter_instance.aggregator.w_b
                },
                "metadata_check": {
                    "score": run_res.score_c,
                    "weight": _filter_instance.aggregator.w_c
                }
            },
            "details": run_res.details
        }
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"[AI Filter] Could not remove temp file: {e}")
