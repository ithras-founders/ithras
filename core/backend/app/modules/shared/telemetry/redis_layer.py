"""
Redis-backed telemetry storage layer - zadd/zrange helpers for requests and client events.
"""
import json
import logging
import time
import uuid

from app.modules.shared.cache import get_redis_client

REQUESTS_KEY = "telemetry:requests"
CLIENT_EVENTS_KEY = "telemetry:client_events"
MAX_AGE_SECONDS = 86400 * 7  # 7 days


def _redis_record_request(entry: dict) -> None:
    """Append request entry to Redis sorted set."""
    client = get_redis_client()
    if not client:
        return
    try:
        ts = entry.get("timestamp", time.time())
        member = json.dumps(entry) + "::" + uuid.uuid4().hex
        client.zadd(REQUESTS_KEY, {member: ts})
        cutoff = time.time() - MAX_AGE_SECONDS
        client.zremrangebyscore(REQUESTS_KEY, "-inf", cutoff)
        # Cap size
        n = client.zcard(REQUESTS_KEY)
        if n > 100_000:
            client.zremrangebyrank(REQUESTS_KEY, 0, n - 100_001)
    except Exception as e:
        logging.getLogger(__name__).warning("Redis telemetry record failed: %s", e)


def _redis_record_client_event(entry: dict) -> None:
    """Append client event to Redis sorted set."""
    client = get_redis_client()
    if not client:
        return
    try:
        ts = entry.get("timestamp", time.time())
        member = json.dumps(entry) + "::" + uuid.uuid4().hex
        client.zadd(CLIENT_EVENTS_KEY, {member: ts})
        cutoff = time.time() - MAX_AGE_SECONDS
        client.zremrangebyscore(CLIENT_EVENTS_KEY, "-inf", cutoff)
        n = client.zcard(CLIENT_EVENTS_KEY)
        if n > 50_000:
            client.zremrangebyrank(CLIENT_EVENTS_KEY, 0, n - 50_001)
    except Exception as e:
        logging.getLogger(__name__).warning("Redis client event record failed: %s", e)


def _redis_get_entries_since(cutoff_ts: float, to_ts: float | None = None) -> list:
    """Get request entries from Redis in time range."""
    client = get_redis_client()
    if not client:
        return []
    try:
        to_ts = to_ts or time.time()
        raw = client.zrangebyscore(REQUESTS_KEY, cutoff_ts, to_ts)
        result = []
        for s in raw:
            try:
                parts = s.rsplit("::", 1)
                data = json.loads(parts[0]) if len(parts) == 2 else json.loads(s)
                result.append(data)
            except (json.JSONDecodeError, ValueError):
                continue
        return result
    except Exception as e:
        logging.getLogger(__name__).warning("Redis telemetry read failed: %s", e)
        return []


def _redis_get_client_events(from_ts: float, to_ts: float | None = None) -> list:
    """Get client events from Redis in time range."""
    client = get_redis_client()
    if not client:
        return []
    try:
        to_ts = to_ts or time.time()
        raw = client.zrangebyscore(CLIENT_EVENTS_KEY, from_ts, to_ts)
        result = []
        for s in raw:
            try:
                parts = s.rsplit("::", 1)
                data = json.loads(parts[0]) if len(parts) == 2 else json.loads(s)
                result.append(data)
            except (json.JSONDecodeError, ValueError):
                continue
        return result
    except Exception as e:
        logging.getLogger(__name__).warning("Redis client events read failed: %s", e)
        return []
