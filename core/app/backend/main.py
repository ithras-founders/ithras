"""Ithras Placement API - config-driven product router loading"""
import sys
import os
import logging
import json

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.staticfiles import StaticFiles

# ─── Path setup (before any shared imports) ────────────────────────────────────
_current = os.path.dirname(os.path.abspath(__file__))
if _current not in sys.path:
    sys.path.insert(0, _current)
_base = '/' if os.path.exists('/products') else os.path.abspath(os.path.join(_current, '..', '..', '..'))
_core = '/core' if os.path.exists('/core') else os.path.abspath(os.path.join(_base, 'core'))
_ws = os.path.dirname(_core) if os.path.isdir(_core) else _base
if _ws not in sys.path:
    sys.path.insert(0, _ws)
if os.path.exists('/shared') and '/' not in sys.path:
    sys.path.insert(0, '/')

# ─── Observability ────────────────────────────────────────────────────────────
from shared.database.config import settings as _app_settings
_log_format = _app_settings.LOG_FORMAT
if _log_format == "json":
    class _JsonFormatter(logging.Formatter):
        def format(self, record):
            log_obj = {
                "timestamp": self.formatTime(record),
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
            }
            if record.exc_info:
                log_obj["exception"] = self.formatException(record.exc_info)
            if hasattr(record, "request_id"):
                log_obj["request_id"] = record.request_id
            if hasattr(record, "path"):
                log_obj["path"] = record.path
            return json.dumps(log_obj)
    _handler = logging.StreamHandler()
    _handler.setFormatter(_JsonFormatter())
    for _name in ("ithras", "ithras.exceptions"):
        _log = logging.getLogger(_name)
        _log.handlers = []
        _log.addHandler(_handler)
        _log.setLevel(logging.INFO)

# ─── Exception Handlers ──────────────────────────────────────────────────────
def _error_response(status_code: int, detail: str | dict, request_id: str | None = None) -> JSONResponse:
    body = {"detail": detail, "error": True}
    if request_id:
        body["request_id"] = request_id
    return JSONResponse(status_code=status_code, content=body)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return _error_response(422, {"message": "Validation error", "errors": exc.errors()}, request.headers.get("x-request-id"))


async def http_exception_handler(request: Request, exc) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, (str, dict)) else str(exc.detail)
    return _error_response(exc.status_code, detail, request.headers.get("x-request-id"))


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger = logging.getLogger("ithras.exceptions")
    logger.error("%s - %s", exc.__class__.__name__, str(exc), exc_info=True)
    try:
        import traceback
        from shared.database.database import SessionLocal
        from shared.telemetry.emitters.error_emitter import track_error
        db = SessionLocal()
        try:
            track_error(
                db,
                message=str(exc)[:4096],
                stack_trace=traceback.format_exc(),
                path=request.url.path,
                request_id=request.headers.get("x-request-id"),
            )
        finally:
            db.close()
    except Exception:
        pass
    return _error_response(500, {"message": "An unexpected error occurred. Please try again later."}, request.headers.get("x-request-id"))


class _HealthFilter(logging.Filter):
    def filter(self, record):
        return '"GET /health' not in record.getMessage()


logging.getLogger("uvicorn.access").addFilter(_HealthFilter())

# ─── Router imports ─────────────────────────────────────────────────────────
admin_backend = '/admin/backend' if os.path.exists('/admin') else os.path.join(_ws, 'admin', 'backend')
profiles_general_backend = '/products/profiles/general/backend' if os.path.exists('/products') else os.path.join(_ws, 'products', 'profiles', 'general', 'backend')
profiles_professional_backend = '/products/profiles/professional/backend' if os.path.exists('/products') else os.path.join(_ws, 'products', 'profiles', 'professional', 'backend')
feed_backend = '/products/feed/backend' if os.path.exists('/products') else os.path.join(_ws, 'products', 'feed', 'backend')
network_backend = '/products/network/backend' if os.path.exists('/products') else os.path.join(_ws, 'products', 'network', 'backend')
messaging_backend = '/products/messaging/backend' if os.path.exists('/products') else os.path.join(_ws, 'products', 'messaging', 'backend')
search_backend = '/products/search/backend' if os.path.exists('/products') else os.path.join(_ws, 'products', 'search', 'backend')
longform_backend = '/products/longform/backend' if os.path.exists('/products') else os.path.join(_ws, 'products', 'longform', 'backend')
setup_backend = '/core/setup/backend' if os.path.exists('/core') else os.path.join(_ws, 'core', 'setup', 'backend')
for _path in (
    os.path.join(_core, 'auth', 'backend'),
    setup_backend,
    admin_backend,
    profiles_general_backend,
    profiles_professional_backend,
    feed_backend,
    network_backend,
    messaging_backend,
    search_backend,
    longform_backend,
):
    _abs = os.path.abspath(_path) if not _path.startswith('/') else _path
    if os.path.exists(_abs) and _abs not in sys.path:
        sys.path.insert(0, _abs)

