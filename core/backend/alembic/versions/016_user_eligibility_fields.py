"""Add cgpa, placement_status, backlog_count to users for eligibility.

Revision ID: 016
Revises: 015
Create Date: 2026-03-03

"""
from alembic import op
import sqlalchemy as sa


revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("users")]
    if "cgpa" not in cols:
        op.add_column("users", sa.Column("cgpa", sa.Float(), nullable=True))
    if "placement_status" not in cols:
        op.add_column("users", sa.Column("placement_status", sa.String(), nullable=True))
    if "backlog_count" not in cols:
        op.add_column("users", sa.Column("backlog_count", sa.Integer(), nullable=True, server_default="0"))


def downgrade():
    op.drop_column("users", "cgpa")
    op.drop_column("users", "placement_status")
    op.drop_column("users", "backlog_count")
