import io
from PIL import Image
from fastapi import APIRouter, UploadFile, File, HTTPException
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

@router.get("/health")
def health_check():
    return {"status": "healthy"}