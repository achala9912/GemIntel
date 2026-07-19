import os
import joblib
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms
import torchvision.models as models
from app.config import GLOBAL_DOMAIN_FILTER_PATH, AI_FILTER_MODEL_PATH

_feature_extractor = None
_domain_filter = None
_transform = None
_device = None

def load_domain_filter_models():
    """Load the feature extractor and domain filter model into memory."""
    global _feature_extractor, _domain_filter, _transform, _device
    
    if _feature_extractor is not None and _domain_filter is not None:
        return
        
    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # 1. Load the EfficientNet-B0 model for feature extraction
    print(f"[DomainFilter] Loading EfficientNet-B0 feature extractor from {AI_FILTER_MODEL_PATH}...")
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, 2)
    
    state = torch.load(AI_FILTER_MODEL_PATH, map_location=_device)
    if isinstance(state, dict) and "model_state_dict" in state:
        state = state["model_state_dict"]
    elif isinstance(state, dict) and "state_dict" in state:
        state = state["state_dict"]
        
    model.load_state_dict(state)
    model.eval()
    
    # Replace classifier with Identity to output 1280 features
    model.classifier = nn.Identity()
    _feature_extractor = model.to(_device)
    
    # 2. Load the OneClassSVM domain filter
    print(f"[DomainFilter] Loading OneClassSVM filter from {GLOBAL_DOMAIN_FILTER_PATH}...")
    _domain_filter = joblib.load(GLOBAL_DOMAIN_FILTER_PATH)
    
    # 3. Define the transform matching the training configuration
    _transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    
    print("[DomainFilter] Models loaded successfully.")

def validate_gem_image(image: Image.Image) -> bool:
    """
    Validate if the given PIL Image contains a gemstone.
    Returns:
        True if it is a valid gem input, False otherwise.
    """
    global _feature_extractor, _domain_filter, _transform, _device
    
    if _feature_extractor is None or _domain_filter is None:
        load_domain_filter_models()
        
    # Preprocess image
    tensor = _transform(image).unsqueeze(0).to(_device)
    
    with torch.no_grad():
        features = _feature_extractor(tensor).cpu().numpy()
        
    # Categorize as non-gem (outlier) if score is below 0
    score = _domain_filter.decision_function(features)[0]
    is_valid = bool(score >= 0)
    
    print(f"[DomainFilter] Validation score: {score:.8f}, is_valid: {is_valid}")
    return is_valid, float(score)
