"""Tests for /api/v1/bulk/ endpoints."""
import pytest


def test_bulk_progress_requires_auth(client):
    """POST /bulk/progress-students without auth -> 401."""
    r = client.post(
        "/api/v1/bulk/progress-students",
        json={
            "workflow_id": "wf_bad",
            "stage_id": "stage_bad",
            "student_ids": [],
            "requested_by": "user_bad",
        },
    )
    assert r.status_code == 401


def test_bulk_progress_invalid_workflow(client, auth_headers):
    """POST with bad workflow_id -> 400 or 404."""
    r = client.post(
        "/api/v1/bulk/progress-students",
        headers=auth_headers,
        json={
            "workflow_id": "nonexistent_workflow_id",
            "stage_id": "nonexistent_stage_id",
            "student_ids": [],
            "requested_by": "user_bad",
        },
    )
    assert r.status_code in (400, 404)


def test_bulk_download_cvs_requires_auth(client):
    """POST /bulk/download-cvs without auth -> 401."""
    r = client.post("/api/v1/bulk/download-cvs")
    assert r.status_code == 401


def test_bulk_download_cvs_missing_params(client, auth_headers):
    """POST with no workflow_id or job_id -> 400 or 422."""
    r = client.post("/api/v1/bulk/download-cvs", headers=auth_headers)
    assert r.status_code in (400, 422)
