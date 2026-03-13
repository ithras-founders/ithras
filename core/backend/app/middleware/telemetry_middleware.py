"""Request instrumentation middleware - records path, method, status, duration."""
import re
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.modules.shared.telemetry_store import (
    record_request as _store_record_request,
    record_client_events as _store_record_client_events,
    get_entries_since as _store_get_entries_since,
    get_client_events_range as _store_get_client_events_range,
    get_error_signatures as _store_get_error_signatures,
)


def _normalize_path(path: str) -> str:
    """Strip UUIDs and numeric IDs for grouping: /api/v1/users/abc123 -> /api/v1/users/:id"""
    path = re.sub(
        r"/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b",
        "/:id",
        path,
    )
    path = re.sub(r"/\d+", "/:id", path)
    return path or "/"


def _status_bucket(status: int) -> str:
    if 200 <= status < 300:
        return "2xx"
    if 400 <= status < 500:
        return "4xx"
    if status >= 500:
        return "5xx"
    return "other"


def _truncate(text: str | None, limit: int = 240) -> str | None:
    if not text:
        return None
    return text if len(text) <= limit else text[:limit]


def _extract_client_ip(request: Request) -> str:
    """Resolve real client IP from proxy headers, falling back to socket address."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    if request.client:
        return request.client.host
    return "unknown"


def _extract_scope_ids(request: Request) -> dict:
    qp = request.query_params
    return {
        "session_id": request.headers.get("x-session-id") or qp.get("session_id"),
        "user_id": request.headers.get("x-user-id") or request.headers.get("x-actor-id") or qp.get("user_id"),
        "institution_id": request.headers.get("x-institution-id") or qp.get("institution_id"),
        "company_id": request.headers.get("x-company-id") or qp.get("company_id"),
        "client_ip": _extract_client_ip(request),
        "user_agent": request.headers.get("user-agent", ""),
    }


def _record(
    path: str,
    method: str,
    status_code: int,
    duration_ms: float,
    timestamp: float,
    request_id: str,
    route_name: str,
    session_id: str | None = None,
    user_id: str | None = None,
    institution_id: str | None = None,
    company_id: str | None = None,
    client_ip: str | None = None,
    user_agent: str | None = None,
    error_class: str | None = None,
    error_message_truncated: str | None = None,
):
    bucket = _status_bucket(status_code)
    entry = {
        "request_id": request_id,
        "route_name": route_name,
        "session_id": session_id,
        "path": path,
        "method": method,
        "status_code": status_code,
        "status_bucket": bucket,
        "duration_ms": duration_ms,
        "timestamp": timestamp,
        "user_id": user_id,
        "institution_id": institution_id,
        "company_id": company_id,
        "client_ip": client_ip,
        "user_agent": user_agent,
        "error_class": error_class,
        "error_message_truncated": error_message_truncated,
        "error_signature": f"{route_name}|{error_class}" if error_class else None,
    }
    _store_record_request(entry)


def get_request_log(maxlen: int = 10_000) -> list:
    entries = _store_get_entries_since(0)
    return entries[-maxlen:]


def record_client_events(events: list[dict]) -> None:
    _store_record_client_events(events)


def get_entries_since(cutoff_ts: float, to_ts: float | None = None) -> list:
    return _store_get_entries_since(cutoff_ts, to_ts)


def get_client_events(from_ts: float, to_ts: float | None = None) -> list:
    return _store_get_client_events_range(from_ts, to_ts)


def get_error_signatures(from_ts: float, to_ts: float | None = None) -> list[dict]:
    return _store_get_error_signatures(from_ts, to_ts)


def get_client_page_metrics(from_ts: float, to_ts: float | None = None) -> list[dict]:
    """Aggregate page_view events by (product, view)."""
    to_ts = to_ts or time.time()
    all_entries = _store_get_client_events_range(from_ts, to_ts)
    entries = [e for e in all_entries if e.get("type") == "page_view"]
    by_key: dict[tuple[str, str], list] = {}
    for e in entries:
        key = (e.get("product", ""), e.get("view", ""))
        by_key.setdefault(key, []).append(e.get("duration_ms", 0))
    return [
        {
            "product": k[0],
            "view": k[1],
            "count": len(v),
            "avg_duration_ms": round(sum(v) / len(v), 2) if v else 0,
        }
        for k, v in by_key.items()
    ]


def get_client_api_metrics(from_ts: float, to_ts: float | None = None) -> list[dict]:
    """Aggregate client-side API timing events by (path, method)."""
    to_ts = to_ts or time.time()
    all_entries = _store_get_client_events_range(from_ts, to_ts)
    entries = [e for e in all_entries if e.get("type") == "api"]
    by_key: dict[tuple[str, str], list[dict]] = {}
    for e in entries:
        key = (e.get("path", ""), e.get("method", "GET"))
        by_key.setdefault(key, []).append(e)
    result = []
    for (path, method), evts in by_key.items():
        durations = sorted(e.get("duration_ms", 0) for e in evts)
        n = len(durations)
        statuses = [e.get("status", 0) for e in evts]
        errors = sum(1 for s in statuses if s >= 400)
        result.append({
            "path": path,
            "method": method,
            "count": n,
            "errors": errors,
            "avg_ms": round(sum(durations) / n, 2) if n else 0,
            "p50_ms": round(durations[int(n * 0.5)], 2) if n else 0,
            "p95_ms": round(durations[int(n * 0.95)], 2) if n else 0,
        })
    return sorted(result, key=lambda x: -x["count"])


def get_active_users(from_ts: float, to_ts: float | None = None) -> dict:
    """Count distinct user_ids and return activity details from client events."""
    to_ts = to_ts or time.time()
    all_entries = _store_get_client_events_range(from_ts, to_ts)
    user_data: dict[str, dict] = {}
    for e in all_entries:
        uid = e.get("user_id")
        if not uid:
            continue
        if uid not in user_data:
            user_data[uid] = {"user_id": uid, "events": 0, "pages": set(), "last_seen": 0}
        user_data[uid]["events"] += 1
        user_data[uid]["last_seen"] = max(user_data[uid]["last_seen"], e.get("timestamp", 0))
        if e.get("type") == "page_view" and e.get("view"):
            user_data[uid]["pages"].add(e["view"])
    users_list = []
    for ud in user_data.values():
        users_list.append({
            "user_id": ud["user_id"],
            "events": ud["events"],
            "pages_visited": len(ud["pages"]),
            "pages": list(ud["pages"]),
            "last_seen": ud["last_seen"],
        })
    users_list.sort(key=lambda x: -x["events"])
    return {"active_count": len(users_list), "users": users_list}


def get_timeseries(from_ts: float, to_ts: float | None = None, bucket_seconds: int = 60) -> list[dict]:
    """Bucket server requests into time intervals for time-series charts."""
    to_ts = to_ts or time.time()
    entries = get_entries_since(from_ts, to_ts)
    if not entries:
        return []
    buckets: dict[int, dict] = {}
    for e in entries:
        bucket_ts = int(e["timestamp"] // bucket_seconds) * bucket_seconds
        if bucket_ts not in buckets:
            buckets[bucket_ts] = {"ts": bucket_ts, "count": 0, "total_ms": 0.0, "errors": 0}
        buckets[bucket_ts]["count"] += 1
        buckets[bucket_ts]["total_ms"] += e.get("duration_ms", 0)
        if e.get("status_bucket") in ("4xx", "5xx"):
            buckets[bucket_ts]["errors"] += 1
    result = []
    for b in sorted(buckets.values(), key=lambda x: x["ts"]):
        result.append({
            "ts": b["ts"],
            "count": b["count"],
            "avg_ms": round(b["total_ms"] / b["count"], 2) if b["count"] else 0,
            "errors": b["errors"],
        })
    return result


def get_aggregated_metrics(from_ts: float, to_ts: float | None = None) -> list:
    to_ts = to_ts or time.time()
    entries = get_entries_since(from_ts, to_ts)

    by_key: dict[str, dict] = {}
    for e in entries:
        key = (e["path"], e["method"], e["status_bucket"])
        if key not in by_key:
            by_key[key] = {
                "path": e["path"],
                "method": e["method"],
                "status_bucket": e["status_bucket"],
                "count": 0,
                "durations": [],
            }
        by_key[key]["count"] += 1
        by_key[key]["durations"].append(e["duration_ms"])

    result = []
    for k, v in by_key.items():
        durs = sorted(v["durations"])
        n = len(durs)
        p50 = durs[int(n * 0.5)] if n else 0
        p95 = durs[int(n * 0.95)] if n else 0
        p99 = durs[int(n * 0.99)] if n else 0
        result.append({
            "path": v["path"],
            "method": v["method"],
            "status_bucket": v["status_bucket"],
            "count": v["count"],
            "p50_ms": round(p50, 2),
            "p95_ms": round(p95, 2),
            "p99_ms": round(p99, 2),
            "avg_ms": round(sum(durs) / n, 2) if n else 0,
        })
    return result


class TelemetryMiddleware(BaseHTTPMiddleware):
    """Records request timing and status for telemetry."""

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        path = request.url.path
        method = request.method
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        route_obj = request.scope.get("route")
        route_name = getattr(route_obj, "name", None) or getattr(route_obj, "path", None) or _normalize_path(path)
        scope_ids = _extract_scope_ids(request)
        status = 500
        error_class = None
        error_message = None

        try:
            response = await call_next(request)
            status = response.status_code
            if status >= 500:
                error_class = "HTTP_ERROR"
                error_message = f"HTTP {status}"
            response.headers["x-request-id"] = request_id
            return response
        except Exception as exc:
            error_class = exc.__class__.__name__
            error_message = _truncate(str(exc))
            raise
        finally:
            duration_ms = (time.perf_counter() - start) * 1000
            norm_path = _normalize_path(path)
            ts = time.time()
            if not path.startswith("/api/v1/telemetry"):
                _record(
                    norm_path,
                    method,
                    status,
                    duration_ms,
                    ts,
                    request_id=request_id,
                    route_name=route_name,
                    session_id=scope_ids["session_id"],
                    user_id=scope_ids["user_id"],
                    institution_id=scope_ids["institution_id"],
                    company_id=scope_ids["company_id"],
                    client_ip=scope_ids["client_ip"],
                    user_agent=scope_ids["user_agent"],
                    error_class=error_class,
                    error_message_truncated=_truncate(error_message),
                )
