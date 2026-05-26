import os

# Base directory of the project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Model Paths
MODELS_DIR = os.path.join(BASE_DIR, "models")
EFF_MODEL_PATH = os.path.join(MODELS_DIR, "efficientnet_b4.pth")
GEM_PIPELINE_PATH = os.path.join(MODELS_DIR, "xgboost_model.pkl")

# Ensemble Weights
W_EFF = 0.6
W_XGB = 0.4

# AI Filter Configuration
AI_FILTER_MODEL_PATH = os.path.join(MODELS_DIR, "ai-filter.pt")
AI_FILTER_THRESHOLD = 0.6
W_FREQ = 0.3
W_CNN = 0.4
W_META = 0.3