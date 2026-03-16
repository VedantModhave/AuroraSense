import logging
from datetime import datetime, timezone
from typing import Optional
from app.models.visibility import VisibilityScore
from app.services.weather_service import fetch_cloud_cover
from app.services.darkness_calculator import calculate_darkness_score
from app.services.data_pipeline import cache

logger = logging.getLogger(__name__)

def get_aurora_probability_at_location(lat: float, lon: float) -> Optional[float]:
    """
    Get aurora probability at specific location from cached grid data.
    
    Args:
        lat: Latitude (-90 to 90)
        lon: Longitude (-180 to 180)
    
    Returns:
        Aurora probability (0-100) or None
    """
    aurora_grid = cache.get("aurora_grid")
    
    if not aurora_grid or not aurora_grid.points:
        return None
    
    # Normalize longitude to 0-360 range for OVATION grid
    lon_normalized = lon if lon >= 0 else lon + 360
    
    # Find closest grid point (OVATION is 1° resolution)
    closest_point = None
    min_distance = float('inf')
    
    for point in aurora_grid.points:
        grid_lon, grid_lat = point.coordinates
        
        # Calculate simple distance
        distance = abs(grid_lat - lat) + abs(grid_lon - lon_normalized)
        
        if distance < min_distance:
            min_distance = distance
            closest_point = point
    
    if closest_point:
        return float(closest_point.aurora_probability)
    
    return None

async def calculate_visibility_score(
    lat: float,
    lon: float,
    dt: datetime = None
) -> Optional[VisibilityScore]:
    """
    Calculate comprehensive aurora visibility score for a location.
    
    Formula:
    visibility_score = (aurora_probability * 0.5) + 
                      ((100 - cloud_cover) * 0.3) + 
                      (darkness_score * 0.2)
    
    Args:
        lat: Latitude (-90 to 90)
        lon: Longitude (-180 to 180)
        dt: Datetime (UTC), defaults to now
    
    Returns:
        VisibilityScore with detailed breakdown
    """
    if dt is None:
        dt = datetime.now(timezone.utc)
    
    try:
        # 1. Get aurora probability from OVATION grid
        aurora_probability = get_aurora_probability_at_location(lat, lon)
        if aurora_probability is None:
            logger.warning(f"No aurora data for lat={lat}, lon={lon}")
            aurora_probability = 0.0
        
        # 2. Fetch cloud cover from Open-Meteo
        cloud_cover = await fetch_cloud_cover(lat, lon)
        if cloud_cover is None:
            logger.warning(f"No cloud cover data for lat={lat}, lon={lon}")
            cloud_cover = 50.0  # Default to 50% if unavailable
        
        # 3. Calculate darkness score (Solar position and Moon phase)
        darkness_factors = calculate_darkness_score(lat, lon, dt)
        darkness_score = darkness_factors.darkness_score

        # 4. Estimate light pollution (Bortle Scale)
        from app.services.light_pollution_service import estimate_bortle_scale
        bortle = estimate_bortle_scale(lat, lon)
        # Convert Bortle (1-9) to a 0-100 score where 1=100 (best) and 9=0 (worst)
        light_pollution_score = max(0, 100 - (bortle - 1) * 12.5)
        
        # 5. Calculate weighted visibility score (0-100)
        # Weighting Rationale:
        # - Aurora Probability (40%): The primary driver. Even with clear skies, no aurora means no visibility.
        # - Clear Skies (30%): Most critical local factor. Clouds are the #1 enemy of observers.
        # - Darkness (20%): Solar/Lunar interference. Essential for seeing dim structures.
        # - Light Pollution (10%): Crucial for photographers, though bright aurora can cut through some glare.
        visibility_score = (
            (aurora_probability * 0.40) +
            ((100 - cloud_cover) * 0.30) +
            (darkness_score * 0.20) +
            (light_pollution_score * 0.10)
        )
        
        # 5. Generate recommendation
        recommendation = generate_recommendation(
            visibility_score,
            aurora_probability,
            cloud_cover,
            darkness_factors
        )
        
        return VisibilityScore(
            aurora_probability=round(aurora_probability, 2),
            cloud_cover=round(cloud_cover, 2),
            darkness_score=round(darkness_score, 2),
            visibility_score=round(visibility_score, 2),
            location={
                "latitude": lat,
                "longitude": lon,
            },
            timestamp=dt.isoformat(),
            conditions={
                "solar_altitude": darkness_factors.solar_altitude,
                "moon_illumination": darkness_factors.moon_illumination,
                "moon_altitude": darkness_factors.moon_altitude,
                "is_night": darkness_factors.is_night,
                "is_astronomical_twilight": darkness_factors.is_astronomical_twilight,
                "clear_sky_percentage": round(100 - cloud_cover, 2),
            },
            recommendation=recommendation,
        )
        
    except Exception as e:
        logger.error(f"Failed to calculate visibility score: {e}")
        return None

def generate_recommendation(
    visibility_score: float,
    aurora_probability: float,
    cloud_cover: float,
    darkness_factors
) -> str:
    """
    Generate human-readable recommendation based on conditions.
    
    Args:
        visibility_score: Overall visibility score (0-100)
        aurora_probability: Aurora probability (0-100)
        cloud_cover: Cloud cover percentage (0-100)
        darkness_factors: DarknessFactors object
    
    Returns:
        Recommendation string
    """
    if visibility_score >= 70:
        base = "Excellent aurora viewing conditions!"
    elif visibility_score >= 50:
        base = "Good aurora viewing conditions."
    elif visibility_score >= 30:
        base = "Fair aurora viewing conditions."
    else:
        base = "Poor aurora viewing conditions."
    
    # Add specific issues
    issues = []
    
    if aurora_probability < 20:
        issues.append("low aurora activity")
    
    if cloud_cover > 70:
        issues.append("heavy cloud cover")
    elif cloud_cover > 40:
        issues.append("moderate cloud cover")
    
    if not darkness_factors.is_night:
        issues.append("daylight or twilight")
    elif not darkness_factors.is_astronomical_twilight:
        issues.append("not fully dark yet")
    
    if darkness_factors.moon_altitude > 0 and darkness_factors.moon_illumination > 50:
        issues.append("bright moon")
    
    if issues:
        return f"{base} Limited by: {', '.join(issues)}."
    
    return base
