"""Color prediction service — DINOv2 multi-head (hue + saturation/intensity)."""
import io
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms
from transformers import Dinov2Model

from app.config import COLOR_MODEL_PATH

IMG_SIZE = 518
_IMAGENET_MEAN = [0.485, 0.456, 0.406]
_IMAGENET_STD = [0.229, 0.224, 0.225]


class MultiHeadColorClassifier(nn.Module):
    def __init__(self, num_hues: int, num_sats: int, dropout: float = 0.3):
        super().__init__()
        self.backbone = Dinov2Model.from_pretrained("facebook/dinov2-base")
        for p in self.backbone.parameters():
            p.requires_grad = False
        h = 768
        self.hue_head = nn.Sequential(
            nn.Linear(h, 512), nn.BatchNorm1d(512), nn.ReLU(),
            nn.Dropout(dropout), nn.Linear(512, 256), nn.ReLU(),
            nn.Dropout(dropout * 0.5), nn.Linear(256, num_hues),
        )
        self.sat_head = nn.Sequential(
            nn.Linear(h, 256), nn.BatchNorm1d(256), nn.ReLU(),
            nn.Dropout(dropout), nn.Linear(256, num_sats),
        )

    def forward(self, x):
        feats = self.backbone(x).last_hidden_state[:, 0]
        return self.hue_head(feats), self.sat_head(feats)


_color_model: MultiHeadColorClassifier | None = None
_color_transform: transforms.Compose | None = None
_hue_classes: list[str] | None = None
_sat_classes: list[str] | None = None
_device: torch.device | None = None


def load_color_model() -> None:
    global _color_model, _color_transform, _hue_classes, _sat_classes, _device
    if _color_model is not None:
        return
    _device = torch.device(
        "mps" if torch.backends.mps.is_available()
        else "cuda" if torch.cuda.is_available() else "cpu"
    )
    print(f"Loading color model from {COLOR_MODEL_PATH} on {_device}...")
    ckpt = torch.load(COLOR_MODEL_PATH, map_location=_device, weights_only=False)
    _hue_classes = ckpt["hue_classes"]
    _sat_classes = ckpt["sat_classes"]
    _color_model = MultiHeadColorClassifier(len(_hue_classes), len(_sat_classes)).to(_device)
    _color_model.load_state_dict(ckpt["model_state_dict"])
    _color_model.eval()
    _color_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(_IMAGENET_MEAN, _IMAGENET_STD),
    ])
    print(f"  hues: {_hue_classes}")
    print(f"  saturations: {_sat_classes}")


def predict_color_one(image: Image.Image) -> dict:
    if _color_model is None:
        load_color_model()
    x = _color_transform(image).unsqueeze(0).to(_device)
    with torch.no_grad():
        hue_logits, sat_logits = _color_model(x)
    hue_probs = torch.softmax(hue_logits, dim=1)[0].cpu().numpy()
    sat_probs = torch.softmax(sat_logits, dim=1)[0].cpu().numpy()
    return {
        "hue_probs": {n: float(hue_probs[i]) for i, n in enumerate(_hue_classes)},
        "saturation_probs": {n: float(sat_probs[i]) for i, n in enumerate(_sat_classes)},
    }


def predict_color_bytes(img_bytes: bytes) -> dict:
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return predict_color_one(img)


def color_classes() -> dict:
    return {"hue": _hue_classes or [], "saturation": _sat_classes or []}
