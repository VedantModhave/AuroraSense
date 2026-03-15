from fastapi import APIRouter, HTTPException, Query
from app.models.visibility import VisibilityScore
from app.services.visibility_engine import calculate_visibility_score

router = APIRouter()

@router.get("/visibility", response_model=VisibilityScore)
async def get_visibility_score(
    lat: float = Query(..., ge=-90, le=90, description="Latitude (-90 to 90)"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude (-180 to 180)")
):
    """
    Calculate aurora visibility score for a specific location.
    
    The visibility score combines:
    - Aurora probability from OVATION grid (50% weight)
    - Clear sky conditions from cloud cover (30% weight)
    - Darkness score from solar/lunar position (20% weight)
    
    Formula:
    visibility_score = (aurora_probability × 0.5) + 
                      ((100 - cloud_cover) × 0.3) + 
                      (darkness_score × 0.2)
    
    Query parameters:
    - lat: Latitude in degrees (-90 to 90)
    - lon: Longitude in degrees (-180 to 180)
    
    Returns:
        Detailed visibility score with breakdown of all factors
    """
    score = await calculate_visibility_score(lat, lon)
    
    if not score:
        raise HTTPException(
            status_code=503,
            detail="Unable to calculate visibility score. Data may be temporarily unavailable."
        )
    
    return score
