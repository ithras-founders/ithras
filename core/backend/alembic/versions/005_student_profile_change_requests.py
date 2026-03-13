"""Add roll_number and student profile change request table.

Revision ID: 005
Revises: 004
Create Date: 2026-03-03
"""
from alembic import op
import sqlalchemy as sa


revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    user_columns = [col["name"] for col in inspector.get_columns("users")]
    if "roll_number" not in user_columns:
        op.add_column("users", sa.Column("roll_number", sa.String(), nullable=True))

    tables = inspector.get_table_names()
    if "user_profile_change_requests" not in tables:
        op.create_table(
            "user_profile_change_requests",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("institution_id", sa.String(), nullable=True),
            sa.Column("requested_by", sa.String(), nullable=False),
            sa.Column("requested_changes", sa.JSON(), nullable=True),
            sa.Column("status", sa.String(), nullable=False, server_default="PENDING"),
            sa.Column("reviewed_by", sa.String(), nullable=True),
            sa.Column("reviewed_at", sa.DateTime(), nullable=True),
            sa.Column("rejection_reason", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_upcr_user"),
            sa.ForeignKeyConstraint(["institution_id"], ["institutions.id"], name="fk_upcr_institution"),
            sa.ForeignKeyConstraint(["requested_by"], ["users.id"], name="fk_upcr_requested_by"),
            sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"], name="fk_upcr_reviewed_by"),
        )
        op.create_index("ix_upcr_user_id", "user_profile_change_requests", ["user_id"])
        op.create_index("ix_upcr_institution_id", "user_profile_change_requests", ["institution_id"])
        op.create_index("ix_upcr_requested_by", "user_profile_change_requests", ["requested_by"])
        op.create_index("ix_upcr_status", "user_profile_change_requests", ["status"])


def downgrade() -> None:
    op.drop_index("ix_upcr_status", table_name="user_profile_change_requests")
    op.drop_index("ix_upcr_requested_by", table_name="user_profile_change_requests")
    op.drop_index("ix_upcr_institution_id", table_name="user_profile_change_requests")
    op.drop_index("ix_upcr_user_id", table_name="user_profile_change_requests")
    op.drop_table("user_profile_change_requests")
    op.drop_column("users", "roll_number")
