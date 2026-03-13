"""Add cv_template_visibility_overrides table for per-template visibility settings.

Overrides institution_ids, batch_ids, program_ids from JSON templates.
Empty = visible to all. When present, replaces template values during allocation.

Revision ID: 044
Revises: 043
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa

revision = "044"
down_revision = "043"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "cv_template_visibility_overrides" not in tables:
        op.create_table(
            "cv_template_visibility_overrides",
            sa.Column("template_id", sa.String(), primary_key=True),
            sa.Column("institution_ids", sa.JSON(), nullable=True),
            sa.Column("batch_ids", sa.JSON(), nullable=True),
            sa.Column("program_ids", sa.JSON(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True, server_default=sa.text("NOW()")),
        )


def downgrade():
    op.drop_table("cv_template_visibility_overrides")
