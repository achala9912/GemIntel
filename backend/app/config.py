import os

# Base directory of the project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Model Paths
MODELS_DIR = os.path.join(BASE_DIR, "models")
VALUE_MODELS_DIR = os.path.join(MODELS_DIR, "value")
EFF_MODEL_PATH = os.path.join(VALUE_MODELS_DIR, "efficientnet_b4.pth")
GEM_PIPELINE_PATH = os.path.join(MODELS_DIR, "xgboost_model.pkl")

# Valuation Model Paths
XGB_VALUATION_MODEL_PATH = os.path.join(VALUE_MODELS_DIR, "xgb_model.pkl")
LGBM_VALUATION_MODEL_PATH = os.path.join(VALUE_MODELS_DIR, "lgbm_model.pkl")
FEATURE_NAMES_PATH = os.path.join(VALUE_MODELS_DIR, "feature_names.pkl")

# Ensemble Weights
W_EFF = 0.6
W_XGB = 0.4

# Valuation Ensemble Weights
W_VALUATION_XGB = 0.5
W_VALUATION_LGBM = 0.5

# AI Filter Configuration
AI_FILTER_MODEL_PATH = os.path.join(MODELS_DIR, "ai-filter.pt")
AI_FILTER_THRESHOLD = 0.6
W_FREQ = 0.3
W_CNN = 0.4
W_META = 0.3

# Identification Model Paths (M02 — DINOv2 cut + color classifiers)
CUT_MODEL_PATH = os.path.join(MODELS_DIR, "cut_best_finetune.pt")
COLOR_MODEL_PATH = os.path.join(MODELS_DIR, "color_best_stage1.pt")

# Gem types shown in the Identification dropdown.
# Color model (M02) is trained on blue varieties, so we restrict the list.
GEM_TYPES = [
    "Blue Sapphire",
    "Blue Spinel",
    "Blue Topaz",
]
