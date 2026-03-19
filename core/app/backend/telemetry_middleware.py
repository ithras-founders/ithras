"""API telemetry middleware - captures request/response metrics."""
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

SKIP_PATHS = {"/", "/health", "/api/v1/setup/status"}


class TelemetryMiddleware(BaseHTTPMiddleware):
    """Middleware that logs API requests to api_request_log."""

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path or ""
        if path in SKIP_PATHS:
            return await call_next(request)

        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        trace_id = request.headers.get("x-trace-id") or str(uuid.uuid4())

        try:
            from shared.telemetry.context import set_telemetry_context
            set_telemetry_context(request_id=request_id, trace_id=trace_id)
        except ImportError:
            pass

        start = time.perf_counter()
        response = await call_next(request)
        latency_ms = int((time.perf_counter() - start) * 1000)

        method = request.method or "GET"
        status_code = response.status_code

        user_id = None
        try:
            uid = getattr(request.state, "user_id", None)
            if uid is not None:
                user_id = int(uid)
            else:
                user = getattr(request.state, "user", None)
                if user:
                    user_id = int(getattr(user, "user_numerical", None) or getattr(user, "id", 0) or 0)
        except Exception:
            pass

        try:
            from shared.database.database import SessionLocal
            from shared.telemetry.emitters.api_emitter import track_api_request
            db = SessionLocal()
            try:
                track_api_request(db, method, path, status_code, latency_ms, user_id, request_id)
            finally:
                db.close()
        except Exception:
            pass

        response.headers["x-request-id"] = request_id
        return response
