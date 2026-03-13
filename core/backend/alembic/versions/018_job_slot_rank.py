"""Add slot_rank to jobs for Day 0 / Day 1 ordering.

Revision ID: 018
Revises: 017
Create Date: 2026-03-03

"""
from alembic import op
import sqlalchemy as sa


revision = "018"
down_revision = "017"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("jobs")]
    if "slot_rank" not in cols:
        op.add_column("jobs", sa.Column("slot_rank", sa.Integer(), nullable=True))


def downgrade():
    op.drop_column("jobs", "slot_rank")
