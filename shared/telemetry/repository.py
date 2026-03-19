"""Telemetry persistence repository."""
import json
import logging
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError

from .schemas import BaseTelemetryEvent, TelemetryQueryFilters
from .utils.sanitization import sanitize_telemetry_metadata

logger = logging.getLogger("ithras.telemetry")


def _parse_range(from_iso: str | None, to_iso: str | None, default_hours: int = 24) -> tuple[str, str]:
    now = datetime.utcnow()
    default_from = (now - timedelta(hours=default_hours)).isoformat()
    default_to = now.isoformat()
    f = from_iso or default_from
    t = to_iso or default_to
    return (f.replace("Z", ""), t.replace("Z", ""))


class TelemetryRepository:
    """Persistence layer for telemetry events."""

    def save(self, db: Any, event: BaseTelemetryEvent) -> str | None:
        """Insert single event into telemetry_events. Returns id or None on failure."""
        try:
            meta = event.metadata or {}
            meta = sanitize_telemetry_metadata(meta)
            meta_json = json.dumps(meta) if meta else None

            r = db.execute(
                text("""
                    INSERT INTO telemetry_events (
                        domain, subdomain, event_type, action, actor_id, actor_type,
                        entity_type, entity_id, status, severity, request_id, trace_id,
                        session_id, correlation_id, metadata_json, error_code, error_message,
                        duration_ms, summary
                    ) VALUES (
                        :domain, :subdomain, :event_type, :action, :actor_id, :actor_type,
                        :entity_type, :entity_id, :status, :severity, :request_id, :trace_id,
                        :session_id, :correlation_id, :metadata_json, :error_code, :error_message,
                        :duration_ms, :summary
                    )
                    RETURNING id
                """),
                {
                    "domain": event.domain[:32],
                    "subdomain": (event.subdomain or "")[:32],
                    "event_type": (event.event_type or "")[:64],
                    "action": (event.action or "")[:64],
                    "actor_id": event.actor_id,
                    "actor_type": (event.actor_type or "")[:32],
                    "entity_type": (event.target_entity_type or "")[:64],
                    "entity_id": (event.target_entity_id or "")[:128],
                    "status": (event.status or "")[:16],
                    "severity": (event.severity or "")[:16],
                    "request_id": (event.request_id or "")[:64],
                    "trace_id": (event.trace_id or "")[:64],
                    "session_id": (event.session_id or "")[:64],
                    "correlation_id": (event.correlation_id or "")[:64],
                    "metadata_json": meta_json,
                    "error_code": (event.error_code or "")[:64],
                    "error_message": (event.error_message or "")[:4096] if event.error_message else None,
                    "duration_ms": event.duration_ms,
                    "summary": (event.summary or "")[:1024] if event.summary else None,
                },
            )
            row = r.fetchone()
            db.commit()
            return str(row.id) if row else None
        except ProgrammingError as e:
            logger.debug("Telemetry save failed (table may not exist): %s", e)
            try:
                db.rollback()
            except Exception:
                pass
            return None
        except Exception as e:
            logger.warning("Telemetry save failed: %s", e)
            try:
                db.rollback()
            except Exception:
                pass
            return None

    def save_many(self, db: Any, events: list[BaseTelemetryEvent]) -> int:
        """Bulk insert events. Returns count of successfully inserted."""
        count = 0
        for ev in events:
            if self.save(db, ev):
                count += 1
        return count

    def save_api_request(
        self,
        db: Any,
        method: str,
        path: str,
        status_code: int | None,
        latency_ms: int | None,
        user_id: int | None,
        request_id: str | None,
    ) -> str | None:
        """Insert API request into api_request_log."""
        try:
            r = db.execute(
                text("""
                    INSERT INTO api_request_log (method, path, status_code, latency_ms, user_id, request_id)
                    VALUES (:method, :path, :status_code, :latency_ms, :user_id, :request_id)
                    RETURNING id
                """),
                {
                    "method": (method or "GET")[:8],
                    "path": (path or "")[:512],
                    "status_code": status_code,
                    "latency_ms": latency_ms,
                    "user_id": user_id,
                    "request_id": (request_id or "")[:64],
                },
            )
            row = r.fetchone()
            db.commit()
            return str(row.id) if row else None
        except ProgrammingError as e:
            logger.debug("API request log save failed: %s", e)
            try:
                db.rollback()
            except Exception:
                pass
            return None
        except Exception as e:
            logger.warning("API request log save failed: %s", e)
            try:
                db.rollback()
            except Exception:
                pass
            return None

    def save_error(
        self,
        db: Any,
        message: str,
        stack_trace: str | None,
        path: str | None,
        request_id: str | None,
        metadata: dict | None = None,
    ) -> str | None:
        """Insert error into telemetry_errors."""
        try:
            meta_json = json.dumps(sanitize_telemetry_metadata(metadata or {})) if metadata else None
            r = db.execute(
                text("""
                    INSERT INTO telemetry_errors (message, stack_trace, path, request_id, metadata_json)
                    VALUES (:msg, :stack, :path, :rid, :meta)
                    RETURNING id
                """),
                {
                    "msg": (message or "")[:4096],
                    "stack": (stack_trace or "")[:65535] if stack_trace else None,
                    "path": (path or "")[:512] if path else None,
                    "rid": (request_id or "")[:64] if request_id else None,
                    "meta": meta_json,
                },
            )
            row = r.fetchone()
            db.commit()
            return str(row.id) if row else None
        except ProgrammingError as e:
            logger.debug("Error log save failed: %s", e)
            try:
                db.rollback()
            except Exception:
                pass
            return None
        except Exception as e:
            logger.warning("Error log save failed: %s", e)
            try:
                db.rollback()
            except Exception:
                pass
            return None

    def find_by_id(self, db: Any, event_id: str | int) -> dict | None:
        """Find single telemetry event by id."""
        try:
            r = db.execute(
                text("""
                    SELECT id, created_at, domain, subdomain, event_type, action, actor_id, actor_type,
                           entity_type, entity_id, status, severity, request_id, trace_id, session_id,
                           correlation_id, metadata_json, error_code, error_message, duration_ms, summary
                    FROM telemetry_events WHERE id = :id
                """),
                {"id": int(event_id)},
            )
            row = r.fetchone()
            return _row_to_event(row) if row else None
        except Exception:
            return None

    def query(
        self,
        db: Any,
        filters: TelemetryQueryFilters,
        domain_filter: str | None = None,
    ) -> tuple[list[dict], int]:
        """Query telemetry_events with filters. Returns (items, total)."""
        f, t = _parse_range(
            getattr(filters, "from_iso", None) or getattr(filters, "from", None),
            getattr(filters, "to_iso", None) or getattr(filters, "to", None),
        )
        where = ["created_at >= :f", "created_at <= :t"]
        params: dict[str, Any] = {"f": f, "t": t, "limit": filters.limit, "offset": filters.offset}

        if domain_filter:
            where.append("domain = :domain")
            params["domain"] = domain_filter
        if filters.domain:
            where.append("domain = :domain")
            params["domain"] = filters.domain
        if filters.status:
            where.append("status = :status")
            params["status"] = filters.status
        if filters.entity_type:
            where.append("entity_type = :entity_type")
            params["entity_type"] = filters.entity_type
        if filters.entity_id:
            where.append("entity_id = :entity_id")
            params["entity_id"] = filters.entity_id
        if filters.actor_id is not None:
            where.append("actor_id = :actor_id")
            params["actor_id"] = filters.actor_id

        try:
            # Count
            r = db.execute(
                text(f"SELECT COUNT(*) FROM telemetry_events WHERE {' AND '.join(where)}"),
                {k: v for k, v in params.items() if k not in ("limit", "offset")},
            )
            total = r.scalar() or 0

            # Fetch
            r = db.execute(
                text(f"""
                    SELECT id, created_at, domain, subdomain, event_type, action, actor_id, actor_type,
                           entity_type, entity_id, status, severity, request_id, trace_id, session_id,
                           correlation_id, metadata_json, error_code, error_message, duration_ms, summary
                    FROM telemetry_events WHERE {' AND '.join(where)}
                    ORDER BY created_at DESC
                    LIMIT :limit OFFSET :offset
                """),
                params,
            )
            rows = r.fetchall()
            items = [_row_to_event(row) for row in rows]
            return (items, total)
        except Exception:
            return ([], 0)

    def query_by_entity(
        self,
        db: Any,
        entity_type: str,
        entity_id: str,
        filters: TelemetryQueryFilters,
    ) -> tuple[list[dict], int]:
        """Query events for a specific entity."""
        filters.entity_type = entity_type
        filters.entity_id = entity_id
        return self.query(db, filters)

    def query_by_actor(
        self,
        db: Any,
        actor_id: int,
        filters: TelemetryQueryFilters,
    ) -> tuple[list[dict], int]:
        """Query events by actor."""
        filters.actor_id = actor_id
        return self.query(db, filters)

    def query_by_request_id(self, db: Any, request_id: str) -> list[dict]:
        """Query events by request_id."""
        try:
            r = db.execute(
                text("""
                    SELECT id, created_at, domain, subdomain, event_type, action, actor_id, actor_type,
                           entity_type, entity_id, status, severity, request_id, trace_id, session_id,
                           correlation_id, metadata_json, error_code, error_message, duration_ms, summary
                    FROM telemetry_events WHERE request_id = :rid
                    ORDER BY created_at DESC
                """),
                {"rid": request_id},
            )
            return [_row_to_event(row) for row in r.fetchall()]
        except Exception:
            return []

    def query_by_trace_id(self, db: Any, trace_id: str) -> list[dict]:
        """Query events by trace_id."""
        try:
            r = db.execute(
                text("""
                    SELECT id, created_at, domain, subdomain, event_type, action, actor_id, actor_type,
                           entity_type, entity_id, status, severity, request_id, trace_id, session_id,
                           correlation_id, metadata_json, error_code, error_message, duration_ms, summary
                    FROM telemetry_events WHERE trace_id = :tid
                    ORDER BY created_at DESC
                """),
                {"tid": trace_id},
            )
            return [_row_to_event(row) for row in r.fetchall()]
        except Exception:
            return []

    def query_by_domain(
        self,
        db: Any,
        domain: str,
        filters: TelemetryQueryFilters,
    ) -> tuple[list[dict], int]:
        """Query events by domain."""
        return self.query(db, filters, domain_filter=domain)


def _row_to_event(row: Any) -> dict:
    """Convert DB row to API shape."""
    meta = None
    if row.metadata_json:
        try:
            meta = json.loads(row.metadata_json) if isinstance(row.metadata_json, str) else row.metadata_json
        except Exception:
            meta = {}
    return {
        "id": str(row.id),
        "timestamp": row.created_at.isoformat() if hasattr(row.created_at, "isoformat") else str(row.created_at),
        "domain": row.domain or "unknown",
        "type": row.event_type or "",
        "actorId": str(row.actor_id) if row.actor_id else None,
        "actorType": row.actor_type,
        "entityId": row.entity_id,
        "entityType": row.entity_type,
        "status": row.status,
        "severity": row.severity,
        "summary": row.summary,
        "metadata": meta,
    }
