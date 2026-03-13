"""Tests for policies API: list, get, delete."""
import pytest


def test_get_policies_requires_auth(client):
    """List policies without auth returns 401."""
    r = client.get("/api/v1/policies")
    assert r.status_code == 401


def test_get_policies_with_auth(client, auth_headers):
    """List policies with valid session."""
    r = client.get("/api/v1/policies", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)


def test_delete_policy_requires_auth(client):
    """Delete policy without auth returns 401."""
    r = client.delete("/api/v1/policies/policy_nonexistent")
    assert r.status_code == 401


def test_delete_policy_not_found(client, auth_headers):
    """Delete non-existent policy returns 404."""
    r = client.delete(
        "/api/v1/policies/policy_nonexistent123",
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_create_policy(client, auth_headers):
    """Create policy with auth returns 200/201 and policy data."""
    import uuid
    policy_id = f"test_policy_{uuid.uuid4().hex[:8]}"
    r = client.post(
        "/api/v1/policies",
        headers=auth_headers,
        json={
            "id": policy_id,
            "status": "DRAFT",
            "institution_id": None,
            "program_id": None,
        },
    )
    assert r.status_code in (200, 201)
    data = r.json()
    assert data["id"] == policy_id
    assert data["status"] == "DRAFT"
    # Cleanup
    client.delete(f"/api/v1/policies/{policy_id}", headers=auth_headers)


def test_update_policy(client, auth_headers):
    """Create policy, update it, verify, cleanup."""
    import uuid
    policy_id = f"test_policy_{uuid.uuid4().hex[:8]}"
    client.post(
        "/api/v1/policies",
        headers=auth_headers,
        json={"id": policy_id, "status": "DRAFT"},
    )
    r = client.put(
        f"/api/v1/policies/{policy_id}",
        headers=auth_headers,
        json={"status": "ACTIVE"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ACTIVE"
    client.delete(f"/api/v1/policies/{policy_id}", headers=auth_headers)
