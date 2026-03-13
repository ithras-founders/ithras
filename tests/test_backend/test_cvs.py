"""Tests for CV CRUD and verify endpoints."""
import pytest


def test_get_cvs_empty(admin_seeded):
    r = admin_seeded.get("/api/v1/cvs")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)


def test_get_cvs_not_found(admin_seeded):
    r = admin_seeded.get("/api/v1/cvs/nonexistent-id")
    assert r.status_code == 404
