from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.api.routes import router
from app.services.model_service import load_all_models
from app.api.cut import router as cut_router

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Dual-Branch Gem Authentication API")

@app.get("/")
def read_root():
    return RedirectResponse(url="/docs")

# Setup CORS - Allow local development by default and custom origins via env variable
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
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
app.include_router(cut_router, prefix="/api/cut", tags=["cut-prediction"])