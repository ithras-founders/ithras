"""Telemetry API - aggregated metrics, time-series, user activity, database health."""
import time
from fastapi import APIRouter, Query, Body, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.middleware.telemetry_middleware import (
    get_aggregated_metrics,
    record_client_events,
    get_client_page_metrics,
    get_client_api_metrics,
    get_entries_since,
    get_active_users,
    get_timeseries,
)
from app.modules.shared.telemetry_store import (
    get_sessions as _store_get_sessions,
    compute_funnels as _store_compute_funnels,
    detect_alerts as _store_detect_alerts,
)
from app.modules.shared import database
from app.modules.shared.services.audit_query import (
    AuditQueryFilters,
    get_audit_logs_page,
    get_audit_summary as get_audit_summary_data,
    get_entity_audit_timeline,
)

router = APIRouter(prefix="/api/v1/telemetry", tags=["telemetry"])

SECONDS = {"1h": 3600, "24h": 86400, "7d": 604800}


def _resolve_range(last, from_ts, to_ts):
    now = time.time()
    if last:
        if last not in SECONDS:
            return None, None, {"error": f"Invalid last. Use one of: {list(SECONDS.keys())}"}
        return now - SECONDS[last], now, None
    if from_ts is None:
        return now - 3600, now, None
    return from_ts, to_ts or now, None


@router.get("/metrics")
def get_metrics(
    last: str | None = Query(None, description="last=1h|24h|7d"),
    from_ts: float | None = Query(None, alias="from"),
    to_ts: float | None = Query(None, alias="to"),
):
    """Aggregated metrics per endpoint."""
    ft, tt, err = _resolve_range(last, from_ts, to_ts)
    if err:
        return err

    raw = get_aggregated_metrics(ft, tt)

    seen: dict[tuple[str, str], dict] = {}
    for r in raw:
        key = (r["path"], r["method"])
        if key not in seen:
            seen[key] = {"path": r["path"], "method": r["method"], "2xx": 0, "4xx": 0, "5xx": 0, "total": 0, "p50_ms": 0, "p95_ms": 0, "p99_ms": 0, "avg_ms": 0}
        seen[key][r["status_bucket"]] = r["count"]
        seen[key]["total"] += r["count"]
        if r["status_bucket"] == "2xx":
            seen[key]["p50_ms"] = r["p50_ms"]
            seen[key]["p95_ms"] = r["p95_ms"]
            seen[key]["p99_ms"] = r["p99_ms"]
            seen[key]["avg_ms"] = r["avg_ms"]

    merged = sorted(
        [{"path": v["path"], "method": v["method"], "2xx": v["2xx"], "4xx": v["4xx"], "5xx": v["5xx"], "total": v["total"], "p50_ms": v["p50_ms"], "p95_ms": v["p95_ms"], "p99_ms": v["p99_ms"], "avg_ms": v["avg_ms"]} for v in seen.values()],
        key=lambda x: -x["total"],
    )
    return {"from": ft, "to": tt, "metrics": merged}


@router.post("/client")
def post_client_events(request: Request, events: dict = Body(...)):
    """Accept client-side telemetry events (API timing, page views)."""
    from app.middleware.telemetry_middleware import _extract_client_ip
    client_ip = _extract_client_ip(request)
    user_agent = request.headers.get("user-agent", "")
    evts = events.get("events", [])
    enriched = []
    for e in evts:
        ev = {**e}
        if not ev.get("client_ip"):
            ev["client_ip"] = client_ip
        if not ev.get("user_agent"):
            ev["user_agent"] = user_agent
        enriched.append(ev)
    if enriched:
        record_client_events(enriched)
    return {"received": len(enriched)}


@router.get("/client/pages")
def get_client_pages(last: str | None = Query("1h", description="last=1h|24h|7d")):
    """Page-wise time spent (from client telemetry)."""
    now = time.time()
    if last not in SECONDS:
        return {"error": f"Invalid last. Use one of: {list(SECONDS.keys())}"}
    ft = now - SECONDS[last]
    data = get_client_page_metrics(ft, now)
    return {"from": ft, "to": now, "pages": data}


@router.get("/client/api")
def get_client_api(last: str | None = Query("1h", description="last=1h|24h|7d")):
    """Client-side API timing by endpoint."""
    now = time.time()
    if last not in SECONDS:
        return {"error": f"Invalid last. Use one of: {list(SECONDS.keys())}"}
    ft = now - SECONDS[last]
    data = get_client_api_metrics(ft, now)
    return {"from": ft, "to": now, "endpoints": data}


@router.get("/summary")
def get_summary(last: str | None = Query("1h", description="last=1h|24h|7d")):
    """High-level stats with accurate latency from raw durations."""
    now = time.time()
    if last not in SECONDS:
        return {"error": f"Invalid last. Use one of: {list(SECONDS.keys())}"}
    ft = now - SECONDS[last]

    entries = get_entries_since(ft, now)
    total = len(entries)
    success = sum(1 for e in entries if e.get("status_bucket") == "2xx")
    failed_4xx = sum(1 for e in entries if e.get("status_bucket") == "4xx")
    failed_5xx = sum(1 for e in entries if e.get("status_bucket") == "5xx")

    durations = sorted(e.get("duration_ms", 0) for e in entries)
    n = len(durations)
    avg_ms = sum(durations) / n if n else 0
    p50 = durations[int(n * 0.5)] if n else 0
    p95 = durations[int(n * 0.95)] if n else 0
    p99 = durations[int(n * 0.99)] if n else 0

    user_info = get_active_users(ft, now)

    return {
        "from": ft,
        "to": now,
        "last": last,
        "total_requests": total,
        "success_count": success,
        "4xx_count": failed_4xx,
        "5xx_count": failed_5xx,
        "success_rate": round(success / total, 4) if total else 0,
        "error_rate": round((failed_4xx + failed_5xx) / total, 4) if total else 0,
        "avg_latency_ms": round(avg_ms, 2),
        "p50_ms": round(p50, 2),
        "p95_ms": round(p95, 2),
        "p99_ms": round(p99, 2),
        "active_users": user_info["active_count"],
    }


@router.get("/timeseries")
def get_timeseries_endpoint(
    last: str | None = Query("1h", description="last=1h|24h|7d"),
    bucket: int = Query(60, description="Bucket size in seconds"),
):
    """Time-series of request counts bucketed by interval."""
    now = time.time()
    if last not in SECONDS:
        return {"error": f"Invalid last. Use one of: {list(SECONDS.keys())}"}
    ft = now - SECONDS[last]
    if last == "7d":
        bucket = max(bucket, 3600)
    elif last == "24h":
        bucket = max(bucket, 300)
    data = get_timeseries(ft, now, bucket)
    return {"from": ft, "to": now, "bucket_seconds": bucket, "series": data}


@router.get("/users/active")
def get_active_users_endpoint(last: str | None = Query("1h", description="last=1h|24h|7d")):
    """Active users from client telemetry."""
    now = time.time()
    if last not in SECONDS:
        return {"error": f"Invalid last. Use one of: {list(SECONDS.keys())}"}
    ft = now - SECONDS[last]
    data = get_active_users(ft, now)
    return {"from": ft, "to": now, **data}


@router.get("/database")
def get_database_health(db: Session = Depends(database.get_db)):
    """Database health: table sizes and connection stats."""
    try:
        tables_result = db.execute(text("""
            SELECT
                schemaname AS table_schema,
                relname AS table_name,
                n_live_tup AS approximate_row_count,
                pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(relname)) AS total_bytes
            FROM pg_stat_user_tables
            ORDER BY n_live_tup DESC
        """))
        tables = [
            {
                "table_schema": r.table_schema,
                "table_name": r.table_name,
                "row_count": r.approximate_row_count,
                "size_bytes": r.total_bytes,
                "size_mb": round(r.total_bytes / (1024 * 1024), 2) if r.total_bytes else 0,
            }
            for r in tables_result
        ]

        conn_result = db.execute(text("""
            SELECT
                count(*) AS total,
                count(*) FILTER (WHERE state = 'active') AS active,
                count(*) FILTER (WHERE state = 'idle') AS idle,
                count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_transaction
            FROM pg_stat_activity
            WHERE datname = current_database()
        """))
        conn_row = conn_result.fetchone()
        connections = {
            "total": conn_row.total if conn_row else 0,
            "active": conn_row.active if conn_row else 0,
            "idle": conn_row.idle if conn_row else 0,
            "idle_in_transaction": conn_row.idle_in_transaction if conn_row else 0,
        }

        db_size_result = db.execute(text("SELECT pg_database_size(current_database()) AS size_bytes"))
        db_size_row = db_size_result.fetchone()
        db_size_bytes = db_size_row.size_bytes if db_size_row else 0

        return {
            "tables": tables,
            "total_tables": len(tables),
            "connections": connections,
            "database_size_bytes": db_size_bytes,
            "database_size_mb": round(db_size_bytes / (1024 * 1024), 2),
        }
    except Exception as e:
        return {"error": str(e), "tables": [], "connections": {}, "total_tables": 0, "database_size_mb": 0}


