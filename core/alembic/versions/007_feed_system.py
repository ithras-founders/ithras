"""Feed system: communities, channels, posts, comments, reactions, saves.

Revision ID: 007_feed_system
Revises: 006_organisation_admin_board
Create Date: 2025-03

"""
from alembic import op

revision = "007_feed_system"
down_revision = "006_organisation_admin_board"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── communities ─────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS communities (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(128) UNIQUE NOT NULL,
            type VARCHAR(64) NOT NULL,
            description TEXT,
            institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
            organisation_id INTEGER REFERENCES organisations(id) ON DELETE CASCADE,
            function_key VARCHAR(64),
            has_channels BOOLEAN NOT NULL DEFAULT false,
            status VARCHAR(32) NOT NULL DEFAULT 'listed',
            logo_url VARCHAR(512),
            cover_image_url VARCHAR(512),
            member_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_communities_type ON communities(type)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_communities_institution ON communities(institution_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_communities_organisation ON communities(organisation_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_communities_status ON communities(status)")

    # ─── channels ────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS channels (
            id SERIAL PRIMARY KEY,
            community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(128) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(community_id, slug)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_channels_community ON channels(community_id)")

    # ─── posts ───────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id SERIAL PRIMARY KEY,
            author_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
            channel_id INTEGER REFERENCES channels(id) ON DELETE SET NULL,
            type VARCHAR(64) NOT NULL DEFAULT 'discussion',
            title VARCHAR(512),
            content TEXT NOT NULL DEFAULT '',
            tags_json TEXT DEFAULT '[]',
            attachments_json TEXT DEFAULT '[]',
            comment_count INTEGER NOT NULL DEFAULT 0,
            reaction_count INTEGER NOT NULL DEFAULT 0,
            save_count INTEGER NOT NULL DEFAULT 0,
            view_count INTEGER NOT NULL DEFAULT 0,
            moderation_status VARCHAR(32) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_posts_community_created ON posts(community_id, created_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_posts_channel_created ON posts(channel_id, created_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_posts_moderation ON posts(moderation_status)")

    # ─── comments ────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
            author_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            is_accepted_answer BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)")

    # ─── reactions ───────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS post_reactions (
            id SERIAL PRIMARY KEY,
            post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            type VARCHAR(32) NOT NULL DEFAULT 'upvote',
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(post_id, user_id, type)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id)")

    # ─── post_saves ──────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS post_saves (
            id SERIAL PRIMARY KEY,
            post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(post_id, user_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_post_saves_user ON post_saves(user_id)")

    # ─── community_members ────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS community_members (
            id SERIAL PRIMARY KEY,
            community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            role VARCHAR(32) NOT NULL DEFAULT 'member',
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(community_id, user_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id)")

    # ─── community_requests ───────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS community_requests (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(64),
            purpose TEXT,
            rules_json TEXT,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # ─── community_follows ───────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS community_follows (
            id SERIAL PRIMARY KEY,
            community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(community_id, user_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_community_follows_user ON community_follows(user_id)")

    # ─── post_useful (for mark as useful on questions) ────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS post_useful (
            id SERIAL PRIMARY KEY,
            post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(post_id, user_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_post_useful_post ON post_useful(post_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS post_useful CASCADE")
    op.execute("DROP TABLE IF EXISTS community_follows CASCADE")
    op.execute("DROP TABLE IF EXISTS community_requests CASCADE")
    op.execute("DROP TABLE IF EXISTS community_members CASCADE")
    op.execute("DROP TABLE IF EXISTS post_saves CASCADE")
    op.execute("DROP TABLE IF EXISTS post_reactions CASCADE")
    op.execute("DROP TABLE IF EXISTS comments CASCADE")
    op.execute("DROP TABLE IF EXISTS posts CASCADE")
    op.execute("DROP TABLE IF EXISTS channels CASCADE")
    op.execute("DROP TABLE IF EXISTS communities CASCADE")
