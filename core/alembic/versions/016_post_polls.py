"""Post polls: options JSON + vote rows.

Revision ID: 016_post_polls
Revises: 015_telemetry_backfill
"""
from alembic import op

revision = "016_post_polls"
down_revision = "015_telemetry_backfill"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS poll_options_json TEXT DEFAULT NULL")
    op.execute("""
        CREATE TABLE IF NOT EXISTS post_poll_votes (
            id SERIAL PRIMARY KEY,
            post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            option_index INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(post_id, user_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_post_poll_votes_post ON post_poll_votes(post_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_post_poll_votes_post")
    op.execute("DROP TABLE IF EXISTS post_poll_votes CASCADE")
    op.execute("ALTER TABLE posts DROP COLUMN IF EXISTS poll_options_json")
