"""API telemetry emitter."""
from typing import Any

from ..services.tracking_service import telemetry_tracking


def track_api_request(
    db: Any,
    method: str,
    path: str,
    status_code: int | None,
    latency_ms: int | None,
    user_id: int | None = None,
    request_id: str | None = None,
) -> str | None:
    """Track API request to api_request_log."""
    return telemetry_tracking.track_api(db, method, path, status_code, latency_ms, user_id, request_id)
