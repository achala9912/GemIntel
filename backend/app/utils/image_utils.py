import numpy as np
import cv2
import torch
from skimage.feature import local_binary_pattern, graycomatrix, graycoprops
from torchvision import transforms
from PIL import Image

# EfficientNet Preprocessing Pipeline
transform_eff = transforms.Compose([
    transforms.Resize((380, 380)), 
    transforms.ToTensor(), 
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def prepare_for_efficientnet(image: Image.Image) -> torch.Tensor:
    """Prepares image specifically for the deep learning branch."""
    tensor = transform_eff(image)
    return tensor.unsqueeze(0) 

def extract_geometric_features(gray):
    _, thresh = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        cnt = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(cnt)
        perimeter = cv2.arcLength(cnt, True)
        circularity = (4 * np.pi * area) / (perimeter**2 + 1e-6)
        return np.array([area, perimeter, circularity])
    return np.zeros(3)

def extract_edge_features(gray):
    edges = cv2.Canny(gray, 100, 200)
    edge_density = np.sum(edges) / (gray.shape[0] * gray.shape[1])
    return np.array([edge_density])

def prepare_for_xgboost(image: Image.Image) -> np.ndarray:
    """Extracts the exact 538 features required for the XGBoost ML Pipeline."""
    img_rgb = np.array(image)
    img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
    img = cv2.resize(img_bgr, (224, 224))
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    lbp = local_binary_pattern(gray, 16, 2, method="uniform")
    lbp_hist, _ = np.histogram(lbp.ravel(), bins=18, range=(0, 18), density=True)

    glcm = graycomatrix(gray, [1], [0], levels=256, symmetric=True, normed=True)
    glcm_feats = np.array([graycoprops(glcm, p)[0, 0] for p in ['contrast', 'correlation', 'energy', 'homogeneity']])

    color_hist = cv2.calcHist([hsv], [0, 1, 2], None, [8, 8, 8], [0, 180, 0, 256, 0, 256])
    color_feats = cv2.normalize(color_hist, color_hist).flatten()

    geo_feats = extract_geometric_features(gray)
    edge_feats = extract_edge_features(gray)

    features = np.hstack([lbp_hist, glcm_feats, color_feats, geo_feats, edge_feats])
    return features.reshape(1, -1)