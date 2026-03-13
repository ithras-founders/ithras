"""Add workflow_templates and workflow_template_stages tables.

Revision ID: 008
Revises: 007
Create Date: 2026-03-03
"""
from alembic import op
import sqlalchemy as sa


revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "workflow_templates" not in tables:
        op.create_table(
            "workflow_templates",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("description", sa.String(), nullable=True),
            sa.Column("template_type", sa.String(), nullable=False, server_default="PLACEMENT_CYCLE"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )

    if "workflow_template_stages" not in tables:
        op.create_table(
            "workflow_template_stages",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("template_id", sa.String(), nullable=False),
            sa.Column("stage_number", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("description", sa.String(), nullable=True),
            sa.Column("stage_type", sa.String(), nullable=False, server_default="APPLICATION"),
            sa.Column("is_approval_required", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["template_id"], ["workflow_templates.id"], ondelete="CASCADE"),
        )
        op.create_index("ix_wft_stages_template_id", "workflow_template_stages", ["template_id"])


def downgrade():
    op.drop_index("ix_wft_stages_template_id", table_name="workflow_template_stages")
    op.drop_table("workflow_template_stages")
    op.drop_table("workflow_templates")
