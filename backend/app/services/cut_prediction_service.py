import os
import joblib
import pandas as pd
from pathlib import Path
from typing import Dict, Any, Optional, List


DEFAULT_MODEL_DIR = Path(__file__).parent.parent.parent / "models" / "cut-prediction"


class CutPredictor:
    """
    Singleton wrapper for trained Gemstone Cut Classification & Yield Regression ML models.
    Loads joblib artifacts once on startup or first request and executes feature-aligned inference.
    """

    def __init__(self, model_dir: Optional[str] = None):
        self.model_dir = Path(model_dir) if model_dir else DEFAULT_MODEL_DIR
        self._cut_model = None
        self._yield_model = None
        self._classifier_cols: Optional[List[str]] = None
        self._regressor_cols: Optional[List[str]] = None
        self._loaded = False

    def load(self) -> None:
        """Load all ML artifacts (.joblib). Idempotent."""
        if self._loaded:
            return

        if not self.model_dir.exists():
            raise FileNotFoundError(
                f"Model directory not found: {self.model_dir}"
            )

        print("[CutPredictor] Initializing gemstone cut prediction ML bundle...")
        try:
            cols_path = self.model_dir / "model_columns.joblib"
            cut_model_path = self.model_dir / "optimal_cut_classifier.joblib"
            yield_model_path = self.model_dir / "yield_regressor.joblib"

            print(f"[ModelLoader] Loading model columns definition from: {cols_path}")
            cols_dict = joblib.load(cols_path)
            self._classifier_cols = cols_dict.get("classifier_cols", [])
            self._regressor_cols = cols_dict.get("regressor_cols", [])

            print(f"[ModelLoader] Loading Optimal Cut Classifier from: {cut_model_path}")
            self._cut_model = joblib.load(cut_model_path)

            print(f"[ModelLoader] Loading Yield Regressor from: {yield_model_path}")
            self._yield_model = joblib.load(yield_model_path)

            self._loaded = True
            print("[CutPredictor] Gemstone ML cut prediction model bundle loaded successfully.")
        except FileNotFoundError as e:
            print(f"[CutPredictor] FAILED to load ML assets: Missing file {e.filename}")
            raise FileNotFoundError(
                f"Missing ML model file in {self.model_dir}: {e.filename}"
            )
        except Exception as e:
            print(f"[CutPredictor] Error while loading models: {e}")
            raise

    def predict(
        self,
        gem_type: str,
        length_mm: float,
        width_mm: float,
        depth_mm: float,
        requested_cut: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Predict optimal cut + yield from extracted gemstone metrics.

        Args:
            gem_type:      'blue_sapphire' | 'spinel' | 'topaz' (or readable name)
            length_mm:     Length in mm (e.g. from visual hull)
            width_mm:      Width in mm
            depth_mm:      Depth in mm
            requested_cut: Optional specific cut to calculate yield for (defaults to predicted cut)

        Returns:
            {
              "cut":           'Round' | 'Cushion' | 'Oval' | 'Emerald',
              "yield_pct":     float (predicted yield %),
              "confidence":    float (0-100),
              "probabilities": { cut: prob, ... },
              "lw_ratio":      float
            }
        """
        if not self._loaded:
            self.load()

        gt_norm = str(gem_type).lower().strip().replace(" ", "_")
        l_val, w_val = float(length_mm), float(width_mm)
        safe_length = max(l_val, w_val)
        safe_width = min(l_val, w_val)
        lw_ratio = safe_length / safe_width if safe_width > 0 else 0.0

        # 1. Build classifier feature dictionary
        clf_dict = {
            "VH_Length_mm": safe_length,
            "VH_Width_mm": safe_width,
            "VH_Depth_mm": float(depth_mm),
            "VH_L_W_Ratio": float(lw_ratio),
        }
        for col in self._classifier_cols:
            if col.startswith("Gem_Type_"):
                clf_dict[col] = 1 if col == f"Gem_Type_{gt_norm}" else 0

        clf_df = pd.DataFrame([clf_dict])[self._classifier_cols]

        # 2. Optimal Cut Classification
        cut_pred = str(self._cut_model.predict(clf_df)[0])
        probabilities_arr = self._cut_model.predict_proba(clf_df)[0]
        classes = list(self._cut_model.classes_)
        proba_dict = {
            str(c): round(float(p) * 100, 1)
            for c, p in zip(classes, probabilities_arr)
        }
        confidence = float(max(probabilities_arr) * 100)

        # 3. Multi-cut Yield Regression (for all cuts + requested/optimal cut)
        cut_options = ["Round", "Oval", "Cushion", "Emerald"]
        cut_yields: Dict[str, float] = {}

        for cut_name in cut_options:
            reg_dict = dict(clf_dict)
            for col in self._regressor_cols:
                if col.startswith("Requested_Cut_"):
                    reg_dict[col] = 1 if col == f"Requested_Cut_{cut_name}" else 0
            reg_df = pd.DataFrame([reg_dict])[self._regressor_cols]
            cut_yields[cut_name] = round(float(self._yield_model.predict(reg_df)[0]), 2)

        target_cut = requested_cut if (requested_cut and requested_cut in cut_yields) else cut_pred
        yield_pct = cut_yields.get(target_cut, cut_yields.get(cut_pred, 0.0))

        return {
            "cut": str(cut_pred),
            "yield_pct": round(yield_pct, 2),
            "confidence": round(confidence, 1),
            "probabilities": proba_dict,
            "cut_yields": cut_yields,
            "lw_ratio": round(lw_ratio, 3),
        }



_predictor_instance: Optional[CutPredictor] = None


def get_predictor() -> CutPredictor:
    """FastAPI dependency / singleton getter. Loads models once."""
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = CutPredictor()
        _predictor_instance.load()
    return _predictor_instance