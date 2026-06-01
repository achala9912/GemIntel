import io
from PIL import Image
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
import cv2
import numpy as np
from app.services.model_service import run_inference

router = APIRouter()

@router.post("/authenticate")
async def authenticate_gem(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    
    try:
        # Read image
        image_bytes = await file.read()
        base_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # --- AI Filter check ---
        from app.services.ai_filter_service import analyze_image_origin
        filter_result = analyze_image_origin(base_image)
        print(f"AI Filter Result: {filter_result}")
        if filter_result["is_ai_generated"]:
            return {
                "status": "ai_generated",
                "message": "The image is AI-generated. Please submit a real one.",
                "filter_result": filter_result
            }
        
        # Pass to our service
        result = run_inference(base_image)
        result["filter_result"] = filter_result
        return result
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reconstruct")
async def reconstruct_gem(
    files: List[UploadFile] = File(...),
    gem_type: str = Form(...),
    weight: float = Form(...)
):
    try:
        # Decode files to CV2 images
        images = []
        for file in files:
            file_bytes = await file.read()
            nparr = np.frombuffer(file_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is not None:
                images.append(img)
                
        if len(images) < 10:
            raise HTTPException(status_code=400, detail="A minimum of 10 side-view images is required for reconstruction.")
            
        from app.services.reconstruction_service import (
            reconstruct_visual_hull, 
            extract_metrics, 
            predict_cut_and_yield, 
            generate_mesh
        )
        
        # Reconstruct voxel grid (size 128)
        voxels = reconstruct_visual_hull(images, size=128)
        
        # Calculate volume metrics and ratios
        metrics = extract_metrics(voxels, gem_type, weight)
        
        # Run RF models to estimate cut name and yield
        predictions = predict_cut_and_yield(metrics)
        
        # Generate 3D marching cubes mesh
        mesh = generate_mesh(voxels)
        
        return {
            "status": "success",
            "metrics": metrics,
            "predictions": predictions,
            "mesh": mesh
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Visual hull reconstruction failed: {str(e)}")

@router.get("/health")
def health_check():
    return {"status": "healthy"}