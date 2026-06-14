"""
Valuation Service - Price Prediction for Gems using XGBoost and LightGBM
"""
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List
import math
from app.config import (
    XGB_VALUATION_MODEL_PATH,
    LGBM_VALUATION_MODEL_PATH,
    FEATURE_NAMES_PATH,
    W_VALUATION_XGB,
    W_VALUATION_LGBM
)

# Global variables to hold models in memory
xgb_valuation_model = None
lgbm_valuation_model = None
feature_names = None


def load_valuation_models():
    """Load XGBoost and LightGBM models for price prediction."""
    global xgb_valuation_model, lgbm_valuation_model, feature_names
    
    try:
        print("[ValuationService] Loading valuation models...")
        xgb_valuation_model = joblib.load(XGB_VALUATION_MODEL_PATH)
        print(f"✓ XGBoost model loaded from {XGB_VALUATION_MODEL_PATH}")
        
        lgbm_valuation_model = joblib.load(LGBM_VALUATION_MODEL_PATH)
        print(f"✓ LightGBM model loaded from {LGBM_VALUATION_MODEL_PATH}")
        
        feature_names = joblib.load(FEATURE_NAMES_PATH)
        print(f"✓ Feature names loaded: {len(feature_names)} features")
        print(f"   Features: {feature_names}")
        
        print("[ValuationService] All valuation models loaded successfully.")
    except Exception as e:
        print(f"[Error] Failed to load valuation models: {e}")
        raise


def predict_price(gem_factors: Dict, economic_factors: Dict) -> Dict:
    """
    Predict gem price using ensemble of XGBoost and LightGBM models.
    
    Args:
        gem_factors: Dict with keys like 'weight_ct', 'gem_type', 'colour_intensity', 
                     'clarity', 'shape', 'cut', 'enhancement'
        economic_factors: Dict with keys like 'ccpi', 'ccpi_yoy', 'slfr', 'gold_lkr', 
                         'gdp_growth', 'exchange_rate'
    
    Returns:
        Dict with predicted price, confidence, and model breakdowns
    """
    global xgb_valuation_model, lgbm_valuation_model, feature_names
    
    if xgb_valuation_model is None or lgbm_valuation_model is None:
        raise RuntimeError("Valuation models are not loaded. Call load_valuation_models() first.")
    
    # Build feature vector
    feature_dict = _build_feature_vector(gem_factors, economic_factors)
    
    # Create DataFrame with proper feature order
    X = pd.DataFrame([feature_dict])
    
    # Ensure features are in the correct order and all present
    X = X.reindex(columns=feature_names, fill_value=0)
    
    # Make predictions
    xgb_log_price = float(xgb_valuation_model.predict(X)[0])
    lgbm_log_price = float(lgbm_valuation_model.predict(X)[0])
    
    # Ensemble prediction (weighted average)
    ensemble_log_price = float((W_VALUATION_XGB * xgb_log_price) + (W_VALUATION_LGBM * lgbm_log_price))
    
    # Convert from log space back to actual price
    predicted_price = float(math.exp(ensemble_log_price))
    xgb_price = float(math.exp(xgb_log_price))
    lgbm_price = float(math.exp(lgbm_log_price))
    
    # Calculate confidence (normalized probability)
    # Using the inverse of the coefficient of variation as a confidence measure
    predictions = [xgb_price, lgbm_price]
    mean_pred = float(np.mean(predictions))
    std_pred = float(np.std(predictions))
    confidence = float(1 - (std_pred / mean_pred) if mean_pred > 0 else 0.5)
    confidence = float(max(0, min(1, confidence)))  # Clamp between 0 and 1
    
    return {
        "status": "success",
        "predicted_price_lkr": round(predicted_price, 2),
        "predicted_log_price": round(ensemble_log_price, 4),
        "confidence": round(confidence, 4),
        "breakdown": {
            "xgboost": {
                "predicted_price_lkr": round(xgb_price, 2),
                "predicted_log_price": round(xgb_log_price, 4),
            },
            "lightgbm": {
                "predicted_price_lkr": round(lgbm_price, 2),
                "predicted_log_price": round(lgbm_log_price, 4),
            }
        },
        "input_factors": {
            "gem_factors": gem_factors,
            "economic_factors": economic_factors
        }
    }


