from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_data():
    return {"status": "ok", "mock_data": True}

@router.get("/trucks")
def get_trucks():
    return []

@router.get("/supply-requirements")
def get_supply_requirements():
    return []

@router.get("/shipments")
def get_shipments():
    return []
