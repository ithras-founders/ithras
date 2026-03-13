"""Add institution_id to cycles, jobs, and workflow_templates for multi-institution scoping.

Revision ID: 019
Revises: 018
Create Date: 2026-03-03
"""
from alembic import op
import sqlalchemy as sa

revision = "019"
down_revision = "018"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # cycles.institution_id
    cols = [c["name"] for c in inspector.get_columns("cycles")]
    if "institution_id" not in cols:
        op.add_column("cycles", sa.Column("institution_id", sa.String(), nullable=True))
        op.create_index("ix_cycles_institution_id", "cycles", ["institution_id"])
        op.create_foreign_key("fk_cycles_institution_id", "cycles", "institutions", ["institution_id"], ["id"])

    # jobs.institution_id
    cols = [c["name"] for c in inspector.get_columns("jobs")]
    if "institution_id" not in cols:
        op.add_column("jobs", sa.Column("institution_id", sa.String(), nullable=True))
        op.create_index("ix_jobs_institution_id", "jobs", ["institution_id"])
        op.create_foreign_key("fk_jobs_institution_id", "jobs", "institutions", ["institution_id"], ["id"])

    # workflow_templates.institution_id
    cols = [c["name"] for c in inspector.get_columns("workflow_templates")]
    if "institution_id" not in cols:
        op.add_column("workflow_templates", sa.Column("institution_id", sa.String(), nullable=True))
        op.create_index("ix_workflow_templates_institution_id", "workflow_templates", ["institution_id"])
        op.create_foreign_key("fk_workflow_templates_institution_id", "workflow_templates", "institutions", ["institution_id"], ["id"])


def downgrade():
    op.drop_constraint("fk_workflow_templates_institution_id", "workflow_templates", type_="foreignkey")
    op.drop_index("ix_workflow_templates_institution_id", "workflow_templates")
    op.drop_column("workflow_templates", "institution_id")

    op.drop_constraint("fk_jobs_institution_id", "jobs", type_="foreignkey")
    op.drop_index("ix_jobs_institution_id", "jobs")
    op.drop_column("jobs", "institution_id")

    op.drop_constraint("fk_cycles_institution_id", "cycles", type_="foreignkey")
    op.drop_index("ix_cycles_institution_id", "cycles")
    op.drop_column("cycles", "institution_id")
