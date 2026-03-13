"""Tests for admin endpoints (seed-system-admin, users)."""
import uuid

from app.modules.shared.database import SessionLocal
from app.modules.shared.models.core import Institution


def _create_pending_institution(inst_id: str, name: str):
    db = SessionLocal()
    try:
        inst = Institution(
            id=inst_id,
            name=name,
            tier="Tier 1",
            location="Test City",
            status="PENDING",
            allowed_roles=[],
            features=[],
        )
        db.add(inst)
        db.commit()
    finally:
        db.close()


def _delete_institution(inst_id: str):
    db = SessionLocal()
    try:
        inst = db.query(Institution).filter(Institution.id == inst_id).first()
        if inst:
            db.delete(inst)
            db.commit()
    finally:
        db.close()

def test_seed_system_admin(client):
    r = client.post("/api/v1/admin/seed-system-admin")
    assert r.status_code == 200
    data = r.json()
    assert "message" in data
    assert "user" in data
    user = data["user"]
    assert user.get("email") == "founders@ithras.com"
    assert user.get("role") == "SYSTEM_ADMIN"


def test_seed_system_admin_idempotent(client):
    """Calling seed twice should succeed (already exists)."""
    r1 = client.post("/api/v1/admin/seed-system-admin")
    assert r1.status_code == 200
    r2 = client.post("/api/v1/admin/seed-system-admin")
    assert r2.status_code == 200
    assert "already exists" in r2.json().get("message", "").lower() or "admin" in r2.json().get("message", "").lower()


def test_get_users_after_seed(client):
    """System admin should be visible in users list after seed."""
    client.post("/api/v1/admin/seed-system-admin")
    r = client.get("/api/v1/users")
    assert r.status_code == 200
    users = r.json()
    assert isinstance(users, list)
    admin_emails = [u.get("email") for u in users if u]
    assert "founders@ithras.com" in admin_emails


def test_approve_pending_institution_to_listed(client, admin_seeded, auth_headers):
    inst_id = f"inst_{uuid.uuid4().hex[:8]}"
    _create_pending_institution(inst_id, "Pending Listed Institute")
    try:
        pending = client.get("/api/v1/admin/institutions/pending", headers=auth_headers)
        assert pending.status_code == 200
        pending_ids = {i["id"] for i in pending.json()}
        assert inst_id in pending_ids

        approve = client.post(
            f"/api/v1/admin/institutions/{inst_id}/approve",
            headers=auth_headers,
            json={"status": "LISTED", "website": "https://listed.example.edu"},
        )
        assert approve.status_code == 200
        data = approve.json()
        assert data["id"] == inst_id
        assert data["status"] == "LISTED"
        assert data.get("name") == "Pending Listed Institute"
    finally:
        _delete_institution(inst_id)


def test_approve_pending_institution_to_partner(client, admin_seeded, auth_headers):
    inst_id = f"inst_{uuid.uuid4().hex[:8]}"
    _create_pending_institution(inst_id, "Pending Partner Institute")
    try:
        approve = client.post(
            f"/api/v1/admin/institutions/{inst_id}/approve",
            headers=auth_headers,
            json={"status": "PARTNER", "about": "Approved for placement"},
        )
        assert approve.status_code == 200
        data = approve.json()
        assert data["id"] == inst_id
        assert data["status"] == "PARTNER"
    finally:
        _delete_institution(inst_id)
