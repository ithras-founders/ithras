"""Setup status API - no auth required (runs before login)."""
from fastapi import APIRouter

from shared.setup.engine import setup_engine

router = APIRouter(prefix="/api/v1/setup", tags=["setup"])


@router.get("/status")
def get_setup_status():
    """
    Return database setup status. If schema is not ready, starts background setup
    and returns progress. Frontend polls until status is "ready".
    """
    return setup_engine()
