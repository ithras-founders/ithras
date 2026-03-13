"""Add organization structure/about read permissions and role mappings.

Revision ID: 047
Revises: 046
Create Date: 2026-03-13
"""

from alembic import op
from sqlalchemy import text


revision = "047"
down_revision = "046"
branch_labels = None
depends_on = None


NEW_PERMISSIONS = [
    ("company.structure.view", "View Company Structure", "company"),
    ("company.about.view", "View Company About", "company"),
    ("institution.about.view", "View Institution About", "institution"),
]

ROLE_PERMISSION_MAP = {
    "SYSTEM_ADMIN": [
        "company.structure.view",
        "company.about.view",
        "institution.about.view",
    ],
    "INSTITUTION_ADMIN": [
        "institution.about.view",
        "institution.structure.view",
    ],
    "PLACEMENT_ADMIN": [
        "institution.about.view",
        "institution.structure.view",
    ],
    "PLACEMENT_TEAM": [
        "institution.about.view",
        "institution.structure.view",
    ],
    "FACULTY_OBSERVER": [
        "institution.about.view",
        "institution.structure.view",
    ],
    "RECRUITER": [
        "company.about.view",
        "company.structure.view",
    ],
}


def _perm_id(code: str) -> str:
    return f"perm_{code.replace('.', '_')}"


def upgrade() -> None:
    conn = op.get_bind()

    for code, name, category in NEW_PERMISSIONS:
        exists = conn.execute(text("SELECT 1 FROM permissions WHERE code = :code"), {"code": code}).fetchone()
        if not exists:
            conn.execute(
                text("INSERT INTO permissions (id, code, name, category) VALUES (:id, :code, :name, :category)"),
                {"id": _perm_id(code), "code": code, "name": name, "category": category},
            )

    for role_id, permission_codes in ROLE_PERMISSION_MAP.items():
        role_exists = conn.execute(text("SELECT 1 FROM roles WHERE id = :id"), {"id": role_id}).fetchone()
        if not role_exists:
            continue
        for permission_code in permission_codes:
            permission_id = _perm_id(permission_code)
            perm_exists = conn.execute(text("SELECT 1 FROM permissions WHERE id = :id"), {"id": permission_id}).fetchone()
            if not perm_exists:
                continue
            rp_exists = conn.execute(
                text("SELECT 1 FROM role_permissions WHERE role_id = :role_id AND permission_id = :permission_id"),
                {"role_id": role_id, "permission_id": permission_id},
            ).fetchone()
            if not rp_exists:
                conn.execute(
                    text("INSERT INTO role_permissions (role_id, permission_id) VALUES (:role_id, :permission_id)"),
                    {"role_id": role_id, "permission_id": permission_id},
                )


def downgrade() -> None:
    conn = op.get_bind()

    for role_id, permission_codes in ROLE_PERMISSION_MAP.items():
        for permission_code in permission_codes:
            conn.execute(
                text("DELETE FROM role_permissions WHERE role_id = :role_id AND permission_id = :permission_id"),
                {"role_id": role_id, "permission_id": _perm_id(permission_code)},
            )

    for code, _, _ in NEW_PERMISSIONS:
        conn.execute(text("DELETE FROM permissions WHERE id = :id"), {"id": _perm_id(code)})
