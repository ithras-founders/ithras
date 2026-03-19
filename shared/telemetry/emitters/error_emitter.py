"""Error telemetry emitter."""
from typing import Any

from ..services.tracking_service import telemetry_tracking


def track_error(
    db: Any,
    message: str,
    stack_trace: str | None = None,
    path: str | None = None,
    request_id: str | None = None,
    metadata: dict | None = None,
) -> str | None:
    """Track error to telemetry_errors table."""
    return telemetry_tracking.track_error(db, message, stack_trace, path, request_id, metadata)
