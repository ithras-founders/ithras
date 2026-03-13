"""
Telemetry storage - Redis-backed when available, in-memory fallback.
Shared across all workers when Redis is used.

Thin facade: re-exports from app.modules.shared.telemetry for backwards compatibility.
"""
from app.modules.shared.telemetry import (
    record_request,
    record_client_events,
    get_entries_since,
    get_client_events_range,
    get_error_signatures,
    get_sessions,
    FUNNELS,
    compute_funnels,
    detect_alerts,
)

__all__ = [
    "record_request",
    "record_client_events",
    "get_entries_since",
    "get_client_events_range",
    "get_error_signatures",
    "get_sessions",
    "FUNNELS",
    "compute_funnels",
    "detect_alerts",
]
