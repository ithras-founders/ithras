"""Tests for entity_about_admin validation."""

import uuid

from app.modules.shared import models
from app.modules.shared.database import SessionLocal
from app.modules.shared.normalization import normalize_canonical_key


def _admin_headers(client):
    client.post("/api/v1/admin/seed-system-admin")
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "founders@ithras.com", "password": "password"},
    )
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['session_id']}"}


def test_create_business_unit_rejects_duplicate_name_and_code(client):
    headers = _admin_headers(client)
    company_id = f"comp_{uuid.uuid4().hex[:8]}"

    db = SessionLocal()
    try:
        db.add(models.Company(id=company_id, name="Acme"))
        db.commit()
    finally:
        db.close()

    first = client.post(
        f"/api/v1/organizations/companies/{company_id}/business-units",
        headers=headers,
        json={"name": "Engineering", "code": "ENG"},
    )
    assert first.status_code == 200

    duplicate_name = client.post(
        f"/api/v1/organizations/companies/{company_id}/business-units",
        headers=headers,
        json={"name": "  engineering  ", "code": "ENG-2"},
    )
    assert duplicate_name.status_code == 409

    duplicate_code = client.post(
        f"/api/v1/organizations/companies/{company_id}/business-units",
        headers=headers,
        json={"name": "Product", "code": "  eng "},
    )
    assert duplicate_code.status_code == 409


def test_create_degree_rejects_program_from_other_institution(client):
    headers = _admin_headers(client)
    institution_id = f"inst_{uuid.uuid4().hex[:8]}"
    other_institution_id = f"inst_{uuid.uuid4().hex[:8]}"
    program_id = f"prog_{uuid.uuid4().hex[:8]}"

    db = SessionLocal()
    try:
        db.add(models.Institution(id=institution_id, name="Inst A"))
        db.add(models.Institution(id=other_institution_id, name="Inst B"))
        db.add(
            models.Program(
                id=program_id,
                institution_id=other_institution_id,
                name="MBA",
                normalized_name=normalize_canonical_key("MBA"),
                code="MBA",
            )
        )
        db.commit()
    finally:
        db.close()

    response = client.post(
        f"/api/v1/organizations/institutions/{institution_id}/degrees",
        headers=headers,
        json={"name": "Masters", "degree_type": "PG", "program_id": program_id},
    )

    assert response.status_code == 400
    assert "Program does not belong to institution" in response.json().get("detail", "")
