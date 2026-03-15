from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MagneticFieldReading(BaseModel):
    time_tag: str
    bx_gsm: Optional[float] = None
    by_gsm: Optional[float] = None
    bz_gsm: Optional[float] = None
    bt: Optional[float] = None

class MagneticFieldData(BaseModel):
    readings: List[MagneticFieldReading]
    last_updated: Optional[str] = None

class PlasmaReading(BaseModel):
    time_tag: str
    density: Optional[float] = None
    speed: Optional[float] = None
    temperature: Optional[float] = None

class PlasmaData(BaseModel):
    readings: List[PlasmaReading]
    last_updated: Optional[str] = None

class AuroraGridPoint(BaseModel):
    coordinates: List[float]  # [lon, lat]
    aurora_probability: int

class AuroraGridData(BaseModel):
    observation_time: str
    forecast_time: str
    points: List[AuroraGridPoint]

class KpReading(BaseModel):
    time_tag: str
    kp: float
    observed: str
    noaa_scale: Optional[str] = None

class KpIndexData(BaseModel):
    current_kp: float
    readings: List[KpReading]
    last_updated: Optional[str] = None

class SpaceWeatherSummary(BaseModel):
    magnetic_field: Optional[MagneticFieldData] = None
    plasma: Optional[PlasmaData] = None
    kp_index: Optional[KpIndexData] = None
    aurora_grid: Optional[AuroraGridData] = None
    last_refresh: str
