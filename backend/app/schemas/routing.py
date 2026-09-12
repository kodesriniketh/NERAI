from pydantic import BaseModel
from typing import List, Optional

class RouteInput(BaseModel):
    route_id: str
    route_name: str
    travel_time_mins: int
    distance_km: float
    coordinates: List[List[float]]

class HazardInput(BaseModel):
    lat: float
    lon: float

class RouteEvaluationRequest(BaseModel):
    origin: str
    destination: str
    candidate_routes: List[RouteInput]
    active_hazards: Optional[List[HazardInput]] = None
    cargo_type: Optional[str] = "General Freight"
