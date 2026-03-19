"""Central telemetry tracking service."""
import uuid
from datetime import datetime
from typing import Any

from ..context import get_telemetry_context, ensure_request_id, ensure_trace_id
from ..repository import TelemetryRepository
from ..schemas import BaseTelemetryEvent
from ..utils.sanitization import sanitize_telemetry_metadata

_repo = TelemetryRepository()


class TelemetryTrackingService:
    """Central service for recording telemetry events."""

    def track(self, db: Any, event: BaseTelemetryEvent) -> str | None:
        """Validate, sanitize, and persist event. Fire-and-forget; failures are logged only."""
        try:
            ctx = get_telemetry_context()
            if not event.request_id and ctx.get("request_id"):
                event.request_id = ctx["request_id"]
            if not event.trace_id and ctx.get("trace_id"):
                event.trace_id = ctx["trace_id"]
            if not event.session_id and ctx.get("session_id"):
                event.session_id = ctx["session_id"]
            if not event.correlation_id:
                event.correlation_id = str(uuid.uuid4())
            if event.metadata:
                event.metadata = sanitize_telemetry_metadata(event.metadata)
            return _repo.save(db, event)
        except Exception:
            return None

    def track_api(
        self,
        db: Any,
        method: str,
        path: str,
        status_code: int | None,
        latency_ms: int | None,
        user_id: int | None = None,
        request_id: str | None = None,
    ) -> str | None:
        """Record API request to api_request_log."""
        try:
            rid = ensure_request_id(request_id)
            return _repo.save_api_request(db, method, path, status_code, latency_ms, user_id, rid)
        except Exception:
            return None

    def track_user_activity(
        self,
        db: Any,
        action: str,
        actor_id: int | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
        module: str | None = None,
        metadata: dict | None = None,
        status: str = "success",
    ) -> str | None:
        """Track user activity event."""
        event = BaseTelemetryEvent(
            domain="user_activity",
            event_type=action,
            action=action,
            actor_id=actor_id,
            actor_type="user",
            target_entity_type=entity_type,
            target_entity_id=entity_id,
            status=status,
            metadata=metadata,
        )
        event.metadata = event.metadata or {}
        if module:
            event.metadata["module"] = module
        return self.track(db, event)

    def track_audit(
        self,
        db: Any,
        action: str,
        actor_id: int | None,
        entity_type: str,
        entity_id: str | None,
        before: dict | None = None,
        after: dict | None = None,
        reason: str | None = None,
        metadata: dict | None = None,
    ) -> str | None:
        """Track audit action."""
        meta = dict(metadata or {})
        if before is not None:
            meta["before"] = sanitize_telemetry_metadata(before) if isinstance(before, dict) else before
        if after is not None:
            meta["after"] = sanitize_telemetry_metadata(after) if isinstance(after, dict) else after
        if reason:
            meta["reason"] = reason
        event = BaseTelemetryEvent(
            domain="audit",
            event_type=action,
            action=action,
            actor_id=actor_id,
            actor_type="admin",
            target_entity_type=entity_type,
            target_entity_id=entity_id,
            status="success",
            metadata=meta,
        )
        return self.track(db, event)

    def track_security(
        self,
        db: Any,
        event_type: str,
        success: bool,
        actor_id: int | None = None,
        identifier_masked: str | None = None,
        metadata: dict | None = None,
    ) -> str | None:
        """Track auth/security event."""
        meta = dict(metadata or {})
        if identifier_masked:
            meta["identifier_masked"] = identifier_masked
        event = BaseTelemetryEvent(
            domain="auth",
            event_type=event_type,
            action=event_type,
            actor_id=actor_id,
            status="success" if success else "error",
            severity="error" if not success else "info",
            metadata=meta,
        )
        return self.track(db, event)

    def track_messaging(
        self,
        db: Any,
        event_type: str,
        actor_id: int | None,
        entity_type: str,
        entity_id: str | None,
        metadata: dict | None = None,
    ) -> str | None:
        """Track messaging event."""
        event = BaseTelemetryEvent(
            domain="messaging",
            event_type=event_type,
            action=event_type,
            actor_id=actor_id,
            target_entity_type=entity_type,
            target_entity_id=entity_id,
            status="success",
            metadata=metadata,
        )
        return self.track(db, event)

    def track_entity_change(
        self,
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
        return self.track_audit(db, action, actor_id, entity_type, entity_id, before, after, reason)

    def track_error(
        self,
        db: Any,
        message: str,
        stack_trace: str | None = None,
        path: str | None = None,
        request_id: str | None = None,
        metadata: dict | None = None,
    ) -> str | None:
        """Track error to telemetry_errors table."""
        try:
            rid = ensure_request_id(request_id)
            return _repo.save_error(db, message, stack_trace, path, rid, metadata)
        except Exception:
            return None


# Singleton instance
telemetry_tracking = TelemetryTrackingService()
