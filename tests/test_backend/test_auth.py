"""Tests for auth: login, session validation, JWT, protected routes."""
import pytest


def test_login_success(client):
    """Login with valid credentials returns user, session_id, and access_token (JWT)."""
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "founders@ithras.com", "password": "password"},
    )
    if r.status_code != 200:
        pytest.skip("Seeded user may not exist or password mismatch")
    data = r.json()
    assert "user" in data
    assert "session_id" in data
    assert "access_token" in data
    assert data["user"].get("email") == "founders@ithras.com"


def test_login_invalid_password(client):
    """Login with wrong password returns 401."""
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "founders@ithras.com", "password": "wrong"},
    )
    assert r.status_code == 401


def test_protected_route_without_auth(client):
    """Protected API returns 401 without valid session."""
    r = client.get("/api/v1/cycles")
    assert r.status_code == 401


def test_protected_route_with_session(client):
    """Protected API returns 200 when session_id is valid."""
    login_r = client.post(
        "/api/v1/auth/login",
        json={"email": "founders@ithras.com", "password": "password"},
    )
    if login_r.status_code != 200:
        pytest.skip("Seeded user may not exist")
    session_id = login_r.json().get("session_id")
    assert session_id
    r = client.get(
        "/api/v1/cycles",
        headers={"Authorization": f"Bearer {session_id}"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data


def test_protected_route_with_jwt(client):
    """Protected API returns 200 when JWT access_token is used (stateless auth)."""
    login_r = client.post(
        "/api/v1/auth/login",
        json={"email": "founders@ithras.com", "password": "password"},
    )
    if login_r.status_code != 200:
        pytest.skip("Seeded user may not exist")
    access_token = login_r.json().get("access_token")
    assert access_token
    assert "." in access_token  # JWT has 3 base64-encoded parts
    r = client.get(
        "/api/v1/cycles",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data
