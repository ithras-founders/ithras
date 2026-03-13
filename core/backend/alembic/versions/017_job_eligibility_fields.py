"""Add min_cgpa, max_backlogs to jobs for eligibility.

Revision ID: 017
Revises: 016
Create Date: 2026-03-03

"""
from alembic import op
import sqlalchemy as sa


revision = "017"
down_revision = "016"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("jobs")]
    if "min_cgpa" not in cols:
        op.add_column("jobs", sa.Column("min_cgpa", sa.Float(), nullable=True))
    if "max_backlogs" not in cols:
        op.add_column("jobs", sa.Column("max_backlogs", sa.Integer(), nullable=True))


def downgrade():
    op.drop_column("jobs", "min_cgpa")
    op.drop_column("jobs", "max_backlogs")
