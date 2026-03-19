"""Correlation and context propagation for telemetry."""
import contextvars
import uuid
from typing import Any

_request_id: contextvars.ContextVar[str | None] = contextvars.ContextVar("telemetry_request_id", default=None)
_trace_id: contextvars.ContextVar[str | None] = contextvars.ContextVar("telemetry_trace_id", default=None)
_session_id: contextvars.ContextVar[str | None] = contextvars.ContextVar("telemetry_session_id", default=None)
_correlation_id: contextvars.ContextVar[str | None] = contextvars.ContextVar("telemetry_correlation_id", default=None)


def set_telemetry_context(
    request_id: str | None = None,
    trace_id: str | None = None,
    session_id: str | None = None,
    correlation_id: str | None = None,
) -> None:
    """Set telemetry context for the current async context."""
    if request_id is not None:
        _request_id.set(request_id)
    if trace_id is not None:
        _trace_id.set(trace_id)
    if session_id is not None:
        _session_id.set(session_id)
    if correlation_id is not None:
        _correlation_id.set(correlation_id)


def get_telemetry_context() -> dict[str, str | None]:
    """Get current telemetry context."""
    return {
        "request_id": _request_id.get(None),
        "trace_id": _trace_id.get(None),
        "session_id": _session_id.get(None),
        "correlation_id": _correlation_id.get(None),
    }


def ensure_request_id(request_id: str | None) -> str:
    """Return request_id if provided, otherwise generate a new UUID."""
    if request_id:
        return request_id
    try:
        return _request_id.get(None) or str(uuid.uuid4())
    except LookupError:
        return str(uuid.uuid4())


def ensure_trace_id(trace_id: str | None) -> str:
    """Return trace_id if provided, otherwise generate a new UUID."""
    if trace_id:
        return trace_id
    try:
        return _trace_id.get(None) or str(uuid.uuid4())
    except LookupError:
        return str(uuid.uuid4())
