"""
Light pollution service for aurora viewing optimization.
Uses approximate Bortle scale estimation based on population density.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Bortle scale reference:
# 1 = Excellent dark sky
# 2 = Typical dark sky
# 3 = Rural sky
# 4 = Rural/suburban transition
# 5 = Suburban sky
# 6 = Bright suburban sky
# 7 = Suburban/urban transition
# 8-9 = City sky

def estimate_bortle_scale(lat: float, lon: float) -> int:
    """
    Estimate Bortle scale for a location.
    
    This is a simplified estimation. For production, integrate with:
    - Light Pollution Map API (https://www.lightpollutionmap.info/)
    - NASA Black Marble data
    - OpenStreetMap population density
    
    Args:
        lat: Latitude
        lon: Longitude
    
    Returns:
        Bortle scale (1-9)
    """
    # Simplified heuristic based on latitude (higher latitudes = less light pollution)
    # In production, use actual light pollution data
    
    abs_lat = abs(lat)
    
    # Very high latitudes (>65°) - typically rural
    if abs_lat > 65:
        return 3
    # High latitudes (55-65°) - mixed
    elif abs_lat > 55:
        return 4
    # Mid latitudes (45-55°) - more populated
    elif abs_lat > 45:
        return 5
    # Lower latitudes - assume more light pollution
    else:
        return 6

def is_suitable_for_aurora_viewing(bortle: int, threshold: int = 4) -> bool:
    """
    Check if location is suitable for aurora viewing based on Bortle scale.
    
    Args:
        bortle: Bortle scale value (1-9)
        threshold: Maximum acceptable Bortle scale (default: 4)
    
    Returns:
        True if suitable
    """
    return bortle <= threshold
