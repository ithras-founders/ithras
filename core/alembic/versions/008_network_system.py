"""Network system: user_connections, user_follows.

Revision ID: 008_network_system
Revises: 007_feed_system
Create Date: 2025-03

"""
from alembic import op

revision = "008_network_system"
down_revision = "007_feed_system"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── user_connections: mutual professional relationships ──────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS user_connections (
            id SERIAL PRIMARY KEY,
            requester_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            recipient_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(requester_id, recipient_id),
            CHECK (requester_id != recipient_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_user_connections_requester ON user_connections(requester_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_user_connections_recipient ON user_connections(recipient_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_user_connections_recipient_status ON user_connections(recipient_id, status)")

    # ─── user_follows: asymmetric follow ──────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS user_follows (
            id SERIAL PRIMARY KEY,
            follower_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            following_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(follower_id, following_id),
            CHECK (follower_id != following_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS user_follows CASCADE")
    op.execute("DROP TABLE IF EXISTS user_connections CASCADE")
