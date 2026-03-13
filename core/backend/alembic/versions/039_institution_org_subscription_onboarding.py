"""Add onboarding_status and features to institutions, onboarding_status to companies.

Revision ID: 039
Revises: 038
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa


revision = "039"
down_revision = "038"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    if "institutions" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("institutions")]
        if "onboarding_status" not in cols:
            op.add_column(
                "institutions",
                sa.Column("onboarding_status", sa.String(), nullable=True),
            )
            op.execute(
                sa.text("UPDATE institutions SET onboarding_status = 'FULLY_ONBOARDED' WHERE onboarding_status IS NULL")
            )
            op.alter_column(
                "institutions",
                "onboarding_status",
                existing_type=sa.String(),
                nullable=False,
                server_default="FULLY_ONBOARDED",
            )
        if "features" not in cols:
            op.add_column(
                "institutions",
                sa.Column("features", sa.JSON(), nullable=True, server_default="[]"),
            )
            op.alter_column(
                "institutions",
                "features",
                existing_type=sa.JSON(),
                nullable=False,
            )

    if "companies" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("companies")]
        if "onboarding_status" not in cols:
            op.add_column(
                "companies",
                sa.Column("onboarding_status", sa.String(), nullable=True),
            )
            op.execute(
                sa.text("UPDATE companies SET onboarding_status = 'ONBOARDED' WHERE onboarding_status IS NULL")
            )
            op.alter_column(
                "companies",
                "onboarding_status",
                existing_type=sa.String(),
                nullable=False,
                server_default="ONBOARDED",
            )


def downgrade():
    op.drop_column("institutions", "features")
    op.drop_column("institutions", "onboarding_status")
    op.drop_column("companies", "onboarding_status")
