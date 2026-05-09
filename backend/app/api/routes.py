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
        
        # Pass to our service
        result = run_inference(base_image)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def health_check():
    return {"status": "healthy"}