"""Add conversations, conversation_participants, messages tables.

Revision ID: 038
Revises: 037
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa


revision = "038"
down_revision = "037"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "conversations" not in tables:
        op.create_table(
            "conversations",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("conversation_type", sa.String(), server_default="DIRECT", nullable=False),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
        )

    if "conversation_participants" not in tables:
        op.create_table(
            "conversation_participants",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("conversation_id", sa.String(), nullable=False, index=True),
            sa.Column("user_id", sa.String(), nullable=False, index=True),
            sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        )

    if "messages" not in tables:
        op.create_table(
            "messages",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("conversation_id", sa.String(), nullable=False, index=True),
            sa.Column("sender_id", sa.String(), nullable=False, index=True),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("is_read", sa.Boolean(), server_default="false", nullable=False),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
            sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
        )


def downgrade():
    op.drop_table("messages")
    op.drop_table("conversation_participants")
    op.drop_table("conversations")
