"""Channel creation requests from members (admin approval).

Revision ID: 020_channel_requests
Revises: 019_merge_post_polls_longform
Create Date: 2026-03-21

"""
from alembic import op

revision = "020_channel_requests"
down_revision = "019_merge_post_polls_longform"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS channel_requests (
            id SERIAL PRIMARY KEY,
            community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_channel_requests_community ON channel_requests(community_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_channel_requests_status ON channel_requests(status)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS channel_requests CASCADE")
