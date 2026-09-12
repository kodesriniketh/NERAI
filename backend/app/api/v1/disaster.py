from fastapi import APIRouter
from app.core.state import ACTIVE_INCIDENTS

router = APIRouter()

@router.get("/incidents")
def get_all_incidents():
    return list(ACTIVE_INCIDENTS.values())

@router.patch("/incidents/{id}/verify")
def verify_incident(id: str):
    if id in ACTIVE_INCIDENTS:
        ACTIVE_INCIDENTS[id]["status"] = "VERIFIED"
    return {"id": id, "status": "VERIFIED"}

@router.patch("/incidents/{id}/reject")
def reject_incident(id: str):
    if id in ACTIVE_INCIDENTS:
        ACTIVE_INCIDENTS[id]["status"] = "REJECTED"
    return {"id": id, "status": "REJECTED"}

@router.patch("/incidents/{id}/resolve")
def resolve_incident(id: str):
    if id in ACTIVE_INCIDENTS:
        ACTIVE_INCIDENTS[id]["status"] = "RESOLVED"
        # Or remove it: del ACTIVE_INCIDENTS[id]
        # Since it asks to "remove or mark as resolved", we mark it and maybe the frontend filters it out. 
        # Actually, let's remove it to simplify the map, or we can just keep it marked.
        # Let's remove it entirely.
        del ACTIVE_INCIDENTS[id]
    return {"id": id, "status": "RESOLVED"}

@router.patch("/incidents/{id}/resolving")
def resolving_incident(id: int):
    return {"id": id, "status": "RESOLVING"}

@router.post("/incidents/{id}/vote")
def vote_incident(id: int):
    return {"status": "voted"}

@router.get("/alerts")
def get_alerts():
    return []

@router.patch("/alerts/{id}/acknowledge")
def acknowledge_alert(id: int):
    return {"id": id, "status": "acknowledged"}
