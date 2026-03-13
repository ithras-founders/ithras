"""Add allowed_roles to institutions and companies.

Revision ID: 040
Revises: 039
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa


revision = "040"
down_revision = "039"
branch_labels = None
depends_on = None

DEFAULT_INSTITUTION_ROLES = '["CANDIDATE","PLACEMENT_TEAM","PLACEMENT_ADMIN","INSTITUTION_ADMIN","FACULTY_OBSERVER","ALUMNI"]'
DEFAULT_COMPANY_ROLES = '["RECRUITER"]'


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    dialect = getattr(conn.dialect, "name", "postgresql")
    json_cast = "::jsonb" if dialect == "postgresql" else ""

    if "institutions" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("institutions")]
        if "allowed_roles" not in cols:
            op.add_column(
                "institutions",
                sa.Column("allowed_roles", sa.JSON(), nullable=True),
            )
            op.execute(
                sa.text(f"UPDATE institutions SET allowed_roles = '{DEFAULT_INSTITUTION_ROLES}'{json_cast} WHERE allowed_roles IS NULL")
            )
            op.alter_column(
                "institutions",
                "allowed_roles",
                existing_type=sa.JSON(),
                nullable=False,
            )

    if "companies" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("companies")]
        if "allowed_roles" not in cols:
            op.add_column(
                "companies",
                sa.Column("allowed_roles", sa.JSON(), nullable=True),
            )
            op.execute(
                sa.text(f"UPDATE companies SET allowed_roles = '{DEFAULT_COMPANY_ROLES}'{json_cast} WHERE allowed_roles IS NULL")
            )
            op.alter_column(
                "companies",
                "allowed_roles",
                existing_type=sa.JSON(),
                nullable=False,
            )


def downgrade():
    op.drop_column("institutions", "allowed_roles")
    op.drop_column("companies", "allowed_roles")
