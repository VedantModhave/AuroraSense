from pydantic import BaseModel
from typing import Optional

class VisibilityScore(BaseModel):
    aurora_probability: float
    cloud_cover: float
    darkness_score: float
    visibility_score: float
    location: dict
    timestamp: str
    conditions: dict
    recommendation: str

class DarknessFactors(BaseModel):
    solar_altitude: float
    moon_illumination: float
    moon_altitude: float
    is_night: bool
    is_astronomical_twilight: bool
    darkness_score: float
