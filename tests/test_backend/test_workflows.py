"""Integration tests for workflows API: list, create, pagination."""
import uuid

import pytest


def test_list_workflows_requires_auth(client):
    """List workflows without auth returns 401."""
    r = client.get("/api/v1/workflows")
    assert r.status_code == 401


def test_list_workflows_with_auth(client, auth_headers):
    """List workflows with valid session returns paginated response."""
    r = client.get("/api/v1/workflows", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


def test_list_workflows_pagination(client, auth_headers):
    """Workflows support limit and offset."""
    r = client.get(
        "/api/v1/workflows?limit=5&offset=0",
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert len(data["items"]) <= 5
    assert data["total"] >= 0


def test_create_workflow_requires_auth(client):
    """Create workflow without auth returns 401."""
    r = client.post(
        "/api/v1/workflows",
        json={
            "company_id": "c1",
            "institution_id": "i1",
            "name": "Test",
            "created_by": "u1",
        },
    )
    assert r.status_code == 401


def test_create_workflow_integration(client, auth_headers):
    """Create workflow with seeded institution/company. Skips if no seed."""
    login_r = client.post(
        "/api/v1/auth/login",
        json={"email": "founders@ithras.com", "password": "password"},
    )
    if login_r.status_code != 200:
        pytest.skip("Seeded user required")
    user_id = login_r.json().get("user", {}).get("id")
    if not user_id:
        pytest.skip("Login response must include user.id")

    workflow_name = f"Test Workflow {uuid.uuid4().hex[:8]}"
    r = client.post(
        "/api/v1/workflows",
        headers=auth_headers,
        json={
            "company_id": "seeded_company_id",
            "institution_id": "seeded_institution_id",
            "name": workflow_name,
            "description": "Integration test",
            "created_by": user_id,
            "status": "DRAFT",
        },
    )
    if r.status_code in (400, 404):
        pytest.skip("Requires seeded institution and company")
    assert r.status_code in (200, 201)
    data = r.json()
    assert "id" in data
    assert data["name"] == workflow_name
    assert data["status"] == "DRAFT"
    # Cleanup
    client.delete(f"/api/v1/workflows/{data['id']}", headers=auth_headers)


def test_get_workflow_not_found(client, auth_headers):
    """Get non-existent workflow returns 404."""
    r = client.get(
        "/api/v1/workflows/workflow_nonexistent123",
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_delete_workflow_requires_auth(client):
    """Delete workflow without auth returns 401."""
    r = client.delete("/api/v1/workflows/workflow_nonexistent")
    assert r.status_code == 401
