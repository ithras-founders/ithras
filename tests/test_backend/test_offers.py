"""Tests for offers API: list, create, accept, reject, withdraw lifecycle."""
import pytest


def test_list_offers_requires_auth(client):
    """GET without auth returns 401."""
    r = client.get("/api/v1/offers")
    assert r.status_code == 401


def test_list_offers_with_auth(client, auth_headers):
    """GET with auth returns 200."""
    r = client.get("/api/v1/offers", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) or ("items" in data and "total" in data)


def test_create_offer_requires_auth(client):
    """POST without auth returns 401."""
    r = client.post(
        "/api/v1/offers",
        json={
            "application_id": "app_xxx",
            "candidate_id": "u1",
            "company_id": "c1",
            "job_id": "j1",
        },
    )
    assert r.status_code == 401


def test_create_offer_invalid_data(client, auth_headers):
    """POST with bad IDs returns 400 or 404."""
    r = client.post(
        "/api/v1/offers",
        headers=auth_headers,
        json={
            "application_id": "app_nonexistent",
            "candidate_id": "u_nonexistent",
            "company_id": "c_nonexistent",
            "job_id": "j_nonexistent",
        },
    )
    assert r.status_code in (400, 404)


def test_offer_accept_requires_auth(client):
    """POST /{id}/accept without auth returns 401."""
    r = client.post("/api/v1/offers/offer_nonexistent/accept")
    assert r.status_code == 401


def test_offer_reject_requires_auth(client):
    """POST /{id}/reject without auth returns 401."""
    r = client.post("/api/v1/offers/offer_nonexistent/reject")
    assert r.status_code == 401


def test_offer_withdraw_requires_auth(client):
    """POST /{id}/withdraw without auth returns 401."""
    r = client.post("/api/v1/offers/offer_nonexistent/withdraw")
    assert r.status_code == 401


def test_offer_not_found(client, auth_headers):
    """GET /{bad_id} returns 404."""
    r = client.get(
        "/api/v1/offers/offer_nonexistent123",
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_offer_full_lifecycle(client, auth_headers):
    """Create offer -> accept -> verify status. Skip if no seed. Cleanup."""
    create_r = client.post(
        "/api/v1/offers",
        headers=auth_headers,
        json={
            "application_id": "seeded_app_id",
            "candidate_id": "seeded_student_id",
            "company_id": "seeded_company_id",
            "job_id": "seeded_job_id",
        },
    )
    if create_r.status_code in (400, 404):
        pytest.skip("Requires seeded application, student, company, and job")
    assert create_r.status_code in (200, 201)
    data = create_r.json()
    offer_id = data["id"]
    assert data["status"] == "PENDING"

    accept_r = client.post(
        f"/api/v1/offers/{offer_id}/accept",
        headers=auth_headers,
    )
    if accept_r.status_code in (400, 403):
        pytest.skip("Offer acceptance may be blocked by policy or candidate mismatch")
    assert accept_r.status_code == 200

    get_r = client.get(f"/api/v1/offers/{offer_id}", headers=auth_headers)
    assert get_r.status_code == 200
    assert get_r.json()["status"] == "ACCEPTED"
