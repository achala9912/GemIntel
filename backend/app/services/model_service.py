import torch
import timm
import joblib
import numpy as np
from PIL import Image
from app.config import EFF_MODEL_PATH, GEM_PIPELINE_PATH, W_EFF, W_XGB 

# Global variables to hold models in memory
eff_model = None
gem_model = None
scaler = None
label_encoder = None

def load_all_models():
    """Triggered on app startup to load models into memory."""
    global eff_model, gem_model, scaler, label_encoder
    
    print("Building timm EfficientNet-B4 Skeleton...")
    eff_model = timm.create_model("efficientnet_b4", pretrained=False, num_classes=2)
    
    print("Loading .pth Weights into Skeleton...")
    state_dict = torch.load(EFF_MODEL_PATH, map_location=torch.device('cpu'))
    eff_model.load_state_dict(state_dict)
    eff_model.eval() 
    
    print("Loading ML Pipeline Bundle...")
    pipeline_bundle = joblib.load(GEM_PIPELINE_PATH)
    gem_model = pipeline_bundle["model"]
    scaler = pipeline_bundle["scaler"]
    label_encoder = pipeline_bundle["label_encoder"]
    
    # Load AI filter model
    from app.services.ai_filter_service import load_ai_filter_model
    load_ai_filter_model()
    
    print("[Assets] All assets loaded successfully.")

def run_inference(base_image: Image.Image):
    """Executes both models, calculates weighted ensemble, and returns payload."""
    global eff_model, gem_model, scaler, label_encoder
    
    if not eff_model or not gem_model:
        raise RuntimeError("Models are not loaded into memory.")

    # --- BRANCH 1: EfficientNet ---
    from app.utils.image_utils import prepare_for_efficientnet, prepare_for_xgboost
    eff_input_tensor = prepare_for_efficientnet(base_image)
    
    with torch.no_grad(): 
        outputs = eff_model(eff_input_tensor)
        eff_probs = torch.softmax(outputs, dim=1)[0].numpy() # Extract probabilities as numpy array
        
    eff_pred_idx = int(np.argmax(eff_probs))
    eff_label = label_encoder.inverse_transform([eff_pred_idx])[0]
    
    # --- BRANCH 2: XGBoost ---
    xgb_raw_features = prepare_for_xgboost(base_image)
    scaled_features = scaler.transform(xgb_raw_features)
    
    xgb_probs = gem_model.predict_proba(scaled_features)[0] 
    
    xgb_pred_idx = int(np.argmax(xgb_probs))
    xgb_label = label_encoder.inverse_transform([xgb_pred_idx])[0]

    # --- THE ENSEMBLE ---
    
    # Calculate the weighted average of probabilities for both classes [Class 0, Class 1]
    # Weighted probabilities for each class
    final_natural = (W_EFF * eff_probs[0]) + (W_XGB * xgb_probs[0])
    final_synthetic = (W_EFF * eff_probs[1]) + (W_XGB * xgb_probs[1])

    # Combined probability array
    ensemble_probs = np.array([final_natural, final_synthetic])

    # Final prediction
    final_pred_idx = int(np.argmax(ensemble_probs))
    final_label = label_encoder.inverse_transform([final_pred_idx])[0]
    final_confidence = float(ensemble_probs[final_pred_idx])
    
    return {
        "status": "success",
        "ensemble_result": {
            "prediction": final_label,
            "confidence": round(final_confidence, 4)
        },
        "breakdown": {
            "efficientnet": {
                "prediction": eff_label,
                "confidence": round(float(eff_probs[eff_pred_idx]), 4),
                "weight_used": W_EFF
            },
            "xgboost": {
                "prediction": xgb_label,
                "confidence": round(float(xgb_probs[xgb_pred_idx]), 4),
                "weight_used": W_XGB
            }
        }
    }