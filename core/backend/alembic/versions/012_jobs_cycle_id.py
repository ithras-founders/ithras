"""Add cycle_id to jobs table for cycle-job linkage.

Revision ID: 012
Revises: 011
Create Date: 2026-03-03

"""
from alembic import op
import sqlalchemy as sa


revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("jobs")]
    if "cycle_id" not in cols:
        op.add_column("jobs", sa.Column("cycle_id", sa.String(), nullable=True))
        op.create_foreign_key("fk_jobs_cycle", "jobs", "cycles", ["cycle_id"], ["id"], ondelete="SET NULL")
        op.create_index("ix_jobs_cycle_id", "jobs", ["cycle_id"])


def downgrade():
    op.drop_index("ix_jobs_cycle_id", table_name="jobs")
    op.drop_constraint("fk_jobs_cycle", "jobs", type_="foreignkey")
    op.drop_column("jobs", "cycle_id")
