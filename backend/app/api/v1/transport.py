from fastapi import APIRouter
from app.schemas.routing import RouteEvaluationRequest
from app.services.ml_routing import get_route_risk_assessment

router = APIRouter()

@router.post("/evaluate-routes")
def evaluate_routes(req: RouteEvaluationRequest):
    # Convert Pydantic models to dicts for the engine
    routes_data = [r.model_dump() for r in req.candidate_routes]
    hazards_data = [h.model_dump() for h in req.active_hazards] if req.active_hazards else []
    
    result = get_route_risk_assessment(
        origin=req.origin,
        destination=req.destination,
        routes=routes_data,
        active_hazards=hazards_data,
        cargo_type=req.cargo_type
    )
    return result

@router.get("/routes/{id}")
def get_route(id: int):
    return {"id": id, "status": "mock"}