@router.get("/audit")
def get_telemetry_audit_logs(
    user_id: str | None = Query(None),
    action: str | None = Query(None),
    entity_type: str | None = Query(None),
    entity_id: str | None = Query(None),
    institution_id: str | None = Query(None),
    company_id: str | None = Query(None),
    from_date: str | None = Query(None),
    to_date: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(database.get_db),
):
    """Telemetry surface for audit logs (api-only merge with audit_logs table)."""
    filters = AuditQueryFilters(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        institution_id=institution_id,
        company_id=company_id,
        from_date=from_date,
        to_date=to_date,
    )
    return get_audit_logs_page(db, filters, limit=limit, offset=offset)


@router.get("/audit/summary")
def get_telemetry_audit_summary(
    action: str | None = Query(None),
    institution_id: str | None = Query(None),
    company_id: str | None = Query(None),
    from_date: str | None = Query(None),
    to_date: str | None = Query(None),
    bucket: str = Query("hour", pattern="^(hour|day)$"),
    db: Session = Depends(database.get_db),
):
    """Audit action/entity summary + trend buckets for telemetry dashboards."""
    filters = AuditQueryFilters(
        action=action,
        institution_id=institution_id,
        company_id=company_id,
        from_date=from_date,
        to_date=to_date,
    )
    return get_audit_summary_data(db, filters, bucket=bucket)


@router.get("/audit/{entity_type}/{entity_id}")
def get_telemetry_entity_audit_timeline(
    entity_type: str,
    entity_id: str,
    user_id: str | None = Query(None),
    action: str | None = Query(None),
    institution_id: str | None = Query(None),
    company_id: str | None = Query(None),
    from_date: str | None = Query(None),
    to_date: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(database.get_db),
):
    """Entity-specific audit timeline exposed under telemetry."""
    filters = AuditQueryFilters(
        user_id=user_id,
        action=action,
        institution_id=institution_id,
        company_id=company_id,
        from_date=from_date,
        to_date=to_date,
    )
    return get_entity_audit_timeline(
        db,
        entity_type=entity_type,
        entity_id=entity_id,
        filters=filters,
        limit=limit,
        offset=offset,
    )


@router.get("/funnels")
def get_funnels(last: str | None = Query("24h", description="last=1h|24h|7d")):
    """Funnel conversion metrics computed from actual telemetry events."""
    now = time.time()
    if last not in SECONDS:
        return {"error": f"Invalid last. Use one of: {list(SECONDS.keys())}"}
    ft = now - SECONDS[last]
    funnels = _store_compute_funnels(ft, now)
    return {"funnels": funnels, "last": last}


@router.get("/sessions")
def get_sessions(last: str | None = Query("24h", description="last=1h|24h|7d")):
    """Session list with unified timelines aggregated from server + client events."""
    now = time.time()
    if last not in SECONDS:
        return {"error": f"Invalid last. Use one of: {list(SECONDS.keys())}"}
    ft = now - SECONDS[last]
    sessions = _store_get_sessions(ft, now)
    browser_dist: dict[str, int] = {}
    os_dist: dict[str, int] = {}
    device_dist: dict[str, int] = {}
    for s in sessions:
        browser_dist[s["browser"]] = browser_dist.get(s["browser"], 0) + 1
        os_dist[s["os"]] = os_dist.get(s["os"], 0) + 1
        device_dist[s["device"]] = device_dist.get(s["device"], 0) + 1

    avg_dur = round(sum(s["duration_seconds"] for s in sessions) / len(sessions)) if sessions else 0
    avg_pages = round(sum(s["pages_visited"] for s in sessions) / len(sessions), 1) if sessions else 0

    return {
        "sessions": sessions,
        "total_sessions": len(sessions),
        "avg_duration_seconds": avg_dur,
        "avg_pages_per_session": avg_pages,
        "browser_distribution": browser_dist,
        "os_distribution": os_dist,
        "device_distribution": device_dist,
        "last": last,
    }


@router.get("/alerts")
def get_alerts(last: str | None = Query("1h", description="last=1h|24h|7d")):
    """Anomaly detection alerts derived from telemetry data."""
    now = time.time()
    if last not in SECONDS:
        return {"error": f"Invalid last. Use one of: {list(SECONDS.keys())}"}
    ft = now - SECONDS[last]
    alerts = _store_detect_alerts(ft, now)
    critical = sum(1 for a in alerts if a.get("severity") == "critical")
    warning = sum(1 for a in alerts if a.get("severity") == "warning")
    return {
        "alerts": alerts,
        "total": len(alerts),
        "critical_count": critical,
        "warning_count": warning,
        "last": last,
    }
