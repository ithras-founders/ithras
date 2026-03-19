"""Telemetry Pydantic schemas."""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from .types import ActorType, EntityType, TelemetryDomain, TelemetrySeverity, TelemetryStatus


class BaseTelemetryEvent(BaseModel):
    """Base schema for all telemetry events."""

    id: str | None = None
    timestamp: datetime | str | None = None
    domain: str
    subdomain: str | None = None
    event_type: str
    action: str | None = None
    status: str | None = None
    severity: str | None = None
    actor_type: str | None = None
    actor_id: int | None = None
    target_entity_type: str | None = None
    target_entity_id: str | None = None
    request_id: str | None = None
    trace_id: str | None = None
    session_id: str | None = None
    correlation_id: str | None = None
    metadata: dict[str, Any] | None = None
    error_code: str | None = None
    error_message: str | None = None
    duration_ms: int | None = None
    summary: str | None = None


class ApiTelemetryEvent(BaseTelemetryEvent):
    """API request event."""

    domain: str = "api"
    method: str | None = None
    path: str | None = None
    status_code: int | None = None
    latency_ms: int | None = None


class UserActivityEvent(BaseTelemetryEvent):
    """User activity event."""

    action: str
    module: str | None = None


class AuditTelemetryEvent(BaseTelemetryEvent):
    """Audit / admin action event."""

    domain: str = "audit"
    action: str
    before: dict[str, Any] | None = None
    after: dict[str, Any] | None = None


class SecurityTelemetryEvent(BaseTelemetryEvent):
    """Auth / security event."""

    domain: str = "auth"
    event_type: str
    success: bool | None = None


class CommunityTelemetryEvent(BaseTelemetryEvent):
    """Community / channel event."""

    domain: str = "community"


class FeedTelemetryEvent(BaseTelemetryEvent):
    """Feed event (post, comment, reaction)."""

    domain: str = "feed"


class MessagingTelemetryEvent(BaseTelemetryEvent):
    """Messaging event."""

    domain: str = "messaging"


class NetworkTelemetryEvent(BaseTelemetryEvent):
    """Network event (connection, follow)."""

    domain: str = "network"


class EntityChangeTelemetryEvent(BaseTelemetryEvent):
    """Entity change event."""

    entity_type: str
    changes: list[dict[str, Any]] | None = None


class JobTelemetryEvent(BaseTelemetryEvent):
    """Job / background task event."""

    domain: str = "job"
    job_type: str | None = None


class WebhookTelemetryEvent(BaseTelemetryEvent):
    """Webhook delivery event."""

    domain: str = "webhook"
    url: str | None = None
    status_code: int | None = None


class ErrorTelemetryEvent(BaseTelemetryEvent):
    """Error event."""

    domain: str = "error"
    message: str
    stack: str | None = None


class SearchTelemetryEvent(BaseTelemetryEvent):
    """Search event."""

    domain: str = "search"
    query: str | None = None
    result_count: int | None = None


class ModerationTelemetryEvent(BaseTelemetryEvent):
    """Moderation event."""

    domain: str = "moderation"
    action: str


class TelemetryQueryFilters(BaseModel):
    """Filters for telemetry queries."""

    from_iso: str | None = Field(None, alias="from")
    to_iso: str | None = Field(None, alias="to")
    domain: str | None = None
    status: str | None = None
    severity: str | None = None
    entity_type: str | None = None
    entity_id: str | None = None
    actor_id: int | None = None
    limit: int = 50
    offset: int = 0
