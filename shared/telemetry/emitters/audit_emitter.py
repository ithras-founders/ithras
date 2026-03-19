"""Audit telemetry emitter."""
from typing import Any

from ..services.tracking_service import telemetry_tracking


def track_audit_action(
    db: Any,
    actor_id: int | None,
    action: str,
    entity_type: str,
    entity_id: str | None,
    before: dict | None = None,
    after: dict | None = None,
    reason: str | None = None,
    metadata: dict | None = None,
) -> str | None:
    """Track admin/audit action."""
    return telemetry_tracking.track_audit(
        db, action, actor_id, entity_type, entity_id, before, after, reason, metadata
    )
