"""Tests for JD Submissions API: /api/v1/jd-submissions."""
import pytest


def test_list_jd_submissions_requires_auth(client):
    r = client.get("/api/v1/jd-submissions")
    assert r.status_code == 401


def test_list_jd_submissions_with_auth(client, auth_headers):
    r = client.get("/api/v1/jd-submissions", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) or "items" in data


def test_create_jd_submission_requires_auth(client):
    r = client.post("/api/v1/jd-submissions", json={})
    assert r.status_code == 401


def test_create_jd_submission_invalid_data(client, auth_headers):
    r = client.post("/api/v1/jd-submissions", headers=auth_headers, json={})
    assert r.status_code == 422


def test_create_jd_submission_integration(client, auth_headers):
    r = client.post("/api/v1/jd-submissions", headers=auth_headers, json={
        "workflow_id": "seeded_workflow_id",
        "company_id": "seeded_company_id",
        "job_title": "Test Analyst",
        "job_description": "A test JD",
        "sector": "Technology",
        "slot": "A1",
        "fixed_comp": 25.0,
        "variable_comp": 5.0,
        "esops_vested": 0,
        "joining_bonus": 1.0,
        "performance_bonus": 2.0,
        "is_top_decile": False,
    })
    if r.status_code in (400, 404):
        pytest.skip("Requires seeded workflow and company")
    assert r.status_code in (200, 201)
    data = r.json()
    assert "id" in data
    assert data.get("job_title") == "Test Analyst"


def test_approve_jd_not_found(client, auth_headers):
    r = client.put("/api/v1/jd-submissions/nonexistent_jd/approve", headers=auth_headers)
    assert r.status_code == 404


def test_reject_jd_not_found(client, auth_headers):
    r = client.put(
        "/api/v1/jd-submissions/nonexistent_jd/reject?rejection_reason=test",
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_filter_jd_by_status(client, auth_headers):
    r = client.get("/api/v1/jd-submissions?status=PENDING", headers=auth_headers)
    assert r.status_code == 200
