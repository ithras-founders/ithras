"""Community: ensure all have General channel; create communities for listed institutions/orgs.

Revision ID: 012_community_gen_channel_sync
Revises: 011_community_admin_extras
Create Date: 2025-03-13

"""
from alembic import op

revision = "012_community_gen_channel_sync"
down_revision = "011_community_admin_extras"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add General channel to all communities that don't have one
    op.execute("""
        INSERT INTO channels (community_id, name, slug, description)
        SELECT c.id, 'General', 'general', 'General discussion'
        FROM communities c
        WHERE NOT EXISTS (SELECT 1 FROM channels ch WHERE ch.community_id = c.id AND ch.slug = 'general')
    """)
    op.execute("""
        UPDATE communities SET has_channels = true, updated_at = NOW()
        WHERE has_channels = false
    """)

    # 2. Create communities for listed institutions that don't have one
    op.execute("""
        INSERT INTO communities (name, slug, type, description, institution_id, has_channels, status)
        SELECT i.name, 'inst-' || i.id::text, 'institution', 'Community for ' || i.name, i.id, true, 'listed'
        FROM institutions i
        WHERE i.status IN ('listed', 'placeholder')
        AND NOT EXISTS (SELECT 1 FROM communities c WHERE c.institution_id = i.id AND c.type = 'institution')
    """)
    op.execute("""
        INSERT INTO channels (community_id, name, slug, description)
        SELECT c.id, 'General', 'general', 'For current students'
        FROM communities c
        WHERE c.type = 'institution' AND c.institution_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM channels ch WHERE ch.community_id = c.id AND ch.slug = 'general')
    """)

    # 3. Create communities for listed organisations that don't have one
    op.execute("""
        INSERT INTO communities (name, slug, type, description, organisation_id, has_channels, status)
        SELECT o.name, 'org-' || o.id::text, 'organisation', 'Community for ' || o.name, o.id, true, 'listed'
        FROM organisations o
        WHERE o.status IN ('listed', 'placeholder')
        AND NOT EXISTS (SELECT 1 FROM communities c WHERE c.organisation_id = o.id AND c.type = 'organisation')
    """)
    op.execute("""
        INSERT INTO channels (community_id, name, slug, description)
        SELECT c.id, 'General', 'general', 'For current employees'
        FROM communities c
        WHERE c.type = 'organisation' AND c.organisation_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM channels ch WHERE ch.community_id = c.id AND ch.slug = 'general')
    """)

    # 4. Add institution_admins as community admins (for newly created institution communities)
    op.execute("""
        INSERT INTO community_members (community_id, user_id, role)
        SELECT c.id, ia.user_id, 'admin'
        FROM communities c
        JOIN institution_admins ia ON ia.institution_id = c.institution_id
        WHERE c.type = 'institution' AND c.institution_id IS NOT NULL
        ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'admin'
    """)

    # 5. Add organisation_admins as community admins (for newly created org communities)
    op.execute("""
        INSERT INTO community_members (community_id, user_id, role)
        SELECT c.id, oa.user_id, 'admin'
        FROM communities c
        JOIN organisation_admins oa ON oa.organisation_id = c.organisation_id
        WHERE c.type = 'organisation' AND c.organisation_id IS NOT NULL
        ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'admin'
    """)

    # 6. Update member_count for communities
    op.execute("""
        UPDATE communities
        SET member_count = (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = communities.id)
    """)


def downgrade() -> None:
    # Remove communities created for institutions (by slug pattern)
    op.execute("""
        DELETE FROM communities WHERE slug LIKE 'inst-%' AND type = 'institution'
    """)
    op.execute("""
        DELETE FROM communities WHERE slug LIKE 'org-%' AND type = 'organisation'
    """)
    # Note: We cannot safely remove General channels from other communities without
    # potentially orphaning posts. Leaving General channels in place on downgrade.
