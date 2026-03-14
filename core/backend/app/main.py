"""Ithras Placement API - config-driven product router loading"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import sys
import os
import types
import importlib
import importlib.util
import yaml
import logging
import json
import uuid as _uuid

# ─── Observability: Structured Logging ────────────────────────────────────────
# Set LOG_FORMAT=json for production to emit JSON logs (parseable by Cloud Logging, etc.)
from app.config import settings as _app_settings
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

# ─── Global Exception Handlers ───────────────────────────────────────────────

def _error_response(status_code: int, detail: str | dict, request_id: str | None = None) -> JSONResponse:
    """Return consistent error response without leaking internal details."""
    body = {"detail": detail, "error": True}
    if request_id:
        body["request_id"] = request_id
    return JSONResponse(status_code=status_code, content=body)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic validation errors (422) with clean message format."""
    request_id = request.headers.get("x-request-id")
    errors = exc.errors()
    detail = {"message": "Validation error", "errors": errors}
    return _error_response(422, detail, request_id)


async def http_exception_handler(request: Request, exc) -> JSONResponse:
    """Handle HTTPException with consistent format."""
    request_id = request.headers.get("x-request-id")
    detail = exc.detail if isinstance(exc.detail, (str, dict)) else str(exc.detail)
    return _error_response(exc.status_code, detail, request_id)


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all: prevent stack trace leakage, log internally, return generic 500."""
    request_id = request.headers.get("x-request-id")
    logger = logging.getLogger("ithras.exceptions")
    logger.error(
        "Unhandled exception: %s - %s",
        exc.__class__.__name__,
        str(exc),
        exc_info=True,
        extra={"request_id": request_id, "path": request.url.path},
    )
    return _error_response(
        500,
        {"message": "An unexpected error occurred. Please try again later."},
        request_id,
    )


class _HealthFilter(logging.Filter):
    def filter(self, record):
        msg = record.getMessage()
        return '"GET /health' not in msg


logging.getLogger("uvicorn.access").addFilter(_HealthFilter())

# Ensure parent dir in path for absolute imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Base directory
base_dir = '/' if os.path.exists('/products') else os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))

# Core routers
from app.modules.shared.routers import cycles, notifications, telemetry, setup, auth, audit, batches, organizations, opportunities, eligibility, messaging, entity_about_admin, benchmark_analytics
from app.middleware.telemetry_middleware import TelemetryMiddleware


def import_product_modules(product_name, module_path, import_names):
    """Import router modules from a product backend."""
    if product_name not in product_paths:
        raise ImportError(f"{product_name} backend path not found")
    product_path = product_paths[product_name]
    module_parts = module_path.split('.')
    if module_parts[0] != 'app':
        raise ImportError(f"Expected module path to start with 'app', got {module_path}")
    routers_dir = os.path.join(product_path, 'app', *module_parts[1:])
    if not os.path.exists(routers_dir):
        raise ImportError(f"Routers directory not found: {routers_dir}")
    if product_path not in sys.path:
        sys.path.insert(0, product_path)
    elif sys.path.index(product_path) > 0:
        sys.path.remove(product_path)
        sys.path.insert(0, product_path)

    imports = {}
    for name in import_names:
        router_file = os.path.join(routers_dir, f"{name}.py")
        if not os.path.exists(router_file):
            raise ImportError(f"Router file not found: {router_file}")
        actual_module_name = f"{module_path}.{name}"
        parent_parts = actual_module_name.split('.')
        for i in range(1, len(parent_parts)):
            parent_name = '.'.join(parent_parts[:i])
            if parent_name not in sys.modules:
                parent_dir_path = os.path.join(product_path, 'app', *parent_parts[1:i]) if i > 1 else os.path.join(product_path, 'app')
                parent_init_file = os.path.join(parent_dir_path, '__init__.py')
                parent_module = types.ModuleType(parent_name)
                parent_module.__name__ = parent_name
                parent_module.__package__ = '.'.join(parent_parts[:i-1]) if i > 1 else None
                parent_module.__path__ = [parent_dir_path] if os.path.exists(parent_dir_path) else []
                sys.modules[parent_name] = parent_module
        spec = importlib.util.spec_from_file_location(actual_module_name, router_file)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not create spec for {router_file}")
        router_module = importlib.util.module_from_spec(spec)
        router_module.__name__ = actual_module_name
        router_module.__package__ = module_path
        router_module.__file__ = router_file
        sys.modules[actual_module_name] = router_module
        spec.loader.exec_module(router_module)
        imports[name] = router_module
    return imports


# Build product paths
product_backends = [
    'products/calendar-management/backend',
    'products/feed/global/backend',
    'products/feed/channel/backend',
    'products/recruitment-university/backend', 'products/recruitment-lateral/backend',
    # Profiles modules (live inside profiles, not as top-level products)
    'products/profiles/institution/backend',
    'products/profiles/company/backend',
    'products/profiles/candidate/backend',
    'products/profiles/cv/backend',
    # System-admin modules (live inside system-admin, not as top-level products)
    'products/system-admin/user-management/backend',
    'products/system-admin/database/backend',
    'products/system-admin/migrations/backend',
    'products/system-admin/testing/backend',
    'products/system-admin/simulator/backend',
    'products/preparation/backend',
]
# Map profiles/* and system-admin/* paths to registry keys
_PROFILES_REGISTRY_MAP = {
    'institution': 'institution-management',
    'company': 'company-management',
    'candidate': 'candidates',
    'cv': 'cv',
}
product_paths = {}
for pb in product_backends:
    parts = pb.split('/')
    if 'profiles' in pb and len(parts) >= 3:
        product_name = _PROFILES_REGISTRY_MAP.get(parts[-2], parts[-2])
    elif 'system-admin' in pb and len(parts) >= 3:
        product_name = parts[-2]
    elif 'feed' in pb and len(parts) >= 4:
        product_name = f"feed-{parts[2]}"  # feed-global, feed-channel
    else:
        product_name = parts[1]
    product_path = ('/' + pb) if os.path.exists('/products') else os.path.join(base_dir, pb)
    app_dir = os.path.join(product_path, 'app')
    if os.path.exists(product_path) and os.path.exists(app_dir):
        if product_path not in sys.path:
            sys.path.insert(0, product_path)
        product_paths[product_name] = product_path
        print(f"Successfully added product backend: {product_path}")

# Load registry and import routers
registry_path = os.path.join(os.path.dirname(__file__), 'product_registry.yaml')
with open(registry_path) as f:
    registry = yaml.safe_load(f)

all_routers = []
for product_name, entries in registry['products'].items():
    for entry in entries:
        modules = entry['modules']
        routers_path = entry['routers']
        imports = import_product_modules(product_name, routers_path, modules)
        for name, mod in imports.items():
            all_routers.append(mod)
    print(f"Successfully imported {product_name} modules")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown. Migrations run from entrypoint.sh before uvicorn starts."""
    yield


