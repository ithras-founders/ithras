"""Tests for global exception handlers - validation, HTTP, generic 500."""
import pytest


def test_validation_error_returns_422(client):
    """Invalid request body returns 422 with structured error format."""
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "not-an-email", "password": 123},  # password should be string
    )
    assert r.status_code == 422
    data = r.json()
    assert "detail" in data
    assert data.get("error") is True
    detail = data["detail"]
    assert "errors" in detail or "message" in detail


def test_validation_error_missing_fields(client):
    """Missing required fields returns 422."""
    r = client.post(
        "/api/v1/auth/login",
        json={},  # missing email and password
    )
    assert r.status_code == 422
    data = r.json()
    assert "detail" in data


def test_generic_500_no_stack_trace(client):
    """Unhandled exceptions return generic 500 without leaking stack trace."""
    r = client.get("/api/v1/_test/raise")
    assert r.status_code == 500
    data = r.json()
    assert "detail" in data
    assert data.get("error") is True
    detail = data["detail"]
    msg = detail if isinstance(detail, str) else detail.get("message", "")
    assert "unexpected error" in msg.lower() or "error" in msg.lower()
    # Ensure we don't expose stack traces or internal paths
    body_str = str(data)
    assert "traceback" not in body_str.lower()
    assert "runtimeerror" not in body_str.lower()
    assert "intentional test" not in body_str.lower()
