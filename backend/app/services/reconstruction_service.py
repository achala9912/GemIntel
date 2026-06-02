import os
import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Any, List

from rembg import remove
from scipy import ndimage
from scipy.ndimage import gaussian_filter
from skimage import measure


DENSITY_MAP = {
    "blue_sapphire": 4.00,
    "spinel":        3.60,
    "topaz":         3.53,
}

GRID_SIZE = 128



# STEP 1 — BACKGROUND REMOVAL + MASK GENERATION
def generate_mask(input_image_path: str, output_mask_path: str) -> bool:
    """
    Remove background from a single image and save a binary mask.
    Uses rembg + hole filling (same as your Colab cell).
    """
    img = cv2.imread(input_image_path)
    if img is None:
        return False

    # rembg removes background → RGBA output
    no_bg = remove(img)

    # Convert to grayscale + binary threshold
    gray = cv2.cvtColor(no_bg, cv2.COLOR_BGRA2GRAY)
    _, binary_mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)

    # Hole filling — fill any gaps inside the gem outline
    contours, _ = cv2.findContours(
        binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    filled_mask = np.zeros_like(binary_mask)
    cv2.drawContours(filled_mask, contours, -1, 255, thickness=cv2.FILLED)

    cv2.imwrite(output_mask_path, filled_mask)
    return True


def generate_masks_for_session(
    upload_dir: str,
    masks_dir: str,
    check_cancelled = None,
) -> List[str]:
    """
    Process every image in upload_dir → write binary mask to masks_dir.
    Returns the list of generated mask paths.
    """
    os.makedirs(masks_dir, exist_ok=True)

    valid_exts = {".png", ".jpg", ".jpeg", ".webp"}
    image_files = sorted([
        f for f in os.listdir(upload_dir)
        if Path(f).suffix.lower() in valid_exts
    ])

    if not image_files:
        raise ValueError(f"No images found in {upload_dir}")

    mask_paths = []
    for img_name in image_files:
        if check_cancelled and check_cancelled():
            raise InterruptedError("Pipeline cancelled by user")

        input_path = os.path.join(upload_dir, img_name)
        stem = Path(img_name).stem
        output_path = os.path.join(masks_dir, f"mask_{stem}.png")

        if generate_mask(input_path, output_path):
            mask_paths.append(output_path)

    return mask_paths



# STEP 2 — VISUAL HULL RECONSTRUCTION
def normalize_mask(mask: np.ndarray, size: int = 128, object_scale: float = 0.85):
    """Crop to gem, center, scale to fill `object_scale` of canvas."""
    mask = (mask > 127).astype(np.uint8) * 255
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return np.zeros((size, size), dtype=bool)

    c = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(c)
    crop = mask[y:y+h, x:x+w]

    target = int(size * object_scale)
    scale = min(target / w, target / h)
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))

    resized = cv2.resize(crop, (new_w, new_h), interpolation=cv2.INTER_AREA)
    canvas = np.zeros((size, size), dtype=np.uint8)
    sx = (size - new_w) // 2
    sy = (size - new_h) // 2
    canvas[sy:sy+new_h, sx:sx+new_w] = resized
    return canvas > 127


def compute_visual_hull(
    mask_folder: str,
    size: int = GRID_SIZE,
    check_cancelled = None,
) -> np.ndarray:
    """
    Intersect masks taken at evenly-spaced rotation angles (360° / N)
    to reconstruct the gem's 3D voxel volume.
    """
    center = size / 2.0
    x = np.arange(size) - center
    y = np.arange(size) - center
    z = np.arange(size) - center
    X, Y, Z = np.meshgrid(x, y, z, indexing="ij")

    # Initial spherical bounding volume
    radius = size * 0.48
    voxels = (X**2 + Y**2 + Z**2) < radius**2

    mask_files = sorted([
        f for f in os.listdir(mask_folder)
        if f.lower().endswith((".png", ".jpg", ".jpeg"))
    ])
    if not mask_files:
        raise ValueError("No mask files found")

    num_masks = len(mask_files)
    angle_step = 360.0 / num_masks

    for i, file_name in enumerate(mask_files):
        if check_cancelled and check_cancelled():
            raise InterruptedError("Pipeline cancelled by user")

        angle_rad = np.radians(i * angle_step)
        mask = cv2.imread(os.path.join(mask_folder, file_name), 0)
        if mask is None:
            continue

        mask_norm = normalize_mask(mask, size=size)
        cos_a, sin_a = np.cos(angle_rad), np.sin(angle_rad)

        proj_u = ((X * cos_a + Z * sin_a) + center).astype(np.int32)
        proj_v = (Y + center).astype(np.int32)
        proj_u = np.clip(proj_u, 0, size - 1)
        proj_v = np.clip(proj_v, 0, size - 1)

        inside = mask_norm[proj_v, proj_u]
        inside = ndimage.binary_dilation(inside, iterations=1)
        voxels &= inside

    return voxels



