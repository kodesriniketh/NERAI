from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
import uuid
import datetime
from app.core.state import ACTIVE_INCIDENTS

router = APIRouter()

@router.post("/incidents")
async def report_incident(
    file: Optional[UploadFile] = File(None),
    lat: float = Form(...),
    lon: float = Form(...),
    description: str = Form("Field Worker Report"),
    severity: str = Form("High")
):
    incident_id = str(uuid.uuid4())
    image_url = file.filename if file else None
    ACTIVE_INCIDENTS[incident_id] = {
        "id": incident_id,
        "lat": lat,
        "lon": lon,
        "description": description,
        "severity": severity,
        "status": "Active",
        "reported_at": datetime.datetime.now().isoformat(),
        "image_url": image_url
    }
    return {"status": "created", "incident_id": incident_id}

@router.get("/incidents/my")
def get_my_incidents():
    return []

@router.post("/emergency-alerts")
def send_alert():
    return {"status": "alert_sent"}
