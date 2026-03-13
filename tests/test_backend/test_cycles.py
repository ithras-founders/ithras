"""Tests for cycles API: list, stats, CRUD."""
import pytest


def test_get_cycles_with_auth(client, auth_headers):
    """List cycles returns paginated response."""
    r = client.get("/api/v1/cycles", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


def test_get_cycle_stats_requires_auth(client):
    """Cycle stats without auth returns 401."""
    r = client.get("/api/v1/cycles/cycle_xyz/stats")
    assert r.status_code == 401


def test_get_cycle_stats_with_auth(client, auth_headers):
    """Cycle stats with valid auth - 404 if cycle not found, 200 with stats if found."""
    r = client.get("/api/v1/cycles/nonexistent_cycle_id/stats", headers=auth_headers)
    assert r.status_code == 404
    # If we had a real cycle, we'd get 200 with {"stats": [...]}


def test_create_cycle(client, auth_headers):
    """Create cycle with valid auth returns 200/201 and cycle data."""
    import uuid
    cycle_id = f"test_cycle_{uuid.uuid4().hex[:8]}"
    r = client.post(
        "/api/v1/cycles",
        headers=auth_headers,
        json={
            "id": cycle_id,
            "name": "Test Cycle",
            "type": "PLACEMENT",
            "category": "SUMMER",
            "status": "DRAFT",
        },
    )
    assert r.status_code in (200, 201)
    data = r.json()
    assert data["id"] == cycle_id
    assert data["name"] == "Test Cycle"
    assert "stats" not in data  # stats is on a separate endpoint
    # Cleanup: delete the cycle
    client.delete(f"/api/v1/cycles/{cycle_id}", headers=auth_headers)


def test_get_cycle_stats_with_real_cycle(client, auth_headers):
    """Create cycle, get stats, verify shape, cleanup."""
    import uuid
    cycle_id = f"test_cycle_{uuid.uuid4().hex[:8]}"
    client.post(
        "/api/v1/cycles",
        headers=auth_headers,
        json={
            "id": cycle_id,
            "name": "Stats Test Cycle",
            "type": "PLACEMENT",
            "category": "SUMMER",
            "status": "DRAFT",
        },
    )
    r = client.get(f"/api/v1/cycles/{cycle_id}/stats", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "stats" in data
    assert isinstance(data["stats"], list)
    client.delete(f"/api/v1/cycles/{cycle_id}", headers=auth_headers)