def _build_feature_vector(gem_factors: Dict, economic_factors: Dict) -> Dict:
    """
    Build a feature vector from gem and economic factors.
    Handles one-hot encoding for categorical features.
    """
    features = {}
    
    # Weight feature (log-transformed in the model)
    if 'weight_ct' in gem_factors:
        weight_ct = gem_factors['weight_ct']
        features['Log_Weight_ct'] = math.log(weight_ct) if weight_ct > 0 else 0
    
    # Gem Type (one-hot encoded)
    gem_type = gem_factors.get('gem_type', '')
    features['Gem_Type_Ceylon Blue Spinel'] = 1 if gem_type == 'Ceylon Blue Spinel' else 0
    features['Gem_Type_Ceylon Blue Topaz'] = 1 if gem_type == 'Ceylon Blue Topaz' else 0
    
    # Colour Intensity (one-hot encoded)
    colour_intensity = gem_factors.get('colour_intensity', '')
    features['Colour_Intensity_Intense'] = 1 if colour_intensity == 'Intense' else 0
    features['Colour_Intensity_Royal Blue'] = 1 if colour_intensity == 'Royal Blue' else 0
    features['Colour_Intensity_Vivid'] = 1 if colour_intensity == 'Vivid' else 0
    
    # Clarity (one-hot encoded)
    clarity = gem_factors.get('clarity', '')
    features['Clarity_IF'] = 1 if clarity == 'IF' else 0
    features['Clarity_VS1'] = 1 if clarity == 'VS1' else 0
    features['Clarity_VS2'] = 1 if clarity == 'VS2' else 0
    features['Clarity_VVS1'] = 1 if clarity == 'VVS1' else 0
    features['Clarity_VVS2'] = 1 if clarity == 'VVS2' else 0
    
    # Shape (one-hot encoded)
    shape = gem_factors.get('shape', '')
    features['Shape_Cushion'] = 1 if shape == 'Cushion' else 0
    features['Shape_Emerald Cut'] = 1 if shape == 'Emerald Cut' else 0
    features['Shape_Heart'] = 1 if shape == 'Heart' else 0
    features['Shape_Marquise'] = 1 if shape == 'Marquise' else 0
    features['Shape_Oval'] = 1 if shape == 'Oval' else 0
    features['Shape_Pear'] = 1 if shape == 'Pear' else 0
    features['Shape_Radiant'] = 1 if shape == 'Radiant' else 0
    features['Shape_Round'] = 1 if shape == 'Round' else 0
    
    # Cut (one-hot encoded)
    cut = gem_factors.get('cut', '')
    features['Cut_Emerald Cut'] = 1 if cut == 'Emerald Cut' else 0
    features['Cut_Mixed Brilliant Cut'] = 1 if cut == 'Mixed Brilliant Cut' else 0
    features['Cut_Modified Brilliant Cut'] = 1 if cut == 'Modified Brilliant Cut' else 0
    features['Cut_Radiant Cut'] = 1 if cut == 'Radiant Cut' else 0
    features['Cut_Step Cut'] = 1 if cut == 'Step Cut' else 0
    
    # Enhancement (one-hot encoded)
    enhancement = gem_factors.get('enhancement', '')
    features['Enhancement_Unheated'] = 1 if enhancement == 'Unheated' else 0
    
    # Economic Factors (continuous)
    features['CCPI'] = economic_factors.get('ccpi', 95.0)
    features['CCPI_YoY'] = economic_factors.get('ccpi_yoy', 4.5)
    features['SLFR'] = economic_factors.get('slfr', 8.5)
    features['Gold_LKR'] = economic_factors.get('gold_lkr', 206000)
    features['GDP_Growth'] = economic_factors.get('gdp_growth', 2.5)
    features['Monthly_Avg_Exchange_Rate'] = economic_factors.get('exchange_rate', 155.0)
    
    return features


def get_factor_options() -> Dict:
    """
    Get all available options for gem and economic factors.
    Useful for populating frontend dropdowns.
    """
    return {
        "gem_factors": {
            "gem_type": ["Ceylon Blue Spinel", "Ceylon Blue Topaz"],
            "colour_intensity": ["Intense", "Royal Blue", "Vivid"],
            "clarity": ["IF", "VS1", "VS2", "VVS1", "VVS2"],
            "shape": ["Cushion", "Emerald Cut", "Heart", "Marquise", "Oval", "Pear", "Radiant", "Round"],
            "cut": ["Emerald Cut", "Mixed Brilliant Cut", "Modified Brilliant Cut", "Radiant Cut", "Step Cut"],
            "enhancement": ["Unheated"],
            "weight_ct": {"min": 0.1, "max": 5.0, "unit": "carats"}
        },
        "economic_factors": {
            "ccpi": {"min": 80, "max": 120, "unit": "index", "description": "Consumer Cost Price Index"},
            "ccpi_yoy": {"min": 0, "max": 15, "unit": "percent", "description": "CCPI Year-over-Year"},
            "slfr": {"min": 5, "max": 15, "unit": "percent", "description": "Sri Lanka Floating Rate"},
            "gold_lkr": {"min": 180000, "max": 250000, "unit": "LKR", "description": "Gold Price in LKR"},
            "gdp_growth": {"min": -5, "max": 10, "unit": "percent", "description": "GDP Growth Rate"},
            "exchange_rate": {"min": 140, "max": 170, "unit": "LKR/USD", "description": "Monthly Average Exchange Rate"}
        }
    }
