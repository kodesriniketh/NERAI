from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel
from typing import Optional
from datetime import timedelta
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)

router = APIRouter()

# ─── Mock Database of Users ──────────────────────────────────────────────────
MOCK_USERS = {
    "NERA-ADM-001": {
        "id": "usr_001",
        "officialId": "NERA-ADM-001",
        "password": get_password_hash("admin123"),
        "name": "State Operations Admin",
        "role": "ADMIN",
        "state": "Assam",
        "district": None
    },
    "TM-001": {
        "id": "usr_014",
        "officialId": "TM-001",
        "password": get_password_hash("transport123"),
        "name": "Transport Manager",
        "role": "TRANSPORT_MANAGER",
        "state": None,
        "district": None
    },
    "FO-001": {
        "id": "usr_052",
        "officialId": "FO-001",
        "password": get_password_hash("field123"),
        "name": "Field Officer",
        "role": "FIELD_OFFICIAL",
        "state": "Meghalaya",
        "district": "East Khasi Hills"
    },
    "NERA-DMO-001": {
        "id": "usr_063",
        "officialId": "NERA-DMO-001",
        "password": get_password_hash("disaster123"),
        "name": "Disaster Control Officer",
        "role": "DISASTER_OFFICIAL",
        "state": None,
        "district": None
    }
}

class LoginRequest(BaseModel):
    officialId: str
    password: str

@router.post("/login")
def login(login_data: LoginRequest, response: Response):
    user_dict = MOCK_USERS.get(login_data.officialId)
    if not user_dict:
        raise HTTPException(status_code=400, detail="Incorrect official ID or password")
    
    if not verify_password(login_data.password, user_dict["password"]):
        raise HTTPException(status_code=400, detail="Incorrect official ID or password")
    
    # Determine token durations based on role
    # Normal access token: 60 minutes
    # Field Official refresh token: 30 days. Others: 12 hours
    access_token_expires = timedelta(minutes=60)
    if user_dict["role"] == "FIELD_OFFICIAL":
        refresh_token_expires = timedelta(days=30)
    else:
        refresh_token_expires = timedelta(hours=12)
        
    access_token = create_access_token(
        subject=login_data.officialId, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        subject=login_data.officialId, expires_delta=refresh_token_expires
    )
    
    # Set HTTPOnly Cookie for Refresh Token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False, # Set to True in production with HTTPS
        samesite="lax",
        max_age=int(refresh_token_expires.total_seconds())
    )
    
    user_out = {k: v for k, v in user_dict.items() if k != "password"}
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_out
    }

@router.post("/refresh")
def refresh_token(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    official_id = payload.get("sub")
    user_dict = MOCK_USERS.get(official_id)
    if not user_dict:
        raise HTTPException(status_code=401, detail="User not found")
        
    access_token = create_access_token(
        subject=official_id, expires_delta=timedelta(minutes=60)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}

@router.get("/me")
def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload or payload.get("type") == "refresh":
        raise HTTPException(status_code=401, detail="Invalid access token")
        
    official_id = payload.get("sub")
    user_dict = MOCK_USERS.get(official_id)
    if not user_dict:
        raise HTTPException(status_code=401, detail="User not found")
        
    user_out = {k: v for k, v in user_dict.items() if k != "password"}
    return {"user": user_out}
