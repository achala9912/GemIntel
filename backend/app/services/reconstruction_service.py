import os
import io
import cv2
import joblib
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.ndimage import gaussian_filter
from skimage import measure

# Configuration
DENSITY_MAP = {
    'blue_sapphire': 4.00,
    'spinel': 3.60,
    'topaz': 3.53
}

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models", "cut")

# Global variables for models (loaded lazily)
_scaler = None
_rf_cut = None
_rf_yield = None
_label_encoder = None
_models_loaded = False

try:
    from rembg import remove
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False

def load_cut_models():
    global _scaler, _rf_cut, _rf_yield, _label_encoder, _models_loaded
    if not _models_loaded:
        try:
            _scaler = joblib.load(os.path.join(MODELS_DIR, "scaler.pkl"))
            _rf_cut = joblib.load(os.path.join(MODELS_DIR, "rf_cut_model.pkl"))
            _rf_yield = joblib.load(os.path.join(MODELS_DIR, "rf_yield_model.pkl"))
            _label_encoder = joblib.load(os.path.join(MODELS_DIR, "cut_label_encoder.pkl"))
            _models_loaded = True
            print("Successfully loaded cut prediction Random Forest models.")
        except Exception as e:
            print(f"[Error] Failed to load cut prediction models: {e}")
            _models_loaded = False

# Robust fallback background removal when rembg is not available
def get_mask_fallback(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    
    # Sample corners to determine background type (light vs dark)
    corners = [gray[0, 0], gray[0, w-1], gray[h-1, 0], gray[h-1, w-1]]
    bg_val = float(np.mean(corners))
    
    if bg_val > 127:
        # Light background: gemstone is darker than background
        _, thresh = cv2.threshold(gray, int(bg_val - 25), 255, cv2.THRESH_BINARY_INV)
    else:
        # Dark background: gemstone is lighter than background
        _, thresh = cv2.threshold(gray, int(bg_val + 15), 255, cv2.THRESH_BINARY)
        
    # Clean noise with morphological closing and opening
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    
    # Fill any inner holes by finding external contours and drawing them solid
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled = np.zeros_like(thresh)
    if contours:
        # Get only the largest contour, which corresponds to the gemstone
        largest = max(contours, key=cv2.contourArea)
        cv2.drawContours(filled, [largest], -1, 255, thickness=cv2.FILLED)
    else:
        filled = thresh
        
    return filled

def remove_background(img):
    if REMBG_AVAILABLE:
        try:
            # Convert BGR (OpenCV) to RGBA using rembg
            no_bg = remove(img)
            # no_bg is an RGBA image. Convert to grayscale and threshold alpha channel
            gray = cv2.cvtColor(no_bg, cv2.COLOR_BGRA2GRAY)
            _, binary_mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
            
            # Hole filling logic
            contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            filled_mask = np.zeros_like(binary_mask)
            if contours:
                cv2.drawContours(filled_mask, contours, -1, 255, thickness=cv2.FILLED)
                return filled_mask
            return binary_mask
        except Exception as e:
            print(f"rembg background removal failed: {e}. Falling back to classical CV.")
    
    return get_mask_fallback(img)

def normalize_mask(mask, size=128, object_scale=0.85):
    # Ensure binary format (0 or 255)
    mask = (mask > 127).astype(np.uint8) * 255
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if len(contours) == 0:
        return np.zeros((size, size), dtype=bool)

    # Crop to bounding box of the largest contour
    c = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(c)
    crop = mask[y:y+h, x:x+w]

    # Calculate scale factor
    target = int(size * object_scale)
    scale = min(target / w, target / h)

    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))

    resized = cv2.resize(crop, (new_w, new_h), interpolation=cv2.INTER_AREA)

    # Place resized mask on a centered square canvas
    canvas = np.zeros((size, size), dtype=np.uint8)
    start_x = (size - new_w) // 2
    start_y = (size - new_h) // 2
    canvas[start_y:start_y + new_h, start_x:start_x + new_w] = resized

    return canvas > 127

