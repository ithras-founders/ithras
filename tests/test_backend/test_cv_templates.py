"""Tests for CV templates: allocate, publish, active template."""
import pytest


def test_get_cv_templates_empty(admin_seeded):
    r = admin_seeded.get("/api/v1/cv-templates")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)


def test_get_allocations_for_institution(admin_seeded):
    """Allocations endpoint should return list (may be empty)."""
    r = admin_seeded.get("/api/v1/institutions")
    assert r.status_code == 200
    institutions = r.json()
    if institutions:
        inst_id = institutions[0]["id"]
        r2 = admin_seeded.get(f"/api/v1/cv-templates/allocations/{inst_id}")
        assert r2.status_code == 200
        assert isinstance(r2.json(), list)
