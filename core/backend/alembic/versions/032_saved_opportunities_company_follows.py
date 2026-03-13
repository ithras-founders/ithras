"""Add saved_opportunities and company_follows tables.

Revision ID: 032
Revises: 031
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa


revision = "032"
down_revision = "031"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "saved_opportunities" not in tables:
        op.create_table(
            "saved_opportunities",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), nullable=False, index=True),
            sa.Column("job_id", sa.String(), nullable=False, index=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
            sa.UniqueConstraint("user_id", "job_id", name="uq_saved_opportunity_user_job"),
        )

    if "company_follows" not in tables:
        op.create_table(
            "company_follows",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), nullable=False, index=True),
            sa.Column("company_id", sa.String(), nullable=False, index=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
            sa.UniqueConstraint("user_id", "company_id", name="uq_company_follow_user_company"),
        )


def downgrade():
    op.drop_table("company_follows")
    op.drop_table("saved_opportunities")
