"""Tests for applications API: list, pagination."""
import pytest


def test_get_applications_with_auth(client, auth_headers):
    """List applications with valid session returns paginated result."""
    r = client.get("/api/v1/applications", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


def test_get_applications_pagination(client, auth_headers):
    """Applications support limit and offset."""
    r = client.get(
        "/api/v1/applications?limit=5&offset=0",
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert len(data["items"]) <= 5


def test_update_application_requires_auth(client):
    """Update application without auth returns 401."""
    r = client.put(
        "/api/v1/applications/app_nonexistent",
        json={"status": "WITHDRAWN"},
    )
    assert r.status_code == 401


def test_delete_application_requires_auth(client):
    """Delete application without auth returns 401."""
    r = client.delete("/api/v1/applications/app_nonexistent")
    assert r.status_code == 401


def test_update_application_not_found(client, auth_headers):
    """Update non-existent application returns 404."""
    r = client.put(
        "/api/v1/applications/app_nonexistent123",
        headers=auth_headers,
        json={"status": "WITHDRAWN"},
    )
    assert r.status_code == 404


def test_delete_application_not_found(client, auth_headers):
    """Delete non-existent application returns 404."""
    r = client.delete(
        "/api/v1/applications/app_nonexistent123",
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_create_application_integration(client, auth_headers):
    """Create application with seeded CV/workflow. Skips if no seed."""
    r = client.post(
        "/api/v1/applications",
        headers=auth_headers,
        json={
            "student_id": "seeded_student_id",
            "workflow_id": "seeded_workflow_id",
            "cv_id": "seeded_cv_id",
        },
    )
    if r.status_code in (400, 404):
        pytest.skip("Requires seeded CV, active workflow, and student")
    assert r.status_code in (200, 201)
    data = r.json()
    assert "id" in data
    assert data["status"] == "SUBMITTED"
    # Cleanup: delete the application
    client.delete(f"/api/v1/applications/{data['id']}", headers=auth_headers)


def test_create_update_delete_application_integration(client, auth_headers):
    """Create application, update status, delete. Skips if no seed."""
    create_r = client.post(
        "/api/v1/applications",
        headers=auth_headers,
        json={
            "student_id": "seeded_student_id",
            "workflow_id": "seeded_workflow_id",
            "cv_id": "seeded_cv_id",
        },
    )
    if create_r.status_code in (400, 404):
        pytest.skip("Requires seeded CV, active workflow, and student")
    app_id = create_r.json()["id"]

    update_r = client.put(
        f"/api/v1/applications/{app_id}",
        headers=auth_headers,
        json={"status": "WITHDRAWN"},
    )
    assert update_r.status_code == 200
    assert update_r.json()["status"] == "WITHDRAWN"

    del_r = client.delete(f"/api/v1/applications/{app_id}", headers=auth_headers)
    assert del_r.status_code == 200
    get_r = client.get(f"/api/v1/applications/{app_id}", headers=auth_headers)
    assert get_r.status_code == 404
