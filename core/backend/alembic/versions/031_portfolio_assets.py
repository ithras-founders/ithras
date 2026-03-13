"""Add portfolio_assets table for CV domain.

Revision ID: 031
Revises: 030
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa


revision = "031"
down_revision = "030"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "portfolio_assets" not in tables:
        op.create_table(
            "portfolio_assets",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), nullable=False, index=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("asset_type", sa.String(), nullable=False),
            sa.Column("url", sa.String(), nullable=True),
            sa.Column("file_path", sa.String(), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        )


def downgrade():
    op.drop_table("portfolio_assets")
