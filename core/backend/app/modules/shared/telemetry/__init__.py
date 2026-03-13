"""
Telemetry package - Redis-backed storage, sessions, funnels, alerts.
Re-exports public API so existing imports from telemetry_store continue to work.
"""
from .store import (
    record_request,
    record_client_events,
    get_entries_since,
    get_client_events_range,
    get_error_signatures,
)
from .sessions import get_sessions
from .funnels import FUNNELS, compute_funnels
from .alerts import detect_alerts

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
