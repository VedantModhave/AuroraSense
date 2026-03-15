from pydantic import BaseModel
from typing import List, Optional

class KpEntry(BaseModel):
    time_tag: str
    kp: float
    source: str

class KpData(BaseModel):
    current_kp: float
    entries: List[KpEntry]

class ForecastEntry(BaseModel):
    time_tag: str
    kp_index: float
    visibility_latitude: float  # degrees — aurora visible south of this latitude

class AuroraForecast(BaseModel):
    forecast: List[ForecastEntry]
    updated_at: Optional[str] = None
