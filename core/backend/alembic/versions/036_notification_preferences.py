"""Add notification_preferences table.

Revision ID: 036
Revises: 035
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa


revision = "036"
down_revision = "035"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "notification_preferences" not in tables:
        op.create_table(
            "notification_preferences",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), nullable=False, index=True),
            sa.Column("channel", sa.String(), nullable=False, server_default="in_app"),
            sa.Column("notification_type", sa.String(), nullable=True),
            sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        )
        op.create_index("ix_notif_prefs_user_channel", "notification_preferences", ["user_id", "channel", "notification_type"], unique=False)


def downgrade():
    op.drop_index("ix_notif_prefs_user_channel", table_name="notification_preferences")
    op.drop_table("notification_preferences")
