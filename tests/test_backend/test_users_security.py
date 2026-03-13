"""Regression tests for users router authorization and scope checks."""
from types import SimpleNamespace

import pytest

from app.main import app
from app.modules.shared.auth import get_current_user
from app.modules.shared import database
from app.modules.institution.routers import users as users_router

BASE = "/api/v1/users"


class _EmptyQuery:
    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def all(self):
        return []

    def first(self):
        return None


class _FakeDB:
    def query(self, *args, **kwargs):
        return _EmptyQuery()

    def commit(self):
        return None

    def refresh(self, _obj):
        return None


def _override_auth(user_id="user_self", role="CANDIDATE"):
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
        id=user_id,
        role=role,
        institution_id="inst_a",
        company_id="comp_a",
    )
    app.dependency_overrides[database.get_db] = lambda: _FakeDB()


@pytest.fixture(autouse=True)
def _clear_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


def test_users_sensitive_routes_require_auth(client):
    user_id = "missing-user"

    assert client.get(BASE).status_code == 401
    assert client.post(
        f"{BASE}/{user_id}/profile-change-requests",
        json={"requested_by": user_id, "requested_changes": {"name": "New Name"}},
    ).status_code == 401
    assert client.get(f"{BASE}/requests/profile-change").status_code == 401
    assert client.get(f"{BASE}/{user_id}/profile-change-requests").status_code == 401
    assert client.post(
        f"{BASE}/{user_id}/profile-photo",
        files={"file": ("avatar.jpg", b"jpg", "image/jpeg")},
    ).status_code == 401


def test_users_self_scoped_routes_reject_cross_user_access(client):
    _override_auth(user_id="user_self")
    other_user_id = "user_other"

    r1 = client.get(f"{BASE}/{other_user_id}/profile-change-requests")
    assert r1.status_code == 403

    r2 = client.post(
        f"{BASE}/{other_user_id}/profile-change-requests",
        json={"requested_by": "user_self", "requested_changes": {"name": "Cross User"}},
    )
    assert r2.status_code == 403

    r3 = client.post(
        f"{BASE}/{other_user_id}/profile-photo",
        files={"file": ("avatar.jpg", b"jpg", "image/jpeg")},
    )
    assert r3.status_code == 403


def test_users_self_scoped_routes_allow_same_scope_access(client, monkeypatch):
    _override_auth(user_id="user_self")

    monkeypatch.setattr(
        users_router,
        "create_profile_change",
        lambda user_id, requested_by, changes, db: (_ for _ in ()).throw(ValueError("not_candidate")),
    )

    r1 = client.get(f"{BASE}/user_self/profile-change-requests")
    assert r1.status_code == 200

    r2 = client.post(
        f"{BASE}/user_self/profile-change-requests",
        json={"requested_by": "user_self", "requested_changes": {"name": "Self Edit"}},
    )
    assert r2.status_code == 400

    r3 = client.post(
        f"{BASE}/user_self/profile-photo",
        files={"file": ("avatar.jpg", b"jpg", "image/jpeg")},
    )
    assert r3.status_code in (200, 404)
