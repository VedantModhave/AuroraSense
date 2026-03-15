from fastapi import APIRouter, HTTPException
from app.services.noaa_service import fetch_kp_index, fetch_aurora_forecast
from app.models.aurora import KpData, AuroraForecast

router = APIRouter()

@router.get("/kp", response_model=KpData)
async def get_kp_index():
    """Current Kp index from NOAA."""
    try:
        return await fetch_kp_index()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/forecast", response_model=AuroraForecast)
async def get_aurora_forecast():
    """3-day aurora forecast from NOAA."""
    try:
        return await fetch_aurora_forecast()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
