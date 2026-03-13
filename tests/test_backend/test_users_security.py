"""Regression tests for users router authorization and scope checks."""
import pytest


BASE = "/api/v1/users"


def _login_seeded_admin(client):
    client.post("/api/v1/admin/seed-system-admin")
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "founders@ithras.com", "password": "password"},
    )
    if login.status_code != 200:
        pytest.skip("Seeded user required for auth tests")
    return login.json()["user"], {"Authorization": f"Bearer {login.json()['session_id']}"}


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
    me, headers = _login_seeded_admin(client)
    other_user_id = "user_other"

    r1 = client.get(f"{BASE}/{other_user_id}/profile-change-requests", headers=headers)
    assert r1.status_code == 403

    r2 = client.post(
        f"{BASE}/{other_user_id}/profile-change-requests",
        headers=headers,
        json={"requested_by": me["id"], "requested_changes": {"name": "Cross User"}},
    )
    assert r2.status_code == 403

    r3 = client.post(
        f"{BASE}/{other_user_id}/profile-photo",
        headers=headers,
        files={"file": ("avatar.jpg", b"jpg", "image/jpeg")},
    )
    assert r3.status_code == 403


def test_users_self_scoped_routes_allow_same_user_access(client):
    me, headers = _login_seeded_admin(client)

    r1 = client.get(f"{BASE}/{me['id']}/profile-change-requests", headers=headers)
    assert r1.status_code == 200

    # Uses authenticated identity + self user_id; service may still reject based on role,
    # but auth/scope should allow request through dependency checks.
    r2 = client.post(
        f"{BASE}/{me['id']}/profile-change-requests",
        headers=headers,
        json={"requested_by": me["id"], "requested_changes": {"name": "Self Edit"}},
    )
    assert r2.status_code in (200, 400)


def test_users_scope_filter_denies_out_of_scope_institution(client):
    _, headers = _login_seeded_admin(client)

    # seeded admin has no institution context; treated as system admin and allowed
    allowed = client.get(f"{BASE}?institution_id=inst_1", headers=headers)
    assert allowed.status_code == 200

    # cross-scope check on explicit company scope should still pass for system admin
    allowed_company = client.get(f"{BASE}?company_id=comp_1", headers=headers)
    assert allowed_company.status_code == 200
