from fastapi import APIRouter, HTTPException
from app.models.space_weather import (
    SpaceWeatherSummary,
    KpIndexData,
    AuroraGridData,
)
from app.services.data_pipeline import cache

router = APIRouter()

@router.get("/space-weather", response_model=SpaceWeatherSummary)
async def get_space_weather():
    """
    Get comprehensive space weather data including:
    - Magnetic field (Bx, By, Bz, Bt)
    - Solar wind plasma (density, speed, temperature)
    - Kp index
    - Aurora probability grid
    """
    if not cache.get("last_refresh"):
        raise HTTPException(
            status_code=503,
            detail="Space weather data not yet available. Please try again in a moment.",
        )

    return SpaceWeatherSummary(
        magnetic_field=cache.get("magnetic_field"),
        plasma=cache.get("plasma"),
        kp_index=cache.get("kp_index"),
        aurora_grid=cache.get("aurora_grid"),
        last_refresh=cache["last_refresh"],
    )

@router.get("/kp", response_model=KpIndexData)
async def get_kp_index():
    """Get current Kp index and recent history."""
    kp_data = cache.get("kp_index")
    if not kp_data:
        raise HTTPException(
            status_code=503,
            detail="Kp index data not available",
        )
    return kp_data

@router.get("/aurora-grid", response_model=AuroraGridData)
async def get_aurora_grid():
    """Get aurora probability grid for visualization."""
    grid_data = cache.get("aurora_grid")
    if not grid_data:
        raise HTTPException(
            status_code=503,
            detail="Aurora grid data not available",
        )
    return grid_data
