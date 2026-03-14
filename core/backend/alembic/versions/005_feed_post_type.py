"""Add post_type to feed_posts."""
from alembic import op
import sqlalchemy as sa


revision = "005_feed_post_type"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "feed_posts" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("feed_posts")]
        if "post_type" not in cols:
            op.add_column("feed_posts", sa.Column("post_type", sa.String(64), nullable=True))


def downgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "feed_posts" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("feed_posts")]
        if "post_type" in cols:
            op.drop_column("feed_posts", "post_type")
