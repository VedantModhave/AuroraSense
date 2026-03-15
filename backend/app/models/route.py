"""
Route optimization data models.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class Location(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class ViewingLocation(Location):
    aurora_probability: float = Field(..., ge=0, le=100)
    cloud_cover: float = Field(..., ge=0, le=100)
    bortle_scale: int = Field(..., ge=1, le=9)
    score: float
    meets_criteria: bool = True

class RouteStep(BaseModel):
    instruction: str
    distance_m: float
    duration_s: float
    type: str

class RouteData(BaseModel):
    distance_km: float
    duration_minutes: float
    geometry: Dict
    steps: List[RouteStep]

class OptimizedRoute(BaseModel):
    origin: Location
    destination: ViewingLocation
    route: RouteData
    alternative_locations: List[ViewingLocation]
    timestamp: str

class RouteRequest(BaseModel):
    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lon: float = Field(..., ge=-180, le=180)
    search_radius_km: float = Field(default=100, ge=10, le=500)
    min_aurora_probability: float = Field(default=50, ge=0, le=100)
    max_cloud_cover: float = Field(default=30, ge=0, le=100)
    max_bortle: int = Field(default=4, ge=1, le=9)
    profile: str = Field(default="driving", pattern="^(driving|cycling|walking)$")
