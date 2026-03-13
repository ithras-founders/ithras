"""Tests for /api/v1/application-requests."""
import pytest


def test_list_requests_requires_auth(client):
    """GET without auth -> 401."""
    r = client.get("/api/v1/application-requests")
    assert r.status_code == 401


def test_list_requests_with_auth(client, auth_headers):
    """GET with auth -> 200."""
    r = client.get("/api/v1/application-requests", headers=auth_headers)
    assert r.status_code == 200


def test_create_request_requires_auth(client):
    """POST without auth -> 401."""
    r = client.post(
        "/api/v1/application-requests",
        json={
            "workflow_id": "wf_any",
            "company_id": "co_any",
            "institution_id": "inst_any",
            "requested_by": "user_any",
        },
    )
    assert r.status_code == 401


def test_get_request_not_found(client, auth_headers):
    """GET /{bad_id} -> 404."""
    r = client.get("/api/v1/application-requests/nonexistent_bad_id", headers=auth_headers)
    assert r.status_code == 404


def test_approve_request_not_found(client, auth_headers):
    """PUT /{bad_id}/approve?approver_id=x -> 404."""
    r = client.put(
        "/api/v1/application-requests/nonexistent_bad_id/approve?approver_id=approver_xyz",
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_reject_request_not_found(client, auth_headers):
    """PUT /{bad_id}/reject?approver_id=x&rejection_reason=test -> 404."""
    r = client.put(
        "/api/v1/application-requests/nonexistent_bad_id/reject?approver_id=approver_xyz&rejection_reason=test",
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_filter_requests_by_status(client, auth_headers):
    """GET ?status=PENDING -> 200."""
    r = client.get("/api/v1/application-requests?status=PENDING", headers=auth_headers)
    assert r.status_code == 200
