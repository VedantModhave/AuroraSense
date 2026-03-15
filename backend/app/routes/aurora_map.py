from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any
from app.services.aurora_processor import (
    convert_aurora_grid_to_geojson,
    get_aurora_hotspots,
    get_aurora_contours,
)

router = APIRouter()

@router.get("/aurora-map")
async def get_aurora_map(
    filter: Optional[str] = Query(
        None,
        description="Filter type: 'hotspots' (prob >= 50), 'contours' (grouped levels), or None for all points"
    ),
    min_probability: int = Query(
        50,
        ge=0,
        le=100,
        description="Minimum probability threshold for hotspots filter (0-100)"
    )
) -> Dict[str, Any]:
    """
    Get aurora probability grid as GeoJSON FeatureCollection.
    
    Query parameters:
    - filter: Optional filter type
      - None (default): All non-zero probability points
      - 'hotspots': Only high-probability regions (>= min_probability)
      - 'contours': Points grouped by probability levels [25, 50, 75]
    - min_probability: Threshold for hotspots filter (default: 50)
    
    Returns:
        GeoJSON FeatureCollection with Point features containing aurora probability
    """
    
    if filter == "hotspots":
        geojson = get_aurora_hotspots(min_probability=min_probability)
    elif filter == "contours":
        geojson = get_aurora_contours()
    else:
        geojson = convert_aurora_grid_to_geojson()
    
    if not geojson:
        raise HTTPException(
            status_code=503,
            detail="Aurora map data not available. Please try again in a moment."
        )
    
    return geojson

@router.get("/aurora-map/stats")
async def get_aurora_map_stats() -> Dict[str, Any]:
    """
    Get statistics about current aurora activity.
    
    Returns:
        Summary statistics including coverage area, max probability, hotspot count
    """
    geojson = convert_aurora_grid_to_geojson()
    
    if not geojson:
        raise HTTPException(
            status_code=503,
            detail="Aurora data not available"
        )
    
    features = geojson.get("features", [])
    
    if not features:
        return {
            "total_points": 0,
            "max_probability": 0,
            "avg_probability": 0,
            "hotspot_count": 0,
            "coverage_area": "none"
        }
    
    probabilities = [f["properties"]["probability"] for f in features]
    max_prob = max(probabilities)
    avg_prob = sum(probabilities) / len(probabilities)
    hotspot_count = sum(1 for p in probabilities if p >= 50)
    
    # Determine coverage area based on latitude distribution
    latitudes = [f["geometry"]["coordinates"][1] for f in features]
    min_lat = min(latitudes)
    max_lat = max(latitudes)
    
    if max_lat > 60:
        coverage = "high-latitude"
    elif max_lat > 45:
        coverage = "mid-latitude"
    else:
        coverage = "low-latitude"
    
    return {
        "total_points": len(features),
        "max_probability": max_prob,
        "avg_probability": round(avg_prob, 2),
        "hotspot_count": hotspot_count,
        "coverage_area": coverage,
        "latitude_range": {
            "min": round(min_lat, 1),
            "max": round(max_lat, 1)
        },
        "observation_time": geojson.get("metadata", {}).get("observation_time"),
        "forecast_time": geojson.get("metadata", {}).get("forecast_time"),
    }
