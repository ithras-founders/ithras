"""Posts: is_pinned, pinned_at for community feed.

Revision ID: 014_posts_pinned
Revises: 013_telemetry_tables
Create Date: 2025-03-18

"""
from alembic import op

revision = "014_posts_pinned"
down_revision = "013_telemetry_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false")
    op.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP")
    op.execute("CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON posts(is_pinned) WHERE is_pinned = true")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_posts_is_pinned")
    op.execute("ALTER TABLE posts DROP COLUMN IF EXISTS pinned_at")
    op.execute("ALTER TABLE posts DROP COLUMN IF EXISTS is_pinned")