app = FastAPI(title="Ithras Placement API", version="1.0.0", lifespan=lifespan)

# Global exception handlers - prevent stack trace leakage, consistent error format
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

app.add_middleware(TelemetryMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Core
app.include_router(setup.router)
app.include_router(auth.router)
app.include_router(cycles.router)
app.include_router(notifications.router)
app.include_router(telemetry.router)
app.include_router(audit.router)
app.include_router(batches.router)
app.include_router(organizations.router)
app.include_router(entity_about_admin.router)
app.include_router(opportunities.router)
app.include_router(eligibility.router)
app.include_router(messaging.router)
app.include_router(benchmark_analytics.router)

# Analytics (moved from database-analytics product into core)
from app.modules.analytics.routers import database as analytics_database
from app.modules.analytics.routers import reports as analytics_reports
from app.modules.analytics.routers import schedules as analytics_schedules
from app.modules.analytics.routers import export as analytics_export
from app.modules.analytics.routers import dashboards as analytics_dashboards
app.include_router(analytics_database.router)
app.include_router(analytics_reports.router)
app.include_router(analytics_schedules.router)
app.include_router(analytics_export.router)
app.include_router(analytics_dashboards.router)

# Products
for mod in all_routers:
    app.include_router(mod.router)

# Startup: log Gemini config (masked) for PDF analysis debugging
_gk = _app_settings.GEMINI_API_KEY
print(f"GEMINI_API_KEY: {'set (' + _gk[:8] + '...)' if _gk else 'NOT SET (PDF import will use default template)'}")

UPLOAD_DIR = _app_settings.UPLOAD_DIR
LOGOS_DIR = os.path.join(UPLOAD_DIR, "logos")
FEED_DIR = os.path.join(UPLOAD_DIR, "feed")
ASSETS_COMPANIES_DIR = _app_settings.ASSETS_COMPANIES_DIR
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(LOGOS_DIR, exist_ok=True)
os.makedirs(FEED_DIR, exist_ok=True)
os.makedirs(ASSETS_COMPANIES_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/assets/companies", StaticFiles(directory=ASSETS_COMPANIES_DIR), name="assets_companies")


@app.post("/api/v1/upload/logo")
async def upload_logo(file: UploadFile):
    ext = os.path.splitext(file.filename or "logo.png")[1] or ".png"
    safe_name = f"{_uuid.uuid4().hex}{ext}"
    dest = os.path.join(LOGOS_DIR, safe_name)
    contents = await file.read()
    with open(dest, "wb") as f:
        f.write(contents)
    return {"url": f"/uploads/logos/{safe_name}"}


@app.post("/api/v1/upload/feed-image")
async def upload_feed_image(file: UploadFile):
    """Upload image for feed posts. Returns URL to include in image_urls."""
    ext = os.path.splitext(file.filename or "image.png")[1] or ".png"
    safe_name = f"{_uuid.uuid4().hex}{ext}"
    dest = os.path.join(FEED_DIR, safe_name)
    contents = await file.read()
    with open(dest, "wb") as f:
        f.write(contents)
    return {"url": f"/uploads/feed/{safe_name}"}


@app.get("/")
def root():
    return {"message": "Ithras Placement API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    """Health check for load balancer - includes DB, schema, seed, and Redis status."""
    from sqlalchemy import text
    status = {
        "status": "healthy",
        "db": "unknown",
        "schema": "unknown",
        "seeds": "unknown",
        "redis": "unknown",
    }
    try:
        from app.modules.shared.database import engine
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            seeded_users = conn.execute(
                text(
                    """
                    SELECT COUNT(*) FROM users
                    WHERE email = 'founders@ithras.com'
                    AND password_hash IS NOT NULL
                    """
                )
            ).scalar() or 0
        status["db"] = "ok"
        status["seeds"] = "ok" if seeded_users >= 1 else "incomplete"
    except Exception as e:
        status["db"] = f"error: {str(e)[:50]}"
        status["seeds"] = "unknown"
        status["status"] = "degraded"
    try:
        from app.modules.shared.setup.schema_state import get_schema_state
        schema_state = get_schema_state()
        status["schema"] = schema_state
        if not schema_state.get("ready", False):
            status["status"] = "degraded"
    except Exception as e:
        status["schema"] = {"ready": False, "error": str(e)[:120]}
        status["status"] = "degraded"
    if status.get("seeds") != "ok":
        status["status"] = "degraded"
    try:
        from app.modules.shared.cache import is_available
        status["redis"] = "ok" if is_available() else "disabled"
    except Exception as e:
        status["redis"] = f"error: {str(e)[:50]}"
    return status
