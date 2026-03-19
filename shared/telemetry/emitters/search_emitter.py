"""Search telemetry emitter."""
from typing import Any

from ..schemas import BaseTelemetryEvent
from ..services.tracking_service import telemetry_tracking


def track_search_performed(
    db: Any,
    entity_type: str,
    query: str,
    result_count: int,
    actor_id: int | None = None,
) -> str | None:
    """Track search performed."""
    event = BaseTelemetryEvent(
        domain="search",
        event_type="search_performed",
        action="search_performed",
        actor_id=actor_id,
        target_entity_type=entity_type,
        status="success",
        metadata={"query": (query or "")[:100], "result_count": result_count},
    )
    return telemetry_tracking.track(db, event)
