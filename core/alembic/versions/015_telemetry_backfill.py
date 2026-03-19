"""Backfill telemetry_events from posts and community_members.

Revision ID: 015_telemetry_backfill
Revises: 014_posts_pinned
Create Date: 2025-03-18

"""
from alembic import op

revision = "015_telemetry_backfill"
down_revision = "014_posts_pinned"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Backfill post_created events from posts.
    # Use only domain, event_type, created_at for compatibility with minimal schema.
    # Idempotent: skip if any post_created events already exist.
    op.execute("""
        INSERT INTO telemetry_events (domain, event_type, created_at)
        SELECT 'feed', 'post_created', p.created_at
        FROM posts p
        WHERE NOT EXISTS (
            SELECT 1 FROM telemetry_events te
            WHERE te.domain = 'feed' AND te.event_type = 'post_created'
        )
    """)

    # Backfill community join events from community_members.
    op.execute("""
        INSERT INTO telemetry_events (domain, event_type, created_at)
        SELECT 'community', 'join', cm.created_at
        FROM community_members cm
        WHERE NOT EXISTS (
            SELECT 1 FROM telemetry_events te
            WHERE te.domain = 'community' AND te.event_type = 'join'
        )
    """)


def downgrade() -> None:
    # Backfill data is retained; no-op downgrade (deleting would risk removing live events)
    pass
