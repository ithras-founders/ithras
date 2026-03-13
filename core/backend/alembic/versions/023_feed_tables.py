"""Add feed_posts, feed_likes, feed_comments tables for social feed.

Revision ID: 023
Revises: 022
Create Date: 2026-03-08

"""
from alembic import op
import sqlalchemy as sa


revision = "023"
down_revision = "022"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "feed_posts" not in tables:
        op.create_table(
            "feed_posts",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("author_id", sa.String(), nullable=False, index=True),
            sa.Column("text", sa.Text(), nullable=False, server_default=""),
            sa.Column("image_urls", sa.JSON(), nullable=True, server_default="[]"),
            sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
        )
        op.create_index("ix_feed_posts_created_at", "feed_posts", ["created_at"])

    if "feed_likes" not in tables:
        op.create_table(
            "feed_likes",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("post_id", sa.String(), nullable=False, index=True),
            sa.Column("user_id", sa.String(), nullable=False, index=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["post_id"], ["feed_posts.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.UniqueConstraint("post_id", "user_id", name="uq_feed_likes_post_user"),
        )

    if "feed_comments" not in tables:
        op.create_table(
            "feed_comments",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("post_id", sa.String(), nullable=False, index=True),
            sa.Column("author_id", sa.String(), nullable=False, index=True),
            sa.Column("text", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["post_id"], ["feed_posts.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
        )


def downgrade():
    op.drop_table("feed_comments")
    op.drop_table("feed_likes")
    op.drop_index("ix_feed_posts_created_at", table_name="feed_posts")
    op.drop_table("feed_posts")
