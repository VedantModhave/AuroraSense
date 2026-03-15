from fastapi import APIRouter
from datetime import datetime
from typing import Dict, Any

router = APIRouter()

@router.get("/health")
def health_check() -> Dict[str, Any]:
    """
    Backend health check endpoint useful for deployment and uptime monitoring.
    """
    return {
        "status": "ok",
        "service": "aurorasense",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
