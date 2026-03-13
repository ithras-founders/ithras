"""
Pytest fixtures for Ithras backend tests.

Provides:
- FastAPI test client (sync + async)
- Authenticated request helpers (auth_headers, auth_token)
- Database session with per-test transaction rollback
- Seed data generation
- Factory helpers for creating test entities via API
"""
import os
import sys
import uuid

import pytest

# ---------------------------------------------------------------------------
# Path setup — works in Docker (/app) and locally (core/backend)
# ---------------------------------------------------------------------------
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT = os.path.abspath(os.path.join(_THIS_DIR, ".."))

# In Docker: backend is at /app, products at /products
# Locally: backend is at <repo>/core/backend, products at <repo>/products
_IN_DOCKER = os.path.exists("/app/app/main.py")

if _IN_DOCKER:
    _BACKEND_DIR = "/app"
else:
    _BACKEND_DIR = os.path.join(_REPO_ROOT, "core", "backend")

# Only add core backend — product backends have their own `app/` package that
# would shadow core imports.  Product routers are loaded dynamically by
# app.main.import_product_modules() which manages sys.path internally.
for p in [_BACKEND_DIR, _REPO_ROOT]:
    if os.path.isdir(p) and p not in sys.path:
        sys.path.insert(0, p)

# Environment defaults for test runs
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://ithras_user:ithras_password@localhost:5432/placement_db"
    if not _IN_DOCKER
    else "postgresql://ithras_user:ithras_password@db:5432/placement_db",
)

from httpx import ASGITransport, AsyncClient

from app.main import app


# ---------------------------------------------------------------------------
# Test-only route to verify generic exception handler (no stack trace leakage)
# ---------------------------------------------------------------------------
@app.get("/api/v1/_test/raise")
def _test_raise_internal():
    """Raises RuntimeError -- used only in tests to verify 500 handler."""
    raise RuntimeError("Intentional test error for exception handler verification")


# ---------------------------------------------------------------------------
# Core fixtures — FastAPI clients
# ---------------------------------------------------------------------------
@pytest.fixture
def client():
    """Sync TestClient for FastAPI."""
    from fastapi.testclient import TestClient
    return TestClient(app)


@pytest.fixture
async def async_client():
    """Async client for async tests."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


# ---------------------------------------------------------------------------
# Database session with per-test transaction rollback
# ---------------------------------------------------------------------------
@pytest.fixture
def db_session():
    """
    Yield a DB session wrapped in a transaction that is rolled back after the test.
    Use for tests that need direct DB access without persisting side effects.
    """
    from app.modules.shared.database import SessionLocal

    session = SessionLocal()
    session.begin_nested()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


# ---------------------------------------------------------------------------
# Auth helpers — centralised login so test files don't duplicate
# ---------------------------------------------------------------------------
DEFAULT_EMAIL = "founders@ithras.com"
DEFAULT_PASSWORD = "password"  # Matches DEMO_PASSWORD in config


@pytest.fixture
def auth_headers(client):
    """Authenticate and return headers dict. Skips if seeded user is absent."""
    r = client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD},
    )
    if r.status_code != 200:
        pytest.skip("Seeded user required for authenticated tests")
    return {"Authorization": f"Bearer {r.json()['session_id']}"}


@pytest.fixture
def auth_token(client):
    """Return the raw session_id token. Skips if seeded user absent."""
    r = client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD},
    )
    if r.status_code != 200:
        pytest.skip("Seeded user required")
    return r.json()["session_id"]


@pytest.fixture
def admin_seeded(client):
    """Seed the system admin and return the client."""
    client.post("/api/v1/admin/seed-system-admin")
    return client


# ---------------------------------------------------------------------------
# Seed data — calls the simulator endpoint to create test entities
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def seed_data():
    """Generate simulator data once per session (lightweight: 1 college, 5 students)."""
    from fastapi.testclient import TestClient

    c = TestClient(app)
    r = c.post(
        "/api/v1/simulator/generate",
        json={
            "num_colleges": 1,
            "num_students_per_college": 5,
            "num_companies": 2,
            "num_recruiters_per_company": 1,
            "num_placement_team_per_college": 1,
            "num_cycles": 1,
            "num_jobs_per_company": 2,
            "max_applications_per_student": 2,
        },
    )
    if r.status_code != 200:
        pytest.skip("Simulator endpoint unavailable — cannot seed data")
    return r.json()


# ---------------------------------------------------------------------------
# Factory helpers
# ---------------------------------------------------------------------------
def _uid(tag=""):
    return f"test_{uuid.uuid4().hex[:8]}_{tag}"


def create_user_via_api(client, headers, *, email=None, role="CANDIDATE", institution_id=None, company_id=None):
    """Create a user via the API; returns the response."""
    payload = {
        "email": email or f"{_uid('u')}@test.local",
        "name": "Test User",
        "role": role,
        "password": "password",
    }
    if institution_id:
        payload["institution_id"] = institution_id
    if company_id:
        payload["company_id"] = company_id
    return client.post("/api/v1/admin/users", headers=headers, json=payload)


def create_cycle_via_api(client, headers, **overrides):
    """Create a cycle; returns the response."""
    payload = {
        "id": _uid("cyc"),
        "name": "Test Cycle",
        "type": "FINAL",
        "category": "CURRENT",
        "status": "DRAFT",
        **overrides,
    }
    return client.post("/api/v1/cycles", headers=headers, json=payload)


def create_workflow_via_api(client, headers, *, company_id, institution_id, **overrides):
    """Create a workflow; returns the response."""
    payload = {
        "company_id": company_id,
        "institution_id": institution_id,
        "name": "Test Workflow",
        "description": "Auto-created by test",
        **overrides,
    }
    return client.post("/api/v1/workflows", headers=headers, json=payload)
