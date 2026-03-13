"""Add opportunities permissions.

Revision ID: 033
Revises: 032
Create Date: 2026-03-11

"""
from alembic import op
from sqlalchemy import text


revision = "033"
down_revision = "032"
branch_labels = None
depends_on = None

OPPORTUNITIES_PERMISSIONS = [
    ("opportunities.view", "View Opportunities", "opportunities"),
    ("opportunities.personalized.view", "View Personalized Opportunities", "opportunities"),
]

OPP_ROLES = ["CANDIDATE", "PROFESSIONAL", "RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"]


def upgrade():
    conn = op.get_bind()
    for code, name, category in OPPORTUNITIES_PERMISSIONS:
        perm_id = f"perm_{code.replace('.', '_')}"
        existing = conn.execute(text("SELECT 1 FROM permissions WHERE code = :c"), {"c": code}).fetchone()
        if not existing:
            conn.execute(
                text("INSERT INTO permissions (id, code, name, category) VALUES (:id, :code, :name, :category)"),
                {"id": perm_id, "code": code, "name": name, "category": category},
            )

    for role_id in OPP_ROLES:
        role_exists = conn.execute(text("SELECT 1 FROM roles WHERE id = :id"), {"id": role_id}).fetchone()
        if not role_exists:
            continue
        for code, _, _ in OPPORTUNITIES_PERMISSIONS:
            perm_id = f"perm_{code.replace('.', '_')}"
            perm_exists = conn.execute(text("SELECT 1 FROM permissions WHERE id = :id"), {"id": perm_id}).fetchone()
            if not perm_exists:
                continue
            existing_rp = conn.execute(
                text("SELECT 1 FROM role_permissions WHERE role_id = :rid AND permission_id = :pid"),
                {"rid": role_id, "pid": perm_id},
            ).fetchone()
            if not existing_rp:
                conn.execute(
                    text("INSERT INTO role_permissions (role_id, permission_id) VALUES (:rid, :pid)"),
                    {"rid": role_id, "pid": perm_id},
                )


def downgrade():
    conn = op.get_bind()
    for code, _, _ in OPPORTUNITIES_PERMISSIONS:
        perm_id = f"perm_{code.replace('.', '_')}"
        conn.execute(text("DELETE FROM role_permissions WHERE permission_id = :pid"), {"pid": perm_id})
        conn.execute(text("DELETE FROM permissions WHERE id = :id"), {"id": perm_id})