def reconstruct_visual_hull(images_list, size=128):
    """
    images_list: list of OpenCV BGR images
    """
    center = size / 2.0
    x = np.arange(size) - center
    y = np.arange(size) - center
    z = np.arange(size) - center
    X, Y, Z = np.meshgrid(x, y, z, indexing='ij')

    # Initial voxel volume: a sphere
    radius = size * 0.48
    voxels = (X**2 + Y**2 + Z**2) < radius**2

    num_masks = len(images_list)
    if num_masks == 0:
        return voxels

    angle_step = 360.0 / num_masks
    scale = 1.0

    for i, img in enumerate(images_list):
        # 1. Background removal to obtain binary mask
        mask = remove_background(img)
        
        # 2. Normalize and scale mask to target grid size
        mask_res = normalize_mask(mask, size=size)
        
        # 3. Project voxel grid from current rotation angle
        angle_rad = np.radians(i * angle_step)
        cos_a = np.cos(angle_rad)
        sin_a = np.sin(angle_rad)

        proj_u = ((X * cos_a + Z * sin_a) * scale + center)
        proj_v = (Y * scale + center)

        # Clip values to ensure they reside within the mask bounds
        proj_u = np.clip(proj_u.astype(np.int32), 0, size - 1)
        proj_v = np.clip(proj_v.astype(np.int32), 0, size - 1)

        # Intersect with visual hull
        inside = mask_res[proj_v, proj_u]
        inside = ndimage.binary_dilation(inside, iterations=1)

        voxels &= inside

    return voxels

def extract_metrics(voxels, gem_type, weight_ct):
    norm_type = gem_type.lower().replace(" ", "_")
    density = DENSITY_MAP.get(norm_type, 3.60)
    
    # Calculate target real volume in mm3 from carat weight (density-based mapping)
    target_real_vol_mm3 = ((weight_ct * 0.2) / density) * 1000

    vh_volume_voxels = int(np.sum(voxels))
    if vh_volume_voxels == 0:
        return {
            'Stone_ID': 'predicted_stone',
            'Gem_Type': gem_type,
            'Real_Weight_ct': weight_ct,
            'VH_Length_mm': 0.0,
            'VH_Width_mm': 0.0,
            'VH_Depth_mm': 0.0,
            'VH_L_W_Ratio': 0.0,
            'VH_Volume_voxels': 0,
            'VH_Volume_mm3': 0.0,
            'Est_Real_Vol_mm3': 0.0,
            'VH_Accuracy_%': 0.0
        }

    # Dynamic Voxel Scale (Reverse Calibration)
    dynamic_scale_mm = (target_real_vol_mm3 / vh_volume_voxels) ** (1.0 / 3.0)

    # Dimensions in voxels
    z_coords, y_coords, x_coords = np.where(voxels)
    if len(x_coords) == 0:
        return {
            'Stone_ID': 'predicted_stone',
            'Gem_Type': gem_type,
            'Real_Weight_ct': weight_ct,
            'VH_Length_mm': 0.0,
            'VH_Width_mm': 0.0,
            'VH_Depth_mm': 0.0,
            'VH_L_W_Ratio': 0.0,
            'VH_Volume_voxels': 0,
            'VH_Volume_mm3': 0.0,
            'Est_Real_Vol_mm3': 0.0,
            'VH_Accuracy_%': 0.0
        }

    length_vox = float(x_coords.max() - x_coords.min())
    width_vox = float(y_coords.max() - y_coords.min())
    depth_vox = float(z_coords.max() - z_coords.min())

    # Sort to ensure Length > Width > Depth convention
    dimensions_vox = sorted([length_vox, width_vox, depth_vox], reverse=True)

    vh_length_mm = dimensions_vox[0] * dynamic_scale_mm
    vh_width_mm = dimensions_vox[1] * dynamic_scale_mm
    vh_depth_mm = dimensions_vox[2] * dynamic_scale_mm
    vh_l_w_ratio = vh_length_mm / vh_width_mm if vh_width_mm > 0 else 0

    return {
        'Stone_ID': 'predicted_stone',
        'Gem_Type': gem_type,
        'Real_Weight_ct': weight_ct,
        'VH_Length_mm': round(float(vh_length_mm), 2),
        'VH_Width_mm': round(float(vh_width_mm), 2),
        'VH_Depth_mm': round(float(vh_depth_mm), 2),
        'VH_L_W_Ratio': round(float(vh_l_w_ratio), 2),
        'VH_Volume_voxels': vh_volume_voxels,
        'VH_Volume_mm3': round(float(target_real_vol_mm3), 2),
        'Est_Real_Vol_mm3': round(float(target_real_vol_mm3), 2),
        'VH_Accuracy_%': 100.0  # Calibration forces 100% volume match
    }

