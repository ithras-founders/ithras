"""Add last_active_at and trust_score to users for feed activity and Trust Score.

Revision ID: 024
Revises: 023
Create Date: 2026-03-08

"""
from alembic import op
import sqlalchemy as sa


revision = "024"
down_revision = "023"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    cols = [c["name"] for c in inspector.get_columns("users")] if "users" in tables else []

    if "users" in tables and "last_active_at" not in cols:
        op.add_column("users", sa.Column("last_active_at", sa.DateTime(), nullable=True))

    if "users" in tables and "trust_score" not in cols:
        op.add_column("users", sa.Column("trust_score", sa.Float(), nullable=True))


def downgrade():
    op.drop_column("users", "trust_score")
    op.drop_column("users", "last_active_at")
