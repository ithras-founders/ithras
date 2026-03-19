"""Community telemetry emitter."""
from typing import Any

from ..schemas import BaseTelemetryEvent
from ..services.tracking_service import telemetry_tracking


def track_community_joined(
    db: Any,
    actor_id: int,
    community_id: int,
) -> str | None:
    """Track user joining a community."""
    event = BaseTelemetryEvent(
        domain="community",
        event_type="join",
        action="join",
        actor_id=actor_id,
        target_entity_type="community",
        target_entity_id=str(community_id),
        status="success",
        metadata={"community_id": community_id},
    )
    return telemetry_tracking.track(db, event)
