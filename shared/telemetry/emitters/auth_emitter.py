"""Auth / security telemetry emitter."""
from typing import Any

from ..services.tracking_service import telemetry_tracking


def track_login_success(db: Any, actor_id: int) -> str | None:
    """Track successful login."""
    return telemetry_tracking.track_security(db, "login_success", success=True, actor_id=actor_id)


def track_login_failure(db: Any, identifier_masked: str | None = None) -> str | None:
    """Track failed login attempt (identifier should be masked/redacted)."""
    meta = {"identifier_masked": identifier_masked or "[redacted]"} if identifier_masked else {}
    return telemetry_tracking.track_security(db, "login_failure", success=False, metadata=meta)


def track_logout(db: Any, actor_id: int) -> str | None:
    """Track logout."""
    return telemetry_tracking.track_security(db, "logout", success=True, actor_id=actor_id)
