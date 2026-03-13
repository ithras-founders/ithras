"""Add job_profiles table for HR Mode.

Revision ID: 026
Revises: 025
Create Date: 2026-03-08

"""
from alembic import op
import sqlalchemy as sa


revision = "026"
down_revision = "025"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "job_profiles" not in tables:
        op.create_table(
            "job_profiles",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("company_id", sa.String(), nullable=False, index=True),
            sa.Column("created_by", sa.String(), nullable=False, index=True),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("jd_text", sa.Text(), nullable=True),
            sa.Column("sector", sa.String(), nullable=True),
            sa.Column("min_cgpa", sa.Float(), nullable=True),
            sa.Column("max_backlogs", sa.Integer(), nullable=True),
            sa.Column("skills_keywords", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("experience_years_min", sa.Integer(), nullable=True),
            sa.Column("institution_ids", sa.JSON(), nullable=True),
            sa.Column("program_ids", sa.JSON(), nullable=True),
            sa.Column("status", sa.String(), nullable=False, server_default="DRAFT"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="CASCADE"),
        )


def downgrade():
    op.drop_table("job_profiles")
