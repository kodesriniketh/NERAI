from fastapi import APIRouter, UploadFile, File, Form
import asyncio
import random
from app.services.osrm_client import fetch_osrm_routes
from app.services.ml_routing import get_route_risk_assessment
from app.api.v1.tracking import active_tracking_connections
from pydantic import BaseModel

class FieldHazardReport(BaseModel):
    lat: float
    lon: float
    description: str
    severity: str

router = APIRouter()

HAZARD_CLASSES = [
    {"type": "Landslide", "severity": "High", "desc": "A severe landslide has been detected on the route. The road is impassable."},
    {"type": "Mudslide / Rockfall", "severity": "High", "desc": "Rockfall debris detected blocking the main corridor."},
    {"type": "River Flooding", "severity": "Critical", "desc": "Severe river flooding detected. Water levels exceed safe limits."},
    {"type": "Submerged Bridge", "severity": "Critical", "desc": "Bridge structural submergence detected ahead. Do not proceed."}
]

@router.post("/analyze-hazard")
async def analyze_hazard(
    file: UploadFile = File(...),
    lat: float = Form(...),
    lon: float = Form(...)
):
    """
    Simulates an AI Vision Model analyzing an uploaded hazard photo.
    Returns a mock detection based on predefined master plan classes.
    """
    await asyncio.sleep(1.5)
    
    hazard = random.choice(HAZARD_CLASSES)
    
    return {
        "status": "success",
        "hazard_detected": True,
        "hazard_type": hazard["type"],
        "severity": hazard["severity"],
        "description": hazard["desc"],
        "location": {
            "lat": lat,
            "lon": lon
        }
    }


@router.post("/analyze-and-reroute")
async def analyze_and_reroute(
    file: UploadFile = File(...),
    hazard_lat: float = Form(...),
    hazard_lon: float = Form(...),
    origin_lat: float = Form(...),
    origin_lon: float = Form(...),
    dest_lat: float = Form(...),
    dest_lon: float = Form(...),
    cargo_type: str = Form("General Freight")
):
    """
    1. Analyzes the hazard
    2. Fetches OSRM coordinates (via AI backend)
    3. Calculates risk, choosing the best route
    4. Returns the hazard AND the full route coordinates
    """
    await asyncio.sleep(1.5)
    hazard = random.choice(HAZARD_CLASSES)
    
    # Generate route candidates
    candidate_routes = await fetch_osrm_routes(
        origin_lat=origin_lat, origin_lon=origin_lon, 
        dest_lat=dest_lat, dest_lon=dest_lon
    )
    
    # Evaluate risks
    active_hazards = [{"lat": hazard_lat, "lon": hazard_lon}]
    
    evaluation = get_route_risk_assessment(
        origin="Current Location",
        destination="Destination",
        routes=candidate_routes,
        active_hazards=active_hazards,
        cargo_type=cargo_type
    )
    
    # Find safest
    safest = next((r for r in evaluation["route_options"] if r["is_recommended"]), evaluation["route_options"][0])
    
    return {
        "status": "success",
        "hazard_detected": True,
        "hazard_type": hazard["type"],
        "severity": hazard["severity"],
        "description": hazard["desc"],
        "location": {"lat": hazard_lat, "lon": hazard_lon},
        "new_route": safest,
        "route_options": evaluation["route_options"]
    }

@router.post("/field/report-hazard")
async def receive_field_hazard(report: FieldHazardReport):
    """
    Receives hazard report from the Field app, simulates AI vision model scan, and broadcasts to active Transport trucks.
    """
    # Simulate AI Vision Model processing the field photo
    await asyncio.sleep(1.5)
    vision_result = random.choice(HAZARD_CLASSES)
    
    alert_payload = {
        "type": "hazard_alert",
        "hazard": {
            "lat": report.lat,
            "lon": report.lon,
            "severity": vision_result["severity"],
            "description": vision_result["desc"],
            "hazard_type": vision_result["type"]
        }
    }
    
    disconnected = []
    for route_id, ws in active_tracking_connections.items():
        try:
            await ws.send_json(alert_payload)
        except Exception:
            disconnected.append(route_id)
            
    for route_id in disconnected:
        if route_id in active_tracking_connections:
            del active_tracking_connections[route_id]
            
    return {"status": "success", "message": f"Hazard broadcasted to {len(active_tracking_connections)} active trips."}
