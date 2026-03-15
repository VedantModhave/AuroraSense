from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class SightingCreate(BaseModel):
    latitude: float
    longitude: float
    timestamp: Optional[str] = None
    photo_url: Optional[str] = None

class Sighting(BaseModel):
    id: int
    latitude: float
    longitude: float
    timestamp: str
    photo_url: Optional[str] = None

# In-memory store for sightings
# A real application would use a database
SIGHTINGS_DB: List[Sighting] = []
next_id = 1

@router.post("/sightings", response_model=Sighting)
def create_sighting(sighting: SightingCreate):
    global next_id
    new_sighting = Sighting(
        id=next_id,
        latitude=sighting.latitude,
        longitude=sighting.longitude,
        timestamp=sighting.timestamp or datetime.utcnow().isoformat() + "Z",
        photo_url=sighting.photo_url
    )
    SIGHTINGS_DB.append(new_sighting)
    next_id += 1
    return new_sighting

@router.get("/sightings", response_model=List[Sighting])
def get_sightings():
    return SIGHTINGS_DB
