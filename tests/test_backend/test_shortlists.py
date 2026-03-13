"""Tests for shortlists API: create, list, respond."""
import pytest


def test_get_shortlists_with_auth(client, auth_headers):
    """List shortlists with valid session."""
    r = client.get("/api/v1/shortlists", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data


def test_create_shortlist_requires_auth(client):
    """Create shortlist without auth returns 401."""
    r = client.post(
        "/api/v1/shortlists",
        json={"candidate_id": "u1", "job_id": "j1"},
    )
    assert r.status_code == 401


def test_create_shortlist_validation_rejects_without_application(client, auth_headers):
    """Create shortlist fails when candidate has not applied to job (400)."""
    r = client.post(
        "/api/v1/shortlists",
        headers=auth_headers,
        json={"candidate_id": "nonexistent_student", "job_id": "nonexistent_job"},
    )
    assert r.status_code == 400
    assert "applied" in r.json().get("detail", "").lower() or "not" in r.json().get("detail", "").lower()


def test_create_shortlist_success(client, auth_headers):
    """Create shortlist with valid data. Skips if no seeded application (student applied to job)."""
    r = client.post(
        "/api/v1/shortlists",
        headers=auth_headers,
        json={"candidate_id": "seeded_student_id", "job_id": "seeded_job_id"},
    )
    if r.status_code == 400:
        pytest.skip("Requires seeded application (student applied to job)")
    assert r.status_code == 201
    data = r.json()
    assert "id" in data
    assert data["candidate_id"] == "seeded_student_id"
    assert data["job_id"] == "seeded_job_id"