from auth.routers import router as auth_router
from routers import router as setup_router
try:
    from admin.routers import router as admin_router
except ImportError as e:
    admin_router = None
    logging.getLogger("ithras").warning("Admin router not loaded: %s", e)
try:
    from profile.routers import router as profile_router
except ImportError:
    profile_router = None
try:
    from professional.routers import router as professional_router
except ImportError:
    professional_router = None
try:
    from professional.public_routers import router as public_router
except ImportError:
    public_router = None
try:
    from feed.routers import router as feed_router
except ImportError as e:
    feed_router = None
    logging.getLogger("ithras").warning("Feed router not loaded: %s", e)
try:
    from network.routers import router as network_router
except ImportError as e:
    network_router = None
    logging.getLogger("ithras").warning("Network router not loaded: %s", e)
try:
    from messaging.routers import router as messaging_router
except ImportError as e:
    messaging_router = None
    logging.getLogger("ithras").warning("Messaging router not loaded: %s", e)
try:
    from search.routers import router as search_router
except ImportError as e:
    search_router = None
    logging.getLogger("ithras").warning("Search router not loaded: %s", e)
try:
    from longform.routers import router as longform_router
except ImportError:
    longform_router = None
    logging.getLogger("ithras").exception(
        "LongForm router not loaded — all /api/v1/longform/* routes will 404. "
        "Typical causes: products/longform/backend not on PYTHONPATH, or a failed import inside longform (e.g. missing nh3)."
    )

# ─── App ────────────────────────────────────────────────────────────────────
app = FastAPI(title="Ithras Placement API", version="1.0.0")

app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

try:
    from telemetry_middleware import TelemetryMiddleware
    app.add_middleware(TelemetryMiddleware)
except ImportError:
    pass

app.include_router(setup_router)
app.include_router(auth_router)
if admin_router:
    app.include_router(admin_router)
if profile_router:
    app.include_router(profile_router)
if professional_router:
    app.include_router(professional_router)
if public_router:
    app.include_router(public_router)
if feed_router:
    app.include_router(feed_router)
if network_router:
    app.include_router(network_router)
if messaging_router:
    app.include_router(messaging_router)
if search_router:
    app.include_router(search_router)
if longform_router:
    app.include_router(longform_router)

try:
    from longform.media_paths import get_longform_media_root

    _longform_media_dir = get_longform_media_root()
    _longform_media_dir.mkdir(parents=True, exist_ok=True)
    app.mount(
        "/media/longform",
        StaticFiles(directory=str(_longform_media_dir)),
        name="longform_media",
    )
except Exception as _lf_mount_exc:
    logging.getLogger("ithras").warning("LongForm /media/longform mount skipped: %s", _lf_mount_exc)

try:
    from profile.media_paths import get_profile_photo_media_root

    _profile_photo_dir = get_profile_photo_media_root()
    _profile_photo_dir.mkdir(parents=True, exist_ok=True)
    app.mount(
        "/media/profile",
        StaticFiles(directory=str(_profile_photo_dir)),
        name="profile_photos",
    )
except Exception as _pp_mount_exc:
    logging.getLogger("ithras").warning("Profile /media/profile mount skipped: %s", _pp_mount_exc)


@app.on_event("startup")
def _startup_seed():
    """Seed admin account if not exists. Non-fatal on failure."""
    try:
        from seed_admin import seed_admin
        seed_admin()
    except Exception as e:
        logging.getLogger("ithras").warning("Admin seed skipped or failed: %s", e)


@app.get("/")
def root():
    return {"message": "Ithras Placement API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
