"""Moderation telemetry emitter."""
from typing import Any

from ..schemas import BaseTelemetryEvent
from ..services.tracking_service import telemetry_tracking


def track_moderation_action(
    db: Any,
    actor_id: int,
    action: str,
    entity_type: str,
    entity_id: str,
    metadata: dict | None = None,
) -> str | None:
    """Track moderation action (hide, remove, lock, flag, etc.)."""
    event = BaseTelemetryEvent(
        domain="moderation",
        event_type=action,
        action=action,
        actor_id=actor_id,
        actor_type="admin",
        target_entity_type=entity_type,
        target_entity_id=entity_id,
        status="success",
        metadata=metadata or {},
    )
    return telemetry_tracking.track(db, event)
