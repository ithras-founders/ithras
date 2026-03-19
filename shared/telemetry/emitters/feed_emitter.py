"""Feed telemetry emitter."""
from typing import Any

from ..schemas import BaseTelemetryEvent
from ..services.tracking_service import telemetry_tracking


def track_post_created(
    db: Any,
    actor_id: int,
    post_id: int,
    community_id: int | None = None,
    channel_id: int | None = None,
) -> str | None:
    """Track post creation."""
    event = BaseTelemetryEvent(
        domain="feed",
        event_type="post_created",
        action="post_created",
        actor_id=actor_id,
        target_entity_type="post",
        target_entity_id=str(post_id),
        status="success",
        metadata={"community_id": community_id, "channel_id": channel_id},
    )
    return telemetry_tracking.track(db, event)


def track_comment_added(
    db: Any,
    actor_id: int,
    comment_id: int,
    post_id: int,
) -> str | None:
    """Track comment added to post."""
    event = BaseTelemetryEvent(
        domain="feed",
        event_type="comment_added",
        action="comment_added",
        actor_id=actor_id,
        target_entity_type="comment",
        target_entity_id=str(comment_id),
        status="success",
        metadata={"post_id": post_id},
    )
    return telemetry_tracking.track(db, event)


def track_reaction_added(
    db: Any,
    actor_id: int,
    post_id: int,
    reaction_type: str | None = None,
) -> str | None:
    """Track reaction added to post."""
    event = BaseTelemetryEvent(
        domain="feed",
        event_type="reaction_added",
        action="reaction_added",
        actor_id=actor_id,
        target_entity_type="post",
        target_entity_id=str(post_id),
        status="success",
        metadata={"reaction_type": reaction_type},
    )
    return telemetry_tracking.track(db, event)
