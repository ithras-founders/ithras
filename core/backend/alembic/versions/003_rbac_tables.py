"""RBAC tables: roles, permissions, role_permissions, user_role_assignments.

Revision ID: 003
Revises: 002
Create Date: 2026-02-28
"""
from alembic import op
from sqlalchemy import Column, String, Boolean, DateTime, inspect, text
import datetime

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None

PREDEFINED_PERMISSIONS = [
    ("placement.cycles.view", "View Placement Cycles", "placement"),
    ("placement.cycles.manage", "Manage Placement Cycles", "placement"),
    ("placement.cycles.configure", "Configure Placement Cycles", "placement"),
    ("cv.templates.view", "View CV Templates", "cv"),
    ("cv.templates.create", "Create CV Templates", "cv"),
    ("cv.templates.assign", "Assign CV Templates", "cv"),
    ("cv.templates.publish", "Publish CV Templates", "cv"),
    ("applications.view_own", "View Own Applications", "applications"),
    ("applications.view_all", "View All Applications", "applications"),
    ("applications.create", "Create Applications", "applications"),
    ("applications.approve", "Approve Applications", "applications"),
    ("users.view", "View Users", "users"),
    ("users.create", "Create Users", "users"),
    ("users.manage_roles", "Manage User Roles", "users"),
    ("institution.view", "View Institution", "institution"),
    ("institution.manage", "Manage Institution", "institution"),
    ("institution.manage_programs", "Manage Programs", "institution"),
    ("company.view", "View Company", "company"),
    ("company.manage", "Manage Company", "company"),
    ("company.manage_jobs", "Manage Jobs", "company"),
    ("system.admin", "System Administration", "system"),
    ("system.view_telemetry", "View Telemetry", "system"),
    ("system.view_analytics", "View Analytics", "system"),
    ("governance.workflows.view", "View Governance Workflows", "governance"),
    ("governance.workflows.manage", "Manage Governance Workflows", "governance"),
    ("governance.policies.approve", "Approve Policies", "governance"),
]

