"""Add user_follows table for My Network feature.

Revision ID: 025
Revises: 024
Create Date: 2026-03-08

"""
from alembic import op
import sqlalchemy as sa


revision = "025"
down_revision = "024"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "user_follows" not in tables:
        op.create_table(
            "user_follows",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("follower_id", sa.String(), nullable=False, index=True),
            sa.Column("following_id", sa.String(), nullable=False, index=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["follower_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["following_id"], ["users.id"], ondelete="CASCADE"),
            sa.UniqueConstraint("follower_id", "following_id", name="uq_user_follows_follower_following"),
        )


def downgrade():
    op.drop_table("user_follows")
