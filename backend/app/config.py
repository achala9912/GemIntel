import os

# Base directory of the project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Model Paths
MODELS_DIR = os.path.join(BASE_DIR, "models")
EFF_MODEL_PATH = os.path.join(MODELS_DIR, "efficientnet_b4.pth")
GEM_PIPELINE_PATH = os.path.join(MODELS_DIR, "xgboost_model.pkl")
CUT_MODEL_PATH = os.path.join(MODELS_DIR, "cut_best_finetune.pt")
COLOR_MODEL_PATH = os.path.join(MODELS_DIR, "color_best_stage1.pt")

# Ensemble Weights (authentication endpoint)
W_EFF = 0.6
W_XGB = 0.4

# Gem types shown in the Identification dropdown.
# Color model (M02) is trained on blue varieties, so we restrict the list.
GEM_TYPES = [
    "Blue Sapphire",
    "Blue Spinel",
    "Blue Topaz",
]