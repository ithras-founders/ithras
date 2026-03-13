"""Tests for /api/v1/cycles/{cycle_id}/analytics."""
import uuid

import pytest


def test_cycle_analytics_requires_auth(client):
    """GET without auth -> 401."""
    r = client.get("/api/v1/cycles/cycle_xyz/analytics")
    assert r.status_code == 401


def test_cycle_analytics_not_found(client, auth_headers):
    """GET with bad cycle_id -> 404."""
    r = client.get("/api/v1/cycles/nonexistent_bad_cycle_id/analytics", headers=auth_headers)
    assert r.status_code == 404


def test_cycle_analytics_with_valid_cycle(client, auth_headers):
    """Create a cycle first, then GET analytics -> 200 with expected fields. Skip if creating cycle fails."""
    cycle_id = f"test_analytics_valid_{uuid.uuid4().hex[:8]}"
    resp = client.post(
        "/api/v1/cycles",
        headers=auth_headers,
        json={
            "id": cycle_id,
            "name": "Valid Analytics Cycle",
            "type": "FINAL",
            "category": "CURRENT",
            "status": "DRAFT",
        },
    )
    if resp.status_code not in (200, 201):
        pytest.skip("Could not create cycle — seed data may be required")
    try:
        r = client.get(f"/api/v1/cycles/{cycle_id}/analytics", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "total_jobs" in data
        assert "total_applications" in data
        assert "total_offers" in data
        assert "offer_rate_pct" in data
        assert "sector_distribution" in data
    finally:
        client.delete(f"/api/v1/cycles/{cycle_id}", headers=auth_headers)


def test_cycle_analytics_empty_cycle(client, auth_headers):
    """Fresh cycle with no jobs/apps -> analytics should return zeros."""
    cycle_id = f"test_analytics_empty_{uuid.uuid4().hex[:8]}"
    resp = client.post(
        "/api/v1/cycles",
        headers=auth_headers,
        json={
            "id": cycle_id,
            "name": "Empty Analytics Cycle",
            "type": "FINAL",
            "category": "CURRENT",
            "status": "DRAFT",
        },
    )
    if resp.status_code not in (200, 201):
        pytest.skip("Could not create cycle — seed data may be required")
    try:
        r = client.get(f"/api/v1/cycles/{cycle_id}/analytics", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["total_jobs"] == 0
        assert data["total_applications"] == 0
        assert data["total_offers"] == 0
        assert data["offer_rate_pct"] == 0
        assert data["sector_distribution"] == []
    finally:
        client.delete(f"/api/v1/cycles/{cycle_id}", headers=auth_headers)
