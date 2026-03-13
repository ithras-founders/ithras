"""Add email_hidden to users (contact preferences).

Revision ID: 042
Revises: 041
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa


revision = "042"
down_revision = "041"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "users" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("users")]
        if "email_hidden" not in cols:
            op.add_column(
                "users",
                sa.Column("email_hidden", sa.Boolean(), nullable=False, server_default="false"),
            )


def downgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "users" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("users")]
        if "email_hidden" in cols:
            op.drop_column("users", "email_hidden")
