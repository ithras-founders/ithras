"""
Optional Redis cache layer - graceful fallback when Redis unavailable.
Use cache_response(key, value, ttl) and get_cached(key).
"""
import json
import logging

from app.config import settings

_redis_client = None
_redis_available = False

try:
    import redis as redis_lib
    redis_url = settings.REDIS_URL
    if redis_url:
        _redis_client = redis_lib.from_url(redis_url, decode_responses=True)
        _redis_client.ping()
        _redis_available = True
        logging.getLogger(__name__).info("Redis cache enabled")
    else:
        logging.getLogger(__name__).debug("REDIS_URL not set, cache disabled")
except Exception as e:
    logging.getLogger(__name__).debug("Redis unavailable, cache disabled: %s", e)
    _redis_client = None
    _redis_available = False


def is_available() -> bool:
    return _redis_available and _redis_client is not None


def cache_response(key: str, value, ttl: int = 60) -> bool:
    """Cache a value (JSON-serializable) with TTL in seconds. Returns True if cached."""
    if not is_available():
        return False
    try:
        data = json.dumps(value) if not isinstance(value, str) else value
        _redis_client.setex(key, ttl, data)
        return True
    except Exception:
        return False


def get_cached(key: str):
    """Get cached value. Returns None if miss or error."""
    if not is_available():
        return None
    try:
        data = _redis_client.get(key)
        if data is None:
            return None
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            return data
    except Exception:
        return None


def invalidate(key: str) -> bool:
    """Delete a cache key. Returns True if deleted."""
    if not is_available():
        return False
    try:
        _redis_client.delete(key)
        return True
    except Exception:
        return False


def invalidate_pattern(pattern: str) -> int:
    """Delete keys matching pattern (e.g. 'institutions:*'). Returns count deleted."""
    if not is_available():
        return 0
    try:
        keys = list(_redis_client.scan_iter(match=pattern))
        if keys:
            return _redis_client.delete(*keys) or 0
        return 0
    except Exception:
        return 0


def get_redis_client():
    """Return Redis client if available, else None. For telemetry/store use."""
    return _redis_client if is_available() else None
