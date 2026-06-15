import io
from collections import defaultdict
from typing import List

from PIL import Image
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.config import GEM_TYPES
from app.services.model_service import run_inference
from app.services.cut_service import predict_cut_one, cut_classes
from app.services.color_service import predict_color_one, color_classes

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "healthy"}


@router.get("/gem-types")
def list_gem_types():
    return {"gem_types": GEM_TYPES}


@router.get("/identify/classes")
def identify_class_labels():
    return {"cut": cut_classes(), "color": color_classes()}


@router.post("/authenticate")
async def authenticate_gem(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        image_bytes = await file.read()
        base_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return run_inference(base_image)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _top(d: dict) -> tuple[str, float]:
    label, prob = max(d.items(), key=lambda kv: kv[1])
    return label, float(prob)


@router.post("/identify")
async def identify_gem(
    gem_type: str = Form(...),
    files: List[UploadFile] = File(...),
):
    if not files:
        raise HTTPException(status_code=400, detail="At least one image is required.")
    if gem_type not in GEM_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown gem_type '{gem_type}'.")

    per_image = []
    sum_shape: dict[str, float] = defaultdict(float)
    sum_cut: dict[str, float] = defaultdict(float)
    sum_hue: dict[str, float] = defaultdict(float)
    sum_sat: dict[str, float] = defaultdict(float)

    for f in files:
        if not f.content_type or not f.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"{f.filename}: not an image.")

        raw = await f.read()
        try:
            image = Image.open(io.BytesIO(raw)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"{f.filename}: {e}")

        try:
            cut_res = predict_cut_one(image)
            color_res = predict_color_one(image)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        shape_top, shape_p = _top(cut_res["shape_probs"])
        cut_top, cut_p = _top(cut_res["cut_style_probs"])
        hue_top, hue_p = _top(color_res["hue_probs"])
        sat_top, sat_p = _top(color_res["saturation_probs"])

        per_image.append({
            "filename": f.filename,
            "cut": {
                "shape": {"label": shape_top, "confidence": round(shape_p, 4)},
                "cut_style": {"label": cut_top, "confidence": round(cut_p, 4)},
                "shape_probs": {k: round(v, 4) for k, v in cut_res["shape_probs"].items()},
                "cut_style_probs": {k: round(v, 4) for k, v in cut_res["cut_style_probs"].items()},
            },
            "color": {
                "hue": {"label": hue_top, "confidence": round(hue_p, 4)},
                "saturation": {"label": sat_top, "confidence": round(sat_p, 4)},
                "hue_probs": {k: round(v, 4) for k, v in color_res["hue_probs"].items()},
                "saturation_probs": {k: round(v, 4) for k, v in color_res["saturation_probs"].items()},
            },
        })

        for k, v in cut_res["shape_probs"].items():
            sum_shape[k] += v
        for k, v in cut_res["cut_style_probs"].items():
            sum_cut[k] += v
        for k, v in color_res["hue_probs"].items():
            sum_hue[k] += v
        for k, v in color_res["saturation_probs"].items():
            sum_sat[k] += v

    n = len(per_image)
    avg_shape = {k: v / n for k, v in sum_shape.items()}
    avg_cut = {k: v / n for k, v in sum_cut.items()}
    avg_hue = {k: v / n for k, v in sum_hue.items()}
    avg_sat = {k: v / n for k, v in sum_sat.items()}

    shape_top, shape_p = _top(avg_shape)
    cut_top, cut_p = _top(avg_cut)
    hue_top, hue_p = _top(avg_hue)
    sat_top, sat_p = _top(avg_sat)

    return {
        "status": "success",
        "gem_type": gem_type,
        "image_count": n,
        "aggregate": {
            "cut": {
                "shape": {"label": shape_top, "confidence": round(shape_p, 4)},
                "cut_style": {"label": cut_top, "confidence": round(cut_p, 4)},
                "shape_probs": {k: round(v, 4) for k, v in avg_shape.items()},
                "cut_style_probs": {k: round(v, 4) for k, v in avg_cut.items()},
            },
            "color": {
                "hue": {"label": hue_top, "confidence": round(hue_p, 4)},
                "saturation": {"label": sat_top, "confidence": round(sat_p, 4)},
                "hue_probs": {k: round(v, 4) for k, v in avg_hue.items()},
                "saturation_probs": {k: round(v, 4) for k, v in avg_sat.items()},
            },
        },
        "per_image": per_image,
    }
