"""
Valuation API endpoints for gem price prediction
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Optional
from app.services.valuation_service import predict_price, get_factor_options

router = APIRouter()


class GemFactorsInput(BaseModel):
    """Gem characteristics for price prediction"""
    weight_ct: float = Field(..., gt=0, le=10, description="Weight in carats")
    gem_type: str = Field(..., description="Type of gem (Ceylon Blue Spinel or Ceylon Blue Topaz)")
    colour_intensity: str = Field(..., description="Color intensity (Intense, Royal Blue, or Vivid)")
    clarity: str = Field(..., description="Clarity grade (IF, VS1, VS2, VVS1, or VVS2)")
    shape: str = Field(..., description="Cut shape")
    cut: str = Field(..., description="Cut type")
    enhancement: str = Field(default="Unheated", description="Enhancement type")


class EconomicFactorsInput(BaseModel):
    """Economic factors for price prediction"""
    ccpi: float = Field(default=95.0, description="Consumer Cost Price Index")
    ccpi_yoy: float = Field(default=4.5, description="CCPI Year-over-Year change")
    slfr: float = Field(default=8.5, description="Sri Lanka Floating Rate")
    gold_lkr: float = Field(default=206000, description="Gold price in LKR")
    gdp_growth: float = Field(default=2.5, description="GDP growth rate")
    exchange_rate: float = Field(default=155.0, description="Monthly average exchange rate")


class PricePredictionRequest(BaseModel):
    """Request body for price prediction"""
    gem_factors: GemFactorsInput
    economic_factors: Optional[EconomicFactorsInput] = None


class PricePredictionResponse(BaseModel):
    """Response for price prediction"""
    status: str
    predicted_price_lkr: float
    predicted_log_price: float
    confidence: float
    breakdown: Dict
    input_factors: Dict


@router.post("/predict-price", response_model=PricePredictionResponse)
async def predict_gem_price(request: PricePredictionRequest):
    """
    Predict gem price based on gem characteristics and economic factors.
    
    Uses ensemble of XGBoost and LightGBM models trained on historical gem pricing data.
    """
    try:
        # Convert Pydantic models to dicts
        gem_factors = request.gem_factors.dict()
        economic_factors = request.economic_factors.dict() if request.economic_factors else {}
        
        # Make prediction
        result = predict_price(gem_factors, economic_factors)
        
        return result
        
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=f"Model error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")


@router.get("/factor-options")
async def get_factor_options_endpoint():
    """
    Get all available options for gem and economic factors.
    Useful for populating frontend dropdowns and form validation.
    """
    try:
        options = get_factor_options()
        return {
            "status": "success",
            "factor_options": options
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving factor options: {str(e)}")