PREDEFINED_ROLES = {
    "SYSTEM_ADMIN": {
        "name": "System Admin",
        "description": "Full system access",
        "is_system": True,
        "permissions": [p[0] for p in PREDEFINED_PERMISSIONS],
    },
    "INSTITUTION_ADMIN": {
        "name": "Institution Admin",
        "description": "Institution-scoped administration",
        "is_system": True,
        "permissions": [
            "institution.view", "institution.manage", "institution.manage_programs",
            "users.view", "users.create", "users.manage_roles",
            "placement.cycles.view", "governance.workflows.view",
        ],
    },
    "PLACEMENT_TEAM": {
        "name": "Placement Team",
        "description": "Manages placement operations",
        "is_system": True,
        "permissions": [
            "placement.cycles.view", "placement.cycles.manage", "placement.cycles.configure",
            "cv.templates.assign", "cv.templates.publish", "cv.templates.view",
            "applications.view_all", "applications.approve",
            "governance.workflows.view", "governance.workflows.manage", "governance.policies.approve",
            "users.view",
        ],
    },
    "PLACEMENT_ADMIN": {
        "name": "Placement Admin",
        "description": "Placement team with user management rights",
        "is_system": True,
        "permissions": [
            "placement.cycles.view", "placement.cycles.manage", "placement.cycles.configure",
            "cv.templates.assign", "cv.templates.publish", "cv.templates.view", "cv.templates.create",
            "applications.view_all", "applications.approve",
            "governance.workflows.view", "governance.workflows.manage", "governance.policies.approve",
            "users.view", "users.create", "users.manage_roles",
        ],
    },
    "CANDIDATE": {
        "name": "Student / Candidate",
        "description": "Student enrolled in a program",
        "is_system": True,
        "permissions": [
            "placement.cycles.view",
            "cv.templates.view",
            "applications.view_own", "applications.create",
        ],
    },
    "RECRUITER": {
        "name": "Recruiter",
        "description": "Company recruiter",
        "is_system": True,
        "permissions": [
            "company.view", "company.manage", "company.manage_jobs",
            "applications.view_all",
            "placement.cycles.view",
        ],
    },
    "FACULTY_OBSERVER": {
        "name": "Faculty Observer",
        "description": "Read-only governance access",
        "is_system": True,
        "permissions": [
            "placement.cycles.view",
            "applications.view_all",
            "governance.workflows.view",
        ],
    },
    "ALUMNI": {
        "name": "Alumni",
        "description": "Read-only placement cycle access",
        "is_system": True,
        "permissions": ["placement.cycles.view"],
    },
}


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()

    if "roles" not in existing_tables:
        op.create_table(
            "roles",
            Column("id", String, primary_key=True),
            Column("name", String, nullable=False),
            Column("type", String, nullable=False, server_default="PREDEFINED"),
            Column("description", String, nullable=True),
            Column("institution_id", String, nullable=True),
            Column("is_system", Boolean, server_default="false"),
            Column("created_at", DateTime, default=datetime.datetime.utcnow),
            Column("updated_at", DateTime, default=datetime.datetime.utcnow),
        )
        op.create_foreign_key("fk_roles_institution", "roles", "institutions", ["institution_id"], ["id"])

    if "permissions" not in existing_tables:
        op.create_table(
            "permissions",
            Column("id", String, primary_key=True),
            Column("code", String, nullable=False, unique=True, index=True),
            Column("name", String, nullable=False),
            Column("category", String, nullable=False),
            Column("description", String, nullable=True),
        )

    if "role_permissions" not in existing_tables:
        op.create_table(
            "role_permissions",
            Column("role_id", String, nullable=False),
            Column("permission_id", String, nullable=False),
        )
        op.create_primary_key("pk_role_permissions", "role_permissions", ["role_id", "permission_id"])
        op.create_foreign_key("fk_rp_role", "role_permissions", "roles", ["role_id"], ["id"], ondelete="CASCADE")
        op.create_foreign_key("fk_rp_permission", "role_permissions", "permissions", ["permission_id"], ["id"], ondelete="CASCADE")

    if "user_role_assignments" not in existing_tables:
        op.create_table(
            "user_role_assignments",
            Column("id", String, primary_key=True),
            Column("user_id", String, nullable=False, index=True),
            Column("role_id", String, nullable=False, index=True),
            Column("institution_id", String, nullable=True),
            Column("company_id", String, nullable=True),
            Column("program_id", String, nullable=True),
            Column("granted_by", String, nullable=True),
            Column("granted_at", DateTime, default=datetime.datetime.utcnow),
            Column("expires_at", DateTime, nullable=True),
            Column("is_active", Boolean, server_default="true"),
        )
        op.create_foreign_key("fk_ura_user", "user_role_assignments", "users", ["user_id"], ["id"], ondelete="CASCADE")
        op.create_foreign_key("fk_ura_role", "user_role_assignments", "roles", ["role_id"], ["id"], ondelete="CASCADE")
        op.create_foreign_key("fk_ura_inst", "user_role_assignments", "institutions", ["institution_id"], ["id"])
        op.create_foreign_key("fk_ura_comp", "user_role_assignments", "companies", ["company_id"], ["id"])
        op.create_foreign_key("fk_ura_prog", "user_role_assignments", "programs", ["program_id"], ["id"])
        op.create_foreign_key("fk_ura_granter", "user_role_assignments", "users", ["granted_by"], ["id"])

    # Seed permissions
    now = datetime.datetime.utcnow().isoformat()
    for code, name, category in PREDEFINED_PERMISSIONS:
        perm_id = f"perm_{code.replace('.', '_')}"
        existing = conn.execute(text("SELECT 1 FROM permissions WHERE code = :c"), {"c": code}).fetchone()
        if not existing:
            conn.execute(text(
                "INSERT INTO permissions (id, code, name, category) VALUES (:id, :code, :name, :category)"
            ), {"id": perm_id, "code": code, "name": name, "category": category})

    # Seed predefined roles and link permissions
    for role_id, role_def in PREDEFINED_ROLES.items():
        existing = conn.execute(text("SELECT 1 FROM roles WHERE id = :id"), {"id": role_id}).fetchone()
        if not existing:
            conn.execute(text(
                "INSERT INTO roles (id, name, type, description, is_system, created_at, updated_at) "
                "VALUES (:id, :name, 'PREDEFINED', :desc, true, :now, :now)"
            ), {"id": role_id, "name": role_def["name"], "desc": role_def["description"], "now": now})
        for perm_code in role_def["permissions"]:
            perm_id = f"perm_{perm_code.replace('.', '_')}"
            existing_rp = conn.execute(text(
                "SELECT 1 FROM role_permissions WHERE role_id = :rid AND permission_id = :pid"
            ), {"rid": role_id, "pid": perm_id}).fetchone()
            if not existing_rp:
                conn.execute(text(
                    "INSERT INTO role_permissions (role_id, permission_id) VALUES (:rid, :pid)"
                ), {"rid": role_id, "pid": perm_id})

    # Migrate existing users to user_role_assignments
    users = conn.execute(text("SELECT id, role, institution_id, company_id, program_id FROM users WHERE role IS NOT NULL")).fetchall()
    for u in users:
        user_id, role, inst_id, comp_id, prog_id = u
        if not role:
            continue
        role_exists = conn.execute(text("SELECT 1 FROM roles WHERE id = :id"), {"id": role}).fetchone()
        if not role_exists:
            continue
        assignment_id = f"migrated_{user_id}_{role}"
        existing_a = conn.execute(text(
            "SELECT 1 FROM user_role_assignments WHERE id = :id"
        ), {"id": assignment_id}).fetchone()
        if not existing_a:
            conn.execute(text(
                "INSERT INTO user_role_assignments (id, user_id, role_id, institution_id, company_id, program_id, granted_at, is_active) "
                "VALUES (:id, :uid, :rid, :iid, :cid, :pid, :now, true)"
            ), {
                "id": assignment_id, "uid": user_id, "rid": role,
                "iid": inst_id, "cid": comp_id, "pid": prog_id, "now": now,
            })


def downgrade() -> None:
    op.drop_table("user_role_assignments")
    op.drop_table("role_permissions")
    op.drop_table("permissions")
    op.drop_table("roles")