# STEP 3 — DIMENSION EXTRACTION (weight-calibrated)

def extract_metrics(
    voxels: np.ndarray,
    gem_type: str,
    real_weight_ct: float,
) -> Dict[str, Any]:
    """
    Extract physical dimensions using the gem's weight as calibration.
    Carat → mm conversion via gem-specific density.
    """
    density = DENSITY_MAP.get(gem_type, 3.60)
    target_vol_mm3 = ((real_weight_ct * 0.2) / density) * 1000

    total_vox = int(np.sum(voxels))
    if total_vox == 0:
        raise ValueError("Empty voxel volume after reconstruction")

    dyn_scale_mm = (target_vol_mm3 / total_vox) ** (1.0 / 3.0)

    z_c, y_c, x_c = np.where(voxels)
    dims_vox = sorted([
        x_c.max() - x_c.min(),
        y_c.max() - y_c.min(),
        z_c.max() - z_c.min(),
    ], reverse=True)

    length = float(dims_vox[0] * dyn_scale_mm)
    width  = float(dims_vox[1] * dyn_scale_mm)
    depth  = float(dims_vox[2] * dyn_scale_mm)
    lw_ratio = length / width if width > 0 else 0

    return {
        "length_mm":         round(length, 2),
        "width_mm":          round(width, 2),
        "depth_mm":          round(depth, 2),
        "lw_ratio":          round(lw_ratio, 2),
        "volume_mm3":        round(target_vol_mm3, 2),
        "voxel_count":       total_vox,
        "dynamic_scale_mm":  float(dyn_scale_mm),
    }



# STEP 4 — THREE.JS MESH EXPORT

def build_threejs_mesh(
    voxels: np.ndarray,
    dyn_scale: float,
    max_faces: int = 8000,
) -> Dict[str, Any]:
    """
    Convert voxel volume → smooth mesh → Three.js-ready format.
    Reorders axes so longest = X, shortest = Y (depth/up), middle = Z (width).
    Centers at origin and exports bounding box for cut alignment.
    """
    smooth = gaussian_filter(voxels.astype(float), sigma=1.0)
    verts, faces, _, _ = measure.marching_cubes(smooth, level=0.5)
    verts_mm = (verts - (GRID_SIZE / 2)) * dyn_scale

    if len(faces) > max_faces:
        step = max(1, len(faces) // max_faces)
        faces = faces[::step]

    # Center at bounding box center
    bbox_min = verts_mm.min(axis=0)
    bbox_max = verts_mm.max(axis=0)
    bbox_center = (bbox_min + bbox_max) / 2
    verts_centered = verts_mm - bbox_center

    bbox_size = bbox_max - bbox_min

    # Axis alignment: longest → X, middle → Z (width), shortest → Y (depth/up)
    order = np.argsort(bbox_size)[::-1]
    sorted_extents = bbox_size[order]
    longest, middle, shortest = order[0], order[1], order[2]

    verts_threejs = np.column_stack([
        verts_centered[:, longest],     # X = length
        verts_centered[:, shortest],    # Y = depth/up
        verts_centered[:, middle],      # Z = width
    ])

    bbox_threejs = {
        "x": float(sorted_extents[0]),
        "y": float(sorted_extents[2]),
        "z": float(sorted_extents[1]),
    }

    return {
        "vertices":      verts_threejs.flatten().tolist(),
        "indices":       faces.flatten().tolist(),
        "vertex_count":  int(len(verts_threejs)),
        "face_count":    int(len(faces)),
        "bbox":          bbox_threejs,
    }



# ORCHESTRATOR — full pipeline from images → mesh

def reconstruct_full(
    upload_dir: str,
    masks_dir: str,
    gem_type: str,
    real_weight_ct: float,
    check_cancelled = None,
    on_status_change = None,
) -> Dict[str, Any]:
    """
    Full pipeline:
      1. Generate masks from uploaded images
      2. Visual hull reconstruction
      3. Extract dimensions (weight-calibrated)
      4. Build Three.js mesh

    Returns combined dict ready for ML prediction + Three.js render.
    """
    # 1. Background removal + masks
    if on_status_change:
        on_status_change("generating_masks")
    generate_masks_for_session(upload_dir, masks_dir, check_cancelled)

    # 2. Visual hull
    if on_status_change:
        on_status_change("reconstructing")
    voxels = compute_visual_hull(masks_dir, check_cancelled=check_cancelled)

    # 3. Dimensions
    if check_cancelled and check_cancelled():
        raise InterruptedError("Pipeline cancelled by user")
    metrics = extract_metrics(voxels, gem_type, real_weight_ct)

    # 4. Three.js mesh
    if check_cancelled and check_cancelled():
        raise InterruptedError("Pipeline cancelled by user")
    mesh = build_threejs_mesh(voxels, metrics["dynamic_scale_mm"])

    return {
        "gem_type":       gem_type,
        "real_weight_ct": real_weight_ct,
        "metrics":        metrics,
        "mesh":           mesh,
    }