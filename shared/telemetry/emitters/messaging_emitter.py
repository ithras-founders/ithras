"""Messaging telemetry emitter."""
from typing import Any

from ..services.tracking_service import telemetry_tracking


def track_message_sent(
    db: Any,
    actor_id: int,
    conversation_id: int,
    metadata: dict | None = None,
) -> str | None:
    """Track message sent."""
    return telemetry_tracking.track_messaging(
        db, "message_sent", actor_id, "conversation", str(conversation_id), metadata
    )


def track_request_accepted(
    db: Any,
    actor_id: int,
    request_id: int,
    conversation_id: int | None = None,
) -> str | None:
    """Track message request accepted."""
    meta = {"conversation_id": conversation_id} if conversation_id else {}
    return telemetry_tracking.track_messaging(
        db, "request_accepted", actor_id, "request", str(request_id), meta
    )


def track_request_ignored(
    db: Any,
    actor_id: int,
    request_id: int,
) -> str | None:
    """Track message request ignored."""
    return telemetry_tracking.track_messaging(
        db, "request_ignored", actor_id, "request", str(request_id)
    )
