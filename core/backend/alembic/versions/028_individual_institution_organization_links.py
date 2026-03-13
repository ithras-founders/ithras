"""Add business_units, individual_institution_links, individual_organization_links.

Individual-Institution-Organization relationship model:
- business_units: org subdivision (Engineering, Product, Sales)
- individual_institution_links: time-bound (user, institution, program/degree, role, batch)
- individual_organization_links: time-bound (user, company, business_unit, role)

Alumni = end_date IS NOT NULL AND end_date < now()

Revision ID: 028
Revises: 027
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


revision = "028"
down_revision = "027"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "business_units" not in tables:
        op.create_table(
            "business_units",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("company_id", sa.String(), nullable=False, index=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("code", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        )

    if "individual_institution_links" not in tables:
        op.create_table(
            "individual_institution_links",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), nullable=False, index=True),
            sa.Column("institution_id", sa.String(), nullable=True, index=True),
            sa.Column("program_id", sa.String(), nullable=True, index=True),
            sa.Column("role_id", sa.String(), nullable=False, index=True),
            sa.Column("start_date", sa.DateTime(), nullable=False),
            sa.Column("end_date", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["institution_id"], ["institutions.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["program_id"], ["programs.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        )

    if "individual_organization_links" not in tables:
        op.create_table(
            "individual_organization_links",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), nullable=False, index=True),
            sa.Column("company_id", sa.String(), nullable=False, index=True),
            sa.Column("business_unit_id", sa.String(), nullable=True, index=True),
            sa.Column("role_id", sa.String(), nullable=False, index=True),
            sa.Column("start_date", sa.DateTime(), nullable=False),
            sa.Column("end_date", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["business_unit_id"], ["business_units.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        )

    # Phase 2: Populate from User and UserRoleAssignment
    _populate_links_from_existing_data(conn)


def _populate_links_from_existing_data(conn):
    """Migrate User (institution_id, program_id, role) and UserRoleAssignment into links."""
    import uuid

    now = sa.text("NOW()")

    # 1. From User: institution_id, program_id, role (for institution context)
    users_with_inst = conn.execute(text("""
        SELECT id, institution_id, program_id, role
        FROM users
        WHERE institution_id IS NOT NULL AND role IS NOT NULL
    """)).fetchall()
    for u in users_with_inst:
        user_id, inst_id, prog_id, role = u
        if not role:
            continue
        role_exists = conn.execute(text("SELECT 1 FROM roles WHERE id = :rid"), {"rid": role}).fetchone()
        if not role_exists:
            continue
        link_id = f"mig_u_inst_{user_id[:8]}_{uuid.uuid4().hex[:12]}"
        existing = conn.execute(text("SELECT 1 FROM individual_institution_links WHERE id = :id"), {"id": link_id}).fetchone()
        if not existing:
            conn.execute(text("""
                INSERT INTO individual_institution_links
                (id, user_id, institution_id, program_id, role_id, start_date, end_date, created_at)
                VALUES (:id, :uid, :iid, :pid, :rid, NOW(), NULL, NOW())
            """), {"id": link_id, "uid": user_id, "iid": inst_id, "pid": prog_id or None, "rid": role})

    # 2. From User: company_id, role (for organization context)
    users_with_comp = conn.execute(text("""
        SELECT id, company_id, role
        FROM users
        WHERE company_id IS NOT NULL AND role IS NOT NULL
    """)).fetchall()
    for u in users_with_comp:
        user_id, comp_id, role = u
        if not role:
            continue
        role_exists = conn.execute(text("SELECT 1 FROM roles WHERE id = :rid"), {"rid": role}).fetchone()
        if not role_exists:
            continue
        link_id = f"mig_u_org_{user_id[:8]}_{uuid.uuid4().hex[:12]}"
        existing = conn.execute(text("SELECT 1 FROM individual_organization_links WHERE id = :id"), {"id": link_id}).fetchone()
        if not existing:
            conn.execute(text("""
                INSERT INTO individual_organization_links
                (id, user_id, company_id, business_unit_id, role_id, start_date, end_date, created_at)
                VALUES (:id, :uid, :cid, NULL, :rid, NOW(), NULL, NOW())
            """), {"id": link_id, "uid": user_id, "cid": comp_id, "rid": role})

    # 3. From UserRoleAssignment (institution context - includes general users with institution_id NULL)
    ura_inst = conn.execute(text("""
        SELECT id, user_id, institution_id, company_id, program_id, role_id, granted_at, expires_at
        FROM user_role_assignments
        WHERE is_active = true AND (institution_id IS NOT NULL OR (institution_id IS NULL AND company_id IS NULL))
    """)).fetchall()
    for row in ura_inst:
        ura_id, uid, iid, cid, pid, rid, granted_at, expires_at = row
        link_id = f"mig_ura_inst_{ura_id[:16]}_{uuid.uuid4().hex[:8]}"
        existing = conn.execute(text("SELECT 1 FROM individual_institution_links WHERE id = :id"), {"id": link_id}).fetchone()
        if not existing:
            conn.execute(text("""
                INSERT INTO individual_institution_links
                (id, user_id, institution_id, program_id, role_id, start_date, end_date, created_at)
                VALUES (:id, :uid, :iid, :pid, :rid, COALESCE(:start, NOW()), :end, NOW())
            """), {"id": link_id, "uid": uid, "iid": iid, "pid": pid or None, "rid": rid, "start": granted_at, "end": expires_at})

    # 4. From UserRoleAssignment (organization context)
    ura_org = conn.execute(text("""
        SELECT id, user_id, company_id, role_id, granted_at, expires_at
        FROM user_role_assignments
        WHERE is_active = true AND company_id IS NOT NULL
    """)).fetchall()
    for row in ura_org:
        ura_id, uid, cid, rid, granted_at, expires_at = row
        link_id = f"mig_ura_org_{ura_id[:16]}_{uuid.uuid4().hex[:8]}"
        existing = conn.execute(text("SELECT 1 FROM individual_organization_links WHERE id = :id"), {"id": link_id}).fetchone()
        if not existing:
            conn.execute(text("""
                INSERT INTO individual_organization_links
                (id, user_id, company_id, business_unit_id, role_id, start_date, end_date, created_at)
                VALUES (:id, :uid, :cid, NULL, :rid, COALESCE(:start, NOW()), :end, NOW())
            """), {"id": link_id, "uid": uid, "cid": cid, "rid": rid, "start": granted_at, "end": expires_at})


def downgrade():
    op.drop_table("individual_organization_links")
    op.drop_table("individual_institution_links")
    op.drop_table("business_units")