def predict_cut_and_yield(metrics):
    """
    metrics: dictionary returned from extract_metrics
    """
    load_cut_models()
    
    if not _models_loaded:
        # Fallback return value if models can't be loaded
        # Choose default shapes based on ratio
        ratio = metrics.get('VH_L_W_Ratio', 1.0)
        shape = "Round" if ratio < 1.15 else ("Oval" if ratio < 1.35 else "Emerald")
        return {
            "predicted_shape": shape,
            "predicted_yield_pct": 65.0
        }

    try:
        # Columns expected: ['VH_Length_mm', 'VH_Width_mm', 'VH_Depth_mm', 'VH_L_W_Ratio', 
        #                    'Gem_Type_blue_sapphire', 'Gem_Type_spinel', 'Gem_Type_topaz']
        gem_type = metrics.get('Gem_Type', 'blue_sapphire').lower().replace(" ", "_")
        
        row_data = {
            'VH_Length_mm': [metrics.get('VH_Length_mm', 0.0)],
            'VH_Width_mm': [metrics.get('VH_Width_mm', 0.0)],
            'VH_Depth_mm': [metrics.get('VH_Depth_mm', 0.0)],
            'VH_L_W_Ratio': [metrics.get('VH_L_W_Ratio', 0.0)],
            'Gem_Type_blue_sapphire': [1 if gem_type == 'blue_sapphire' else 0],
            'Gem_Type_spinel': [1 if gem_type == 'spinel' else 0],
            'Gem_Type_topaz': [1 if gem_type == 'topaz' else 0]
        }
        
        df = pd.DataFrame(row_data)
        
        # Scaling
        scaled_data = _scaler.transform(df)
        
        # Shape Prediction
        pred_cut_idx = _rf_cut.predict(scaled_data)[0]
        pred_cut_name = _label_encoder.inverse_transform([pred_cut_idx])[0]
        
        # Yield Prediction
        pred_yield = float(_rf_yield.predict(scaled_data)[0])
        
        return {
            "predicted_shape": pred_cut_name,
            "predicted_yield_pct": round(pred_yield, 2)
        }
    except Exception as e:
        print(f"Error predicting cut and yield: {e}")
        ratio = metrics.get('VH_L_W_Ratio', 1.0)
        shape = "Round" if ratio < 1.15 else ("Oval" if ratio < 1.35 else "Emerald")
        return {
            "predicted_shape": shape,
            "predicted_yield_pct": 65.0
        }

def generate_mesh(voxels):
    if np.sum(voxels) == 0:
        return {"vertices": [], "faces": []}

    try:
        smooth = gaussian_filter(voxels.astype(float), sigma=0.8)
        verts, faces, _, _ = measure.marching_cubes(smooth, level=0.5)

        # Center mesh around coordinate origin
        center = verts.mean(axis=0)
        verts = verts - center

        # Normalize boundaries to fit perfectly within [-1.0, 1.0] workspace range
        max_val = np.max(np.abs(verts))
        if max_val > 0:
            verts = verts / max_val

        return {
            "vertices": verts.tolist(),
            "faces": faces.tolist()
        }
    except Exception as e:
        print(f"Error running marching cubes mesh generator: {e}")
        return {"vertices": [], "faces": []}
