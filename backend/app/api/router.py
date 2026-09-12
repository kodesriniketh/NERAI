from fastapi import APIRouter
from app.api.v1 import admin, transport, field, disaster, tracking, vision, auth

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(transport.router, prefix="/transport", tags=["transport"])
api_router.include_router(field.router, prefix="/field", tags=["field"])
api_router.include_router(disaster.router, prefix="/disaster", tags=["disaster"])
api_router.include_router(tracking.router, prefix="/tracking", tags=["tracking"])
api_router.include_router(vision.router, prefix="/vision", tags=["vision"])
