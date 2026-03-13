"""Tests for admin endpoints (seed-system-admin, users)."""
import pytest


def test_seed_system_admin(client):
    r = client.post("/api/v1/admin/seed-system-admin")
    assert r.status_code == 200
    data = r.json()
    assert "message" in data
    assert "user" in data
    user = data["user"]
    assert user.get("email") == "founders@ithras.com"
    assert user.get("role") == "SYSTEM_ADMIN"


def test_seed_system_admin_idempotent(client):
    """Calling seed twice should succeed (already exists)."""
    r1 = client.post("/api/v1/admin/seed-system-admin")
    assert r1.status_code == 200
    r2 = client.post("/api/v1/admin/seed-system-admin")
    assert r2.status_code == 200
    assert "already exists" in r2.json().get("message", "").lower() or "admin" in r2.json().get("message", "").lower()


def test_get_users_after_seed(client):
    """System admin should be visible in users list after seed."""
    client.post("/api/v1/admin/seed-system-admin")
    r = client.get("/api/v1/users")
    assert r.status_code == 200
    users = r.json()
    assert isinstance(users, list)
    admin_emails = [u.get("email") for u in users if u]
    assert "founders@ithras.com" in admin_emails


def test_admin_summary_endpoint(client):
    """System admin summary endpoint should return aggregated counters."""
    login_r = client.post(
        "/api/v1/auth/login",
        json={"email": "founders@ithras.com", "password": "password"},
    )
    if login_r.status_code != 200:
        pytest.skip("Seeded admin login unavailable")
    token = login_r.json().get("access_token") or login_r.json().get("session_id")
    assert token
    r = client.get(
        "/api/v1/admin/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "totalInstitutions" in data
    assert "totalCompanies" in data
    assert "totalUsers" in data
    assert "pendingInstitutions" in data
    assert "pendingCompanies" in data
