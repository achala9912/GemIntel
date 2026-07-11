from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.services.model_service import load_all_models

app = FastAPI(title="Dual-Branch Gem Authentication API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models on Startup
@app.on_event("startup")
async def startup_event():
    try:
        load_all_models()
    except Exception as e:
        print(f"[Error] Critical error loading models: {e}")

# Include all routes
app.include_router(router)