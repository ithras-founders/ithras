"""Entity change telemetry emitter."""
from typing import Any

from ..services.tracking_service import telemetry_tracking


def track_entity_change(
    db: Any,
    actor_id: int | None,
    entity_type: str,
    entity_id: str | None,
    action: str,
    before: dict | None = None,
    after: dict | None = None,
    reason: str | None = None,
) -> str | None:
    """Track entity change for audit trail."""
    return telemetry_tracking.track_entity_change(
        db, actor_id, entity_type, entity_id, action, before, after, reason
    )
