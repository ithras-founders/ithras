"""LongForm: publications, posts, subscriptions, stars.

Revision ID: 018_longform_system
Revises: 017_user_account_status
"""
from alembic import op

revision = "018_longform_system"
down_revision = "017_user_account_status"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS longform_publications (
            id SERIAL PRIMARY KEY,
            owner_user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            slug VARCHAR(128) UNIQUE NOT NULL,
            title VARCHAR(512) NOT NULL,
            tagline VARCHAR(512),
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_longform_publications_owner ON longform_publications(owner_user_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS longform_posts (
            id SERIAL PRIMARY KEY,
            publication_id INTEGER NOT NULL REFERENCES longform_publications(id) ON DELETE CASCADE,
            slug VARCHAR(160) NOT NULL,
            title VARCHAR(512) NOT NULL,
            subtitle VARCHAR(512),
            body TEXT NOT NULL DEFAULT '',
            status VARCHAR(32) NOT NULL DEFAULT 'draft',
            published_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE (publication_id, slug)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_longform_posts_publication ON longform_posts(publication_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_longform_posts_status ON longform_posts(status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_longform_posts_published_at ON longform_posts(published_at DESC NULLS LAST)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS longform_subscriptions (
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            publication_id INTEGER NOT NULL REFERENCES longform_publications(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY (user_id, publication_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_longform_subscriptions_pub ON longform_subscriptions(publication_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS longform_post_stars (
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            post_id INTEGER NOT NULL REFERENCES longform_posts(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY (user_id, post_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_longform_post_stars_post ON longform_post_stars(post_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS longform_post_stars")
    op.execute("DROP TABLE IF EXISTS longform_subscriptions")
    op.execute("DROP TABLE IF EXISTS longform_posts")
    op.execute("DROP TABLE IF EXISTS longform_publications")
