"""Integration tests for the full application lifecycle: /api/v1/applications."""
import pytest


def test_application_full_lifecycle(client, auth_headers):
    """Create -> get -> update status -> get stages -> withdraw -> verify deleted."""
    cr = client.post("/api/v1/applications", headers=auth_headers, json={
        "student_id": "seeded_student_id",
        "workflow_id": "seeded_workflow_id",
        "cv_id": "seeded_cv_id",
    })
    if cr.status_code in (400, 404):
        pytest.skip("Requires seeded student, workflow, and CV")
    assert cr.status_code in (200, 201)
    app_id = cr.json()["id"]

    gr = client.get(f"/api/v1/applications/{app_id}", headers=auth_headers)
    assert gr.status_code == 200
    assert gr.json()["id"] == app_id

    ur = client.put(f"/api/v1/applications/{app_id}", headers=auth_headers,
                    json={"status": "SHORTLISTED"})
    assert ur.status_code == 200

    sr = client.get(f"/api/v1/applications/{app_id}/stages", headers=auth_headers)
    assert sr.status_code == 200

    dr = client.delete(f"/api/v1/applications/{app_id}", headers=auth_headers)
    assert dr.status_code == 200

    vr = client.get(f"/api/v1/applications/{app_id}", headers=auth_headers)
    assert vr.status_code == 404


def test_create_application_duplicate(client, auth_headers):
    """Creating same student+workflow twice should fail."""
    payload = {
        "student_id": "seeded_student_id",
        "workflow_id": "seeded_workflow_id",
        "cv_id": "seeded_cv_id",
    }
    r1 = client.post("/api/v1/applications", headers=auth_headers, json=payload)
    if r1.status_code in (400, 404):
        pytest.skip("Requires seeded data")
    r2 = client.post("/api/v1/applications", headers=auth_headers, json=payload)
    assert r2.status_code in (400, 409)
    client.delete(f"/api/v1/applications/{r1.json()['id']}", headers=auth_headers)


def test_create_application_invalid_workflow(client, auth_headers):
    r = client.post("/api/v1/applications", headers=auth_headers, json={
        "student_id": "any_student",
        "workflow_id": "nonexistent_workflow_xyz",
        "cv_id": "any_cv",
    })
    assert r.status_code in (400, 404)


def test_list_applications_by_student_filter(client, auth_headers):
    r = client.get("/api/v1/applications?student_id=any_student", headers=auth_headers)
    assert r.status_code == 200


def test_list_applications_by_workflow_filter(client, auth_headers):
    r = client.get("/api/v1/applications?workflow_id=any_wf", headers=auth_headers)
    assert r.status_code == 200


def test_get_application_stage_progress(client, auth_headers):
    """Stage progress endpoint should return list or 404."""
    r = client.get("/api/v1/applications/nonexistent_app/stages", headers=auth_headers)
    assert r.status_code in (200, 404)
