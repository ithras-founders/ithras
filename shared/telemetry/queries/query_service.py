"""Telemetry query service for dashboard consumption."""
import json
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import text

from ..repository import TelemetryRepository, _row_to_event
from ..schemas import TelemetryQueryFilters

_repo = TelemetryRepository()


def _parse_range(from_iso: str | None, to_iso: str | None, default_hours: int = 24) -> tuple[str, str]:
    now = datetime.utcnow()
    default_from = (now - timedelta(hours=default_hours)).isoformat()
    default_to = now.isoformat()
    f = from_iso or default_from
    t = to_iso or default_to
    return (f.replace("Z", ""), t.replace("Z", ""))


class TelemetryQueryService:
    """Query service for telemetry data."""

    def get_overview_kpis(
        self,
        db: Any,
        from_iso: str | None = None,
        to_iso: str | None = None,
    ) -> dict[str, Any]:
        """Aggregate KPIs from telemetry tables."""
        f, t = _parse_range(from_iso, to_iso)
        kpis: dict[str, Any] = {}
        health: dict[str, str] = {}

        try:
            r = db.execute(
                text("""
                    SELECT COUNT(*) as c,
                           COALESCE(AVG(latency_ms), 0)::int as avg_lat,
                           COUNT(*) FILTER (WHERE status_code >= 500) as err
                    FROM api_request_log
                    WHERE created_at >= :f AND created_at <= :t
                """),
                {"f": f, "t": t},
            )
            row = r.fetchone()
            kpis["apiRequests"] = row.c or 0
            health["api"] = "healthy" if (row.err or 0) == 0 else "degraded"

            r = db.execute(
                text("""
                    SELECT COUNT(DISTINCT user_id) FROM api_request_log
                    WHERE created_at >= :f AND created_at <= :t AND user_id IS NOT NULL
                """),
                {"f": f, "t": t},
            )
            kpis["activeUsers"] = r.scalar() or 0

            total_req = kpis.get("apiRequests") or 1
            kpis["errorRate"] = round(100 * ((row.err or 0) / total_req), 1) if total_req else 0

            r = db.execute(
                text("""
                    SELECT COUNT(*) FROM telemetry_events
                    WHERE domain = 'auth' AND event_type = 'login_failure'
                      AND created_at >= :f AND created_at <= :t
                """),
                {"f": f, "t": t},
            )
            kpis["authFailures"] = r.scalar() or 0

            r = db.execute(
                text("""
                    SELECT COUNT(*) FROM telemetry_events
                    WHERE domain = 'audit' AND created_at >= :f AND created_at <= :t
                """),
                {"f": f, "t": t},
            )
            kpis["adminActions"] = r.scalar() or 0

            r = db.execute(
                text("""
                    SELECT COUNT(*) FROM telemetry_events
                    WHERE domain = 'messaging' AND created_at >= :f AND created_at <= :t
                """),
                {"f": f, "t": t},
            )
            kpis["messages"] = r.scalar() or 0

            r = db.execute(
                text("""
                    SELECT COUNT(*) FROM telemetry_events
                    WHERE domain = 'feed' AND event_type = 'post_created'
                      AND created_at >= :f AND created_at <= :t
                """),
                {"f": f, "t": t},
            )
            kpis["posts"] = r.scalar() or 0

            r = db.execute(
                text("""
                    SELECT COUNT(*) FROM telemetry_events
                    WHERE domain = 'community' AND created_at >= :f AND created_at <= :t
                """),
                {"f": f, "t": t},
            )
            kpis["communityJoins"] = r.scalar() or 0

            r = db.execute(
                text("""
                    SELECT COUNT(*) FROM telemetry_events
                    WHERE domain = 'network' AND created_at >= :f AND created_at <= :t
                """),
                {"f": f, "t": t},
            )
            kpis["connections"] = r.scalar() or 0

            r = db.execute(
                text("""
                    SELECT COUNT(*) FROM telemetry_events
                    WHERE domain = 'search' AND created_at >= :f AND created_at <= :t
                """),
                {"f": f, "t": t},
            )
            kpis["search"] = r.scalar() or 0

            r = db.execute(
                text("""
                    SELECT COUNT(*) FROM telemetry_events
                    WHERE domain = 'moderation' AND created_at >= :f AND created_at <= :t
                """),
                {"f": f, "t": t},
            )
            kpis["moderation"] = r.scalar() or 0

            health["jobs"] = "healthy"
            health["webhooks"] = "healthy"
            health["auth"] = "healthy"
            health["messaging"] = "healthy"

        except Exception:
            pass

        return {"kpis": kpis, "health": health}

    def get_api_telemetry(
        self,
        db: Any,
        from_iso: str | None = None,
        to_iso: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[dict], int]:
        """Aggregate api_request_log by path+method."""
        f, t = _parse_range(from_iso, to_iso)
        try:
            r = db.execute(
                text("""
                    SELECT path, method,
                           COUNT(*) as request_count,
                           100.0 * COUNT(*) FILTER (WHERE status_code < 400) / NULLIF(COUNT(*), 0) as success_rate,
                           100.0 * COUNT(*) FILTER (WHERE status_code >= 500) / NULLIF(COUNT(*), 0) as error_rate,
                           COALESCE(AVG(latency_ms), 0)::int as avg_latency_ms,
                           COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 0)::int as p95_latency_ms,
                           MAX(created_at) as last_seen
                    FROM api_request_log
                    WHERE created_at >= :f AND created_at <= :t
                    GROUP BY path, method
                    ORDER BY request_count DESC
                """),
                {"f": f, "t": t},
            )
            rows = r.fetchall()
            total = len(rows)
            items = []
            for row in rows[offset : offset + limit]:
                items.append({
                    "endpoint": row.path,
                    "method": row.method or "GET",
                    "requestCount": row.request_count,
                    "successRate": round(row.success_rate or 0, 1),
                    "errorRate": round(row.error_rate or 0, 1),
                    "avgLatencyMs": row.avg_latency_ms or 0,
                    "p95LatencyMs": row.p95_latency_ms or 0,
                    "lastSeen": row.last_seen.isoformat() if hasattr(row.last_seen, "isoformat") else str(row.last_seen),
                    "id": f"{row.method}:{row.path}",
                })
            return (items, total)
        except Exception:
            return ([], 0)

    def get_api_telemetry_detail(
        self,
        db: Any,
        endpoint_id: str,
        from_iso: str | None = None,
        to_iso: str | None = None,
        limit: int = 50,
    ) -> tuple[dict | None, list[dict]]:
        """Individual requests for endpoint (endpoint_id is method:path)."""
        f, t = _parse_range(from_iso, to_iso)
        parts = endpoint_id.split(":", 1)
        method = parts[0] if len(parts) > 1 else "GET"
        path = parts[1] if len(parts) > 1 else endpoint_id

        try:
            r = db.execute(
                text("""
                    SELECT id, method, path, status_code, latency_ms, user_id, request_id, created_at
                    FROM api_request_log
                    WHERE path = :path AND method = :method
                      AND created_at >= :f AND created_at <= :t
                    ORDER BY created_at DESC
                    LIMIT :limit
                """),
                {"path": path, "method": method, "f": f, "t": t, "limit": limit},
            )
            requests = []
            for row in r.fetchall():
                requests.append({
                    "id": str(row.id),
                    "timestamp": row.created_at.isoformat() if hasattr(row.created_at, "isoformat") else str(row.created_at),
                    "method": row.method,
                    "endpoint": row.path,
                    "statusCode": row.status_code,
                    "latencyMs": row.latency_ms,
                    "userId": str(row.user_id) if row.user_id else None,
                    "requestId": row.request_id,
                })
            return ({"method": method, "path": path}, requests)
        except Exception:
            return (None, [])

    def get_user_activity(self, db: Any, filters: TelemetryQueryFilters) -> tuple[list[dict], int]:
        """User activity events."""
        return _repo.query(db, filters, domain_filter=None)

    def get_audit_logs(self, db: Any, filters: TelemetryQueryFilters) -> tuple[list[dict], int]:
        """Audit domain events."""
        data = filters.model_dump() if hasattr(filters, "model_dump") else dict(filters)
        data["domain"] = "audit"
        f = TelemetryQueryFilters(**data)
        return _repo.query(db, f)

    def get_security_events(self, db: Any, filters: TelemetryQueryFilters) -> tuple[list[dict], int]:
        """Auth domain events."""
        data = filters.model_dump() if hasattr(filters, "model_dump") else dict(filters)
        data["domain"] = "auth"
        f = TelemetryQueryFilters(**data)
        return _repo.query(db, f)

    def get_social_telemetry(self, db: Any, filters: TelemetryQueryFilters) -> tuple[list[dict], int, dict]:
        """Feed and community events. Returns (items, total, summary)."""
        f, t = _parse_range(
            getattr(filters, "from_iso", None) or getattr(filters, "from", None),
            getattr(filters, "to_iso", None) or getattr(filters, "to", None),
        )
        where = ["created_at >= :f", "created_at <= :t", "domain IN ('feed', 'community')"]
        params = {"f": f, "t": t, "limit": filters.limit, "offset": filters.offset}
        if filters.domain:
            where[2] = "domain = :domain"
            params["domain"] = filters.domain
        summary = {"communities": 0, "feedPosts": 0, "messages": 0}
        try:
            base_where = "created_at >= :f AND created_at <= :t"
            r = db.execute(
                text(f"SELECT COUNT(*) FROM telemetry_events WHERE {base_where} AND domain = 'community'"),
                {"f": f, "t": t},
            )
            summary["communities"] = r.scalar() or 0
            r = db.execute(
                text(f"SELECT COUNT(*) FROM telemetry_events WHERE {base_where} AND domain = 'feed' AND event_type = 'post_created'"),
                {"f": f, "t": t},
            )
            summary["feedPosts"] = r.scalar() or 0
            r = db.execute(
                text(f"SELECT COUNT(*) FROM telemetry_events WHERE {base_where} AND domain = 'messaging'"),
                {"f": f, "t": t},
            )
            summary["messages"] = r.scalar() or 0

            r = db.execute(
                text(f"SELECT COUNT(*) FROM telemetry_events WHERE {' AND '.join(where)}"),
                {k: v for k, v in params.items() if k not in ("limit", "offset")},
            )
            total = r.scalar() or 0
            r = db.execute(
                text(f"""
                    SELECT id, created_at, domain, subdomain, event_type, action, actor_id, actor_type,
                           entity_type, entity_id, status, severity, request_id, trace_id, session_id,
                           correlation_id, metadata_json, error_code, error_message, duration_ms, summary
                    FROM telemetry_events WHERE {' AND '.join(where)}
                    ORDER BY created_at DESC LIMIT :limit OFFSET :offset
                """),
                params,
            )
            return ([_row_to_event(row) for row in r.fetchall()], total, summary)
        except Exception:
            return ([], 0, summary)

    def get_network_telemetry(self, db: Any, filters: TelemetryQueryFilters) -> tuple[list[dict], int]:
        """Network domain events."""
        f = TelemetryQueryFilters(**{**filters.model_dump(), "domain": "network"})
        return _repo.query(db, f)

    def get_entity_history(self, db: Any, filters: TelemetryQueryFilters) -> tuple[list[dict], int]:
        """Entity change history."""
        f, t = _parse_range(
            getattr(filters, "from_iso", None) or getattr(filters, "from", None),
            getattr(filters, "to_iso", None) or getattr(filters, "to", None),
        )
        where = ["created_at >= :f", "created_at <= :t", "entity_type IS NOT NULL"]
        params = {"f": f, "t": t, "limit": filters.limit, "offset": filters.offset}
        if filters.entity_type:
            where.append("entity_type = :entity_type")
            params["entity_type"] = filters.entity_type
        if filters.entity_id:
            where.append("entity_id = :entity_id")
            params["entity_id"] = filters.entity_id
        try:
            r = db.execute(text(f"SELECT COUNT(*) FROM telemetry_events WHERE {' AND '.join(where)}"), {k: v for k, v in params.items() if k not in ("limit", "offset")})
            total = r.scalar() or 0
            r = db.execute(
                text(f"""
                    SELECT id, created_at, domain, subdomain, event_type, action, actor_id, actor_type,
                           entity_type, entity_id, status, severity, request_id, trace_id, session_id,
                           correlation_id, metadata_json, error_code, error_message, duration_ms, summary
                    FROM telemetry_events WHERE {' AND '.join(where)}
                    ORDER BY created_at DESC LIMIT :limit OFFSET :offset
                """),
                params,
            )
            return ([_row_to_event(row) for row in r.fetchall()], total)
        except Exception:
            return ([], 0)

    def get_errors(
        self,
        db: Any,
        from_iso: str | None = None,
        to_iso: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[dict], int, dict]:
        """telemetry_errors table."""
        f, t = _parse_range(from_iso, to_iso)
        summary = {"total": 0, "critical": 0, "clusters": 0}
        try:
            r = db.execute(
                text("""
                    SELECT id, created_at, message, stack_trace, path, request_id, metadata_json
                    FROM telemetry_errors
                    WHERE created_at >= :f AND created_at <= :t
                    ORDER BY created_at DESC
                """),
                {"f": f, "t": t},
            )
            rows = r.fetchall()
            total = len(rows)
            summary["total"] = total
            items = []
            for row in rows[offset : offset + limit]:
                meta = None
                if row.metadata_json:
                    try:
                        meta = json.loads(row.metadata_json) if isinstance(row.metadata_json, str) else row.metadata_json
                    except Exception:
                        meta = {}
                items.append({
                    "id": str(row.id),
                    "timestamp": row.created_at.isoformat() if hasattr(row.created_at, "isoformat") else str(row.created_at),
                    "message": row.message or "",
                    "stack": row.stack_trace,
                    "path": row.path,
                    "requestId": row.request_id,
                    "metadata": meta,
                    "domain": "error",
                    "type": "error",
                    "severity": "error",
                    "count": 1,
                })
            return (items, total, summary)
        except Exception:
            return ([], 0, summary)

    def get_search_telemetry(self, db: Any, filters: TelemetryQueryFilters) -> tuple[list[dict], int]:
        """Search domain events."""
        items, total = _repo.query(db, filters, domain_filter="search")
        for ev in items:
            meta = ev.get("metadata") or {}
            ev["query"] = meta.get("query", "")
            ev["resultCount"] = meta.get("result_count")
        return (items, total)

    def get_moderation_events(self, db: Any, filters: TelemetryQueryFilters) -> tuple[list[dict], int]:
        """Moderation domain events."""
        data = filters.model_dump() if hasattr(filters, "model_dump") else dict(filters)
        data["domain"] = "moderation"
        return _repo.query(db, TelemetryQueryFilters(**data))

    def get_compliance_exports(self, db: Any, filters: TelemetryQueryFilters) -> tuple[list[dict], int]:
        """Compliance domain events."""
        data = filters.model_dump() if hasattr(filters, "model_dump") else dict(filters)
        data["domain"] = "compliance"
        return _repo.query(db, TelemetryQueryFilters(**data))

    def get_jobs(self, db: Any, filters: TelemetryQueryFilters) -> tuple[list[dict], int]:
        """Job domain events."""
        data = filters.model_dump() if hasattr(filters, "model_dump") else dict(filters)
        data["domain"] = "job"
        return _repo.query(db, TelemetryQueryFilters(**data))

    def get_webhooks(self, db: Any, filters: TelemetryQueryFilters) -> tuple[list[dict], int]:
        """Webhook domain events."""
        data = filters.model_dump() if hasattr(filters, "model_dump") else dict(filters)
        data["domain"] = "webhook"
        return _repo.query(db, TelemetryQueryFilters(**data))


telemetry_query_service = TelemetryQueryService()
