"""Add designations, functions (org), degrees_offered, certifications_offered (institution), and institution about fields.

Supports LinkedIn-style About pages for institutions and organizations:
- Companies: Business Units (existing), Designations (job levels), Functions (departments)
- Institutions: Degrees offered, Certifications offered, About info

Revision ID: 043
Revises: 042
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa


revision = "043"
down_revision = "042"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # Institution about fields
    if "institutions" in tables:
        cols = [c["name"] for c in inspector.get_columns("institutions")]
        for col, typ in [
            ("about", sa.Text()),
            ("website", sa.String()),
            ("founding_year", sa.Integer()),
            ("student_count_range", sa.String()),  # e.g. "1,001-5,000"
        ]:
            if col not in cols:
                op.add_column("institutions", sa.Column(col, typ, nullable=True))

    # Company functions (department/functional area: Engineering, Sales, Finance)
    if "company_functions" not in tables:
        op.create_table(
            "company_functions",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("company_id", sa.String(), nullable=False, index=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("code", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        )

    # Company designations (job levels/titles: Associate, Manager, VP)
    if "company_designations" not in tables:
        op.create_table(
            "company_designations",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("company_id", sa.String(), nullable=False, index=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("level", sa.Integer(), nullable=True),  # sort order / hierarchy
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        )

    # Institution degrees offered (distinct from programs - e.g. B.Tech, MBA, PhD)
    if "institution_degrees" not in tables:
        op.create_table(
            "institution_degrees",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("institution_id", sa.String(), nullable=False, index=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("degree_type", sa.String(), nullable=True),  # UG, PG, PhD, DIPLOMA, CERTIFICATE
            sa.Column("program_id", sa.String(), nullable=True, index=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["institution_id"], ["institutions.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["program_id"], ["programs.id"], ondelete="SET NULL"),
        )

    # Institution certifications offered
    if "institution_certifications" not in tables:
        op.create_table(
            "institution_certifications",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("institution_id", sa.String(), nullable=False, index=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("issuing_body", sa.String(), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["institution_id"], ["institutions.id"], ondelete="CASCADE"),
        )


def downgrade():
    op.drop_table("institution_certifications")
    op.drop_table("institution_degrees")
    op.drop_table("company_designations")
    op.drop_table("company_functions")
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "institutions" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("institutions")]
        for col in ["about", "website", "founding_year", "student_count_range"]:
            if col in cols:
                op.drop_column("institutions", col)
