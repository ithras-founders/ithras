"""Network telemetry emitter."""
from typing import Any

from ..schemas import BaseTelemetryEvent
from ..services.tracking_service import telemetry_tracking


def track_connection_requested(
    db: Any,
    actor_id: int,
    target_user_id: int,
) -> str | None:
    """Track connection request sent."""
    event = BaseTelemetryEvent(
        domain="network",
        event_type="connection_requested",
        action="connection_requested",
        actor_id=actor_id,
        target_entity_type="connection",
        target_entity_id=str(target_user_id),
        status="success",
        metadata={"target_user_id": target_user_id},
    )
    return telemetry_tracking.track(db, event)


def track_connection_accepted(
    db: Any,
    actor_id: int,
    connection_id: int | None,
    target_user_id: int | None = None,
) -> str | None:
    """Track connection accepted."""
    event = BaseTelemetryEvent(
        domain="network",
        event_type="connection_accepted",
        action="connection_accepted",
        actor_id=actor_id,
        target_entity_type="connection",
        target_entity_id=str(connection_id) if connection_id else None,
        status="success",
        metadata={"target_user_id": target_user_id},
    )
    return telemetry_tracking.track(db, event)


def track_follow_added(
    db: Any,
    actor_id: int,
    target_user_id: int,
    follow_id: int | None = None,
) -> str | None:
    """Track follow created."""
    event = BaseTelemetryEvent(
        domain="network",
        event_type="follow_added",
        action="follow_added",
        actor_id=actor_id,
        target_entity_type="follow",
        target_entity_id=str(follow_id) if follow_id else str(target_user_id),
        status="success",
        metadata={"target_user_id": target_user_id},
    )
    return telemetry_tracking.track(db, event)
