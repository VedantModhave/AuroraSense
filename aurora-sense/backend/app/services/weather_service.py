import httpx
import logging
from typing import Optional, List, Tuple

logger = logging.getLogger(__name__)

# Open-Meteo API (free, no API key required)
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

async def fetch_cloud_cover(lat: float, lon: float) -> Optional[float]:
    """
    Fetch current cloud cover percentage from Open-Meteo API.
    
    Args:
        lat: Latitude (-90 to 90)
        lon: Longitude (-180 to 180)
    
    Returns:
        Cloud cover percentage (0-100) or None if unavailable
    """
    try:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "cloud_cover",
            "timezone": "auto",
        }
        
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
        
        cloud_cover = data.get("current", {}).get("cloud_cover")
        
        if cloud_cover is not None:
            return float(cloud_cover)
        
        logger.warning(f"No cloud cover data for lat={lat}, lon={lon}")
        return None
        
    except Exception as e:
        logger.error(f"Failed to fetch cloud cover: {e}")
        return None

async def fetch_bulk_cloud_cover(coords: List[Tuple[float, float]]) -> List[float]:
    """
    Fetch cloud cover for multiple coordinates in one batch request.
    Reduces 48+ API calls to a single call and significantly improves speed.
    """
    if not coords:
        return []
        
    try:
        # Open-Meteo allows comma separated lat/lon arrays (up to 100 per call)
        lats = ",".join(str(lat) for lat, _ in coords)
        lons = ",".join(str(lon) for _, lon in coords)
        
        params = {
            "latitude": lats,
            "longitude": lons,
            "current": "cloud_cover",
            "timezone": "auto",
        }
        
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            
        # Bulk requests return a list of result objects
        if isinstance(data, list):
            results = []
            for item in data:
                current = item.get("current", {}) if isinstance(item, dict) else {}
                val = current.get("cloud_cover")
                results.append(float(val) if val is not None else 50.0)
            return results
            
        # Fallback if only 1 coordinate was queried
        elif isinstance(data, dict):
            current = data.get("current", {})
            val = current.get("cloud_cover")
            return [float(val) if val is not None else 50.0]
            
    except Exception as e:
        logger.error(f"Failed to fetch bulk cloud cover: {e}")
        
    # Return neutral 50% fallback if API completely fails
    return [50.0] * len(coords)
