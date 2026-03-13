"""Add identity and scope-aware permissions.

Revision ID: 030
Revises: 029
Create Date: 2026-03-11

"""
from alembic import op
from sqlalchemy import text


revision = "030"
down_revision = "029"
branch_labels = None
depends_on = None

IDENTITY_PERMISSIONS = [
    ("profile.self.view", "View Own Profile", "identity"),
    ("profile.self.edit", "Edit Own Profile", "identity"),
    ("profile.affiliations.view", "View Affiliations", "identity"),
    ("auth.profile.switch", "Switch Profile", "identity"),
    ("cv.self.view", "View Own CV", "cv"),
    ("cv.self.manage", "Manage Own CV", "cv"),
    ("applications.self.view", "View Own Applications", "applications"),
    ("placement.students.view", "View Students", "placement"),
    ("placement.students.manage", "Manage Students", "placement"),
    ("placement.eligibility.view", "View Eligibility", "placement"),
    ("placement.eligibility.override", "Override Eligibility", "placement"),
    ("recruitment.discovery.search", "Search Talent", "recruitment"),
    ("recruitment.shortlist.manage", "Manage Shortlist", "recruitment"),
    ("recruitment.offer.approve", "Approve Offers", "recruitment"),
    ("recruitment.job_profiles.view", "View Job Profiles", "recruitment"),
    ("recruitment.job_profiles.create", "Create Job Profiles", "recruitment"),
    ("recruitment.job_profiles.manage", "Manage Job Profiles", "recruitment"),
    ("institution.structure.view", "View Institution Structure", "institution"),
    ("institution.structure.manage", "Manage Institution Structure", "institution"),
    ("company.business_units.manage", "Manage Business Units", "company"),
    ("system.audit.view", "View Audit Log", "system"),
    ("system.permissions.manage", "Manage Permissions", "system"),
    ("governance.workflows.approve", "Approve Workflows", "governance"),
]

# Roles that get self-scoped identity permissions (all authenticated users)
IDENTITY_SELF_ROLES = ["CANDIDATE", "PROFESSIONAL", "RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "INSTITUTION_ADMIN", "SYSTEM_ADMIN", "FACULTY_OBSERVER"]


def upgrade():
    conn = op.get_bind()
    for code, name, category in IDENTITY_PERMISSIONS:
        perm_id = f"perm_{code.replace('.', '_')}"
        existing = conn.execute(text("SELECT 1 FROM permissions WHERE code = :c"), {"c": code}).fetchone()
        if not existing:
            conn.execute(
                text("INSERT INTO permissions (id, code, name, category) VALUES (:id, :code, :name, :category)"),
                {"id": perm_id, "code": code, "name": name, "category": category},
            )

    self_perm_codes = ["profile.self.view", "profile.self.edit", "auth.profile.switch", "applications.self.view"]
    cv_self_codes = ["cv.self.view", "cv.self.manage"]
    cv_self_roles = ["CANDIDATE", "PROFESSIONAL"]

    for role_id in IDENTITY_SELF_ROLES:
        role_exists = conn.execute(text("SELECT 1 FROM roles WHERE id = :id"), {"id": role_id}).fetchone()
        if not role_exists:
            continue
        for perm_code in self_perm_codes:
            perm_id = f"perm_{perm_code.replace('.', '_')}"
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

    for role_id in cv_self_roles:
        role_exists = conn.execute(text("SELECT 1 FROM roles WHERE id = :id"), {"id": role_id}).fetchone()
        if not role_exists:
            continue
        for perm_code in cv_self_codes:
            perm_id = f"perm_{perm_code.replace('.', '_')}"
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
    for code, _, _ in IDENTITY_PERMISSIONS:
        perm_id = f"perm_{code.replace('.', '_')}"
        conn.execute(text("DELETE FROM role_permissions WHERE permission_id = :pid"), {"pid": perm_id})
        conn.execute(text("DELETE FROM permissions WHERE id = :id"), {"id": perm_id})
