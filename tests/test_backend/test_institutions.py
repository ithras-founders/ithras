"""Tests for institutions endpoints."""
import pytest


def test_get_institutions(admin_seeded):
    r = admin_seeded.get("/api/v1/institutions")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
