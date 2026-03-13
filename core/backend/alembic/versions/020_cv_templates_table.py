"""Create cv_templates table for CV template storage.

Revision ID: 020
Revises: 019
Create Date: 2026-03-08

Required for CV creation - _ensure_template_in_db checks/inserts into cv_templates.
Seed with: docker compose exec backend python /products/cv/backend/scripts/seed_json_templates.py
"""
from alembic import op
import sqlalchemy as sa

revision = "020"
down_revision = "019"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "cv_templates" not in tables:
        op.create_table(
            "cv_templates",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("institution_id", sa.String(), nullable=True),
            sa.Column("status", sa.String(), nullable=True, server_default="PUBLISHED"),
            sa.Column("config", sa.JSON(), nullable=True),
            sa.Column("college_slug", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["institution_id"], ["institutions.id"], ondelete="SET NULL"),
        )
        op.create_index("ix_cv_templates_institution_id", "cv_templates", ["institution_id"])
        op.create_index("ix_cv_templates_college_slug", "cv_templates", ["college_slug"])


def downgrade():
    op.drop_index("ix_cv_templates_college_slug", table_name="cv_templates")
    op.drop_index("ix_cv_templates_institution_id", table_name="cv_templates")
    op.drop_table("cv_templates")
