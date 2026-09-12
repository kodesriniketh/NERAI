# In-memory store for active incidents across the platform
import uuid
from typing import Dict, Any

# Structure: { incident_id: { lat, lon, description, status, severity, image_url, ... } }
ACTIVE_INCIDENTS: Dict[str, Any] = {}
