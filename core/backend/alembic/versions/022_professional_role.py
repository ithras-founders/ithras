"""Add PROFESSIONAL role for general/lateral users.

Revision ID: 022
Revises: 021
Create Date: 2026-03-08

"""
from alembic import op
from sqlalchemy import text
import datetime

revision = "022"
down_revision = "021"
branch_labels = None
depends_on = None

PROFESSIONAL_PERMISSIONS = [
    "placement.cycles.view",
    "cv.templates.view",
    "applications.view_own",
    "applications.create",
]


def upgrade():
    conn = op.get_bind()
    now = datetime.datetime.utcnow().isoformat()

    existing = conn.execute(text("SELECT 1 FROM roles WHERE id = 'PROFESSIONAL'")).fetchone()
    if not existing:
        conn.execute(
            text(
                "INSERT INTO roles (id, name, type, description, is_system, created_at, updated_at) "
                "VALUES ('PROFESSIONAL', 'Professional', 'PREDEFINED', 'Lateral job seeker without institution', true, :now, :now)"
            ),
            {"now": now},
        )
    for perm_code in PROFESSIONAL_PERMISSIONS:
        perm_id = f"perm_{perm_code.replace('.', '_')}"
        existing_rp = conn.execute(
            text("SELECT 1 FROM role_permissions WHERE role_id = 'PROFESSIONAL' AND permission_id = :pid"),
            {"pid": perm_id},
        ).fetchone()
        if not existing_rp:
            conn.execute(
                text("INSERT INTO role_permissions (role_id, permission_id) VALUES ('PROFESSIONAL', :pid)"),
                {"pid": perm_id},
            )


def downgrade():
    conn = op.get_bind()
    conn.execute(text("DELETE FROM role_permissions WHERE role_id = 'PROFESSIONAL'"))
    conn.execute(text("DELETE FROM roles WHERE id = 'PROFESSIONAL'"))
