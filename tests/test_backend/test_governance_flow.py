"""Tests for governance: workflow approvals and policies."""
import pytest


def test_list_approvals_requires_auth(client):
    r = client.get("/api/v1/workflow-approvals")
    assert r.status_code == 401


def test_list_approvals_with_auth(client, auth_headers):
    r = client.get("/api/v1/workflow-approvals", headers=auth_headers)
    assert r.status_code == 200


def test_create_approval_requires_auth(client):
    r = client.post("/api/v1/workflow-approvals", json={})
    assert r.status_code == 401


def test_create_approval_invalid_data(client, auth_headers):
    r = client.post("/api/v1/workflow-approvals", headers=auth_headers, json={})
    assert r.status_code == 422


def test_approve_not_found(client, auth_headers):
    r = client.put(
        "/api/v1/workflow-approvals/nonexistent_wa/approve?approver_id=x",
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_reject_not_found(client, auth_headers):
    r = client.put(
        "/api/v1/workflow-approvals/nonexistent_wa/reject?approver_id=x&rejection_reason=test",
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_filter_approvals_by_status(client, auth_headers):
    r = client.get("/api/v1/workflow-approvals?status=PENDING", headers=auth_headers)
    assert r.status_code == 200


def test_list_policies_requires_auth(client):
    r = client.get("/api/v1/policies")
    assert r.status_code == 401


def test_list_policies_with_auth(client, auth_headers):
    r = client.get("/api/v1/policies", headers=auth_headers)
    assert r.status_code == 200
