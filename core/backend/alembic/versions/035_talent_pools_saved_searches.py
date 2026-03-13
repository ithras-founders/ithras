"""Add talent_pools, talent_pool_members, saved_searches tables.

Revision ID: 035
Revises: 034
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa


revision = "035"
down_revision = "034"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "talent_pools" not in tables:
        op.create_table(
            "talent_pools",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("company_id", sa.String(), nullable=False, index=True),
            sa.Column("created_by", sa.String(), nullable=False, index=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="CASCADE"),
        )

    if "talent_pool_members" not in tables:
        op.create_table(
            "talent_pool_members",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("pool_id", sa.String(), nullable=False, index=True),
            sa.Column("candidate_id", sa.String(), nullable=False, index=True),
            sa.Column("added_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
            sa.ForeignKeyConstraint(["pool_id"], ["talent_pools.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["candidate_id"], ["users.id"], ondelete="CASCADE"),
        )

    if "saved_searches" not in tables:
        op.create_table(
            "saved_searches",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("company_id", sa.String(), nullable=False, index=True),
            sa.Column("created_by", sa.String(), nullable=False, index=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("criteria", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="CASCADE"),
        )


def downgrade():
    op.drop_table("saved_searches")
    op.drop_table("talent_pool_members")
    op.drop_table("talent_pools")
