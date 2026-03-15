import math
from datetime import datetime, timezone
from typing import Tuple
from app.models.visibility import DarknessFactors

def calculate_solar_position(lat: float, lon: float, dt: datetime) -> Tuple[float, float]:
    """
    Calculate solar altitude and azimuth for given location and time.
    
    Args:
        lat: Latitude in degrees
        lon: Longitude in degrees
        dt: Datetime (UTC)
    
    Returns:
        Tuple of (altitude, azimuth) in degrees
    """
    # Convert to radians
    lat_rad = math.radians(lat)
    
    # Calculate day of year
    day_of_year = dt.timetuple().tm_yday
    
    # Solar declination (simplified)
    declination = 23.45 * math.sin(math.radians(360 / 365 * (day_of_year - 81)))
    dec_rad = math.radians(declination)
    
    # Hour angle
    hour = dt.hour + dt.minute / 60.0 + dt.second / 3600.0
    hour_angle = 15 * (hour - 12) + lon
    ha_rad = math.radians(hour_angle)
    
    # Solar altitude
    sin_alt = (math.sin(lat_rad) * math.sin(dec_rad) + 
               math.cos(lat_rad) * math.cos(dec_rad) * math.cos(ha_rad))
    altitude = math.degrees(math.asin(max(-1, min(1, sin_alt))))
    
    # Solar azimuth (simplified)
    cos_az = ((math.sin(dec_rad) - math.sin(lat_rad) * math.sin(math.radians(altitude))) /
              (math.cos(lat_rad) * math.cos(math.radians(altitude))))
    azimuth = math.degrees(math.acos(max(-1, min(1, cos_az))))
    
    if hour_angle > 0:
        azimuth = 360 - azimuth
    
    return altitude, azimuth

def calculate_moon_illumination(dt: datetime) -> float:
    """
    Calculate approximate moon illumination percentage.
    
    Args:
        dt: Datetime (UTC)
    
    Returns:
        Moon illumination (0-100)
    """
    # Known new moon reference: 2000-01-06 18:14 UTC
    new_moon_ref = datetime(2000, 1, 6, 18, 14, tzinfo=timezone.utc)
    synodic_month = 29.53058867  # days
    
    # Days since reference new moon
    delta = (dt - new_moon_ref).total_seconds() / 86400
    
    # Moon phase (0 = new, 0.5 = full)
    phase = (delta % synodic_month) / synodic_month
    
    # Illumination percentage (0 at new moon, 100 at full moon)
    illumination = 50 * (1 - math.cos(2 * math.pi * phase))
    
    return illumination

def calculate_moon_position(lat: float, lon: float, dt: datetime) -> Tuple[float, float]:
    """
    Calculate approximate moon altitude and azimuth.
    Simplified calculation - for production use an astronomy library like ephem or skyfield.
    
    Args:
        lat: Latitude in degrees
        lon: Longitude in degrees
        dt: Datetime (UTC)
    
    Returns:
        Tuple of (altitude, azimuth) in degrees
    """
    # This is a very simplified approximation
    # Moon roughly follows sun with ~12.2 hour offset
    moon_dt = datetime(
        dt.year, dt.month, dt.day,
        (dt.hour + 12) % 24, dt.minute, dt.second,
        tzinfo=timezone.utc
    )
    
    # Use solar position calculation with offset
    altitude, azimuth = calculate_solar_position(lat, lon, moon_dt)
    
    return altitude, azimuth

def calculate_darkness_score(
    lat: float,
    lon: float,
    dt: datetime = None
) -> DarknessFactors:
    """
    Calculate darkness score based on solar position, moon phase, and time.
    
    Score components:
    - Solar altitude: 0-100 (100 = sun well below horizon)
    - Moon illumination: 0-100 (100 = new moon, 0 = full moon)
    - Moon altitude: 0-100 (100 = moon below horizon)
    
    Args:
        lat: Latitude
        lon: Longitude
        dt: Datetime (UTC), defaults to now
    
    Returns:
        DarknessFactors with detailed breakdown
    """
    if dt is None:
        dt = datetime.now(timezone.utc)
    
    # Calculate solar position
    solar_altitude, _ = calculate_solar_position(lat, lon, dt)
    
    # Calculate moon position and illumination
    moon_altitude, _ = calculate_moon_position(lat, lon, dt)
    moon_illumination = calculate_moon_illumination(dt)
    
    # Determine night conditions
    is_night = solar_altitude < -6  # Civil twilight
    is_astronomical_twilight = solar_altitude < -18  # Best for aurora viewing
    
    # Calculate darkness components (0-100 scale)
    
    # 1. Solar darkness (100 = sun well below horizon)
    if solar_altitude >= 0:
        solar_darkness = 0
    elif solar_altitude >= -6:
        solar_darkness = 30  # Civil twilight
    elif solar_altitude >= -12:
        solar_darkness = 60  # Nautical twilight
    elif solar_altitude >= -18:
        solar_darkness = 85  # Astronomical twilight
    else:
        solar_darkness = 100  # Full night
    
    # 2. Moon darkness (100 = new moon or moon below horizon)
    if moon_altitude < 0:
        moon_darkness = 100  # Moon below horizon
    else:
        # Moon is up - reduce darkness based on illumination and altitude
        moon_brightness = (moon_illumination / 100) * (max(0, moon_altitude) / 90)
        moon_darkness = 100 - (moon_brightness * 100)
    
    # Combined darkness score (weighted average)
    darkness_score = (solar_darkness * 0.7) + (moon_darkness * 0.3)
    
    return DarknessFactors(
        solar_altitude=round(solar_altitude, 2),
        moon_illumination=round(moon_illumination, 2),
        moon_altitude=round(moon_altitude, 2),
        is_night=is_night,
        is_astronomical_twilight=is_astronomical_twilight,
        darkness_score=round(darkness_score, 2),
    )
