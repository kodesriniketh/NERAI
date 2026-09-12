import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict

router = APIRouter()

active_tracking_connections: Dict[str, WebSocket] = {}

@router.websocket("/live/{route_id}")
async def live_tracking(websocket: WebSocket, route_id: str):
    await websocket.accept()
    active_tracking_connections[route_id] = websocket
    try:
        # Wait for the frontend to send the planned route coordinates
        data = await websocket.receive_json()
        coordinates = data.get("coordinates", [])
        speed_ms = data.get("speed_ms", 1000) # milliseconds between updates

        if not coordinates:
            await websocket.close(code=1003, reason="No coordinates provided")
            return

        # Simulate the truck driving along the coordinates
        total_points = len(coordinates)
        for index, coord in enumerate(coordinates):
            # To simulate a smoother drive, we could interpolate points here.
            # But iterating over the downsampled coordinates is perfectly fine for a demo.
            await websocket.send_json({
                "route_id": route_id,
                "current_position": coord, # [lat, lon]
                "progress_percentage": round((index / max(1, total_points - 1)) * 100, 1),
                "status": "in_transit" if index < total_points - 1 else "completed"
            })
            
            if index < total_points - 1:
                await asyncio.sleep(speed_ms / 1000.0)

    except WebSocketDisconnect:
        print(f"Tracking client disconnected from {route_id}")
    finally:
        if route_id in active_tracking_connections:
            del active_tracking_connections[route_id]
