"""
Telemetry storage - Redis-backed when available, in-memory fallback.
Coordinates record/get operations and delegates to redis_layer when Redis is available.
"""
import logging
import threading
import time
from collections import deque

from app.modules.shared.cache import get_redis_client

from .redis_layer import (
    _redis_record_request,
    _redis_record_client_event,
    _redis_get_entries_since,
    _redis_get_client_events,
)

# In-memory fallback
_store_lock = threading.Lock()
_request_log: deque = deque(maxlen=50_000)
_client_lock = threading.Lock()
_client_events: deque = deque(maxlen=50_000)

_store_fallback_warned = False


def record_request(entry: dict) -> None:
    """Record a request telemetry entry. Uses Redis if available, else in-memory."""
    global _store_fallback_warned
    client = get_redis_client()
    if client:
        _redis_record_request(entry)
    else:
        if not _store_fallback_warned:
            _store_fallback_warned = True
            logging.getLogger(__name__).warning(
                "Telemetry using in-memory storage (Redis unavailable). "
                "Metrics may be incomplete with multiple workers."
            )
        with _store_lock:
            _request_log.append(entry)


def record_client_events(events: list[dict]) -> None:
    """Store client-side telemetry events. Uses Redis if available, else in-memory."""
    ts = time.time()
    client = get_redis_client()
    if client:
        for e in events:
            ev = {**e, "timestamp": e.get("timestamp", ts)}
            _redis_record_client_event(ev)
    else:
        with _client_lock:
            for e in events:
                _client_events.append({**e, "timestamp": e.get("timestamp", ts)})


def get_entries_since(cutoff_ts: float, to_ts: float | None = None) -> list:
    """Return request entries newer than cutoff. Uses Redis if available."""
    client = get_redis_client()
    if client:
        return _redis_get_entries_since(cutoff_ts, to_ts)
    with _store_lock:
        entries = [e for e in _request_log if e["timestamp"] >= cutoff_ts]
    if to_ts is not None:
        entries = [e for e in entries if e["timestamp"] <= to_ts]
    return entries


def get_client_events_range(from_ts: float, to_ts: float | None = None) -> list:
    """Return client events in time range. Uses Redis if available."""
    to_ts = to_ts or time.time()
    client = get_redis_client()
    if client:
        return _redis_get_client_events(from_ts, to_ts)
    with _client_lock:
        return [
            e
            for e in _client_events
            if from_ts <= e.get("timestamp", 0) <= to_ts
        ]


def get_error_signatures(from_ts: float, to_ts: float | None = None) -> list[dict]:
    """Group request errors by route + error class for anomaly detection."""
    to_ts = to_ts or time.time()
    entries = get_entries_since(from_ts, to_ts)
    grouped: dict[tuple[str, str], dict] = {}
    for e in entries:
        error_class = e.get("error_class")
        status_code = int(e.get("status_code") or 0)
        if not error_class and status_code < 500:
            continue
        route_name = e.get("route_name") or e.get("path") or "unknown"
        err_cls = error_class or "HTTP_ERROR"
        key = (route_name, err_cls)
        item = grouped.setdefault(
            key,
            {
                "route_name": route_name,
                "error_class": err_cls,
                "count": 0,
                "last_seen": 0,
                "sample_message": None,
            },
        )
        item["count"] += 1
        item["last_seen"] = max(item["last_seen"], e.get("timestamp", 0))
        if not item["sample_message"] and e.get("error_message_truncated"):
            item["sample_message"] = e.get("error_message_truncated")
    return sorted(grouped.values(), key=lambda x: x["count"], reverse=True)
