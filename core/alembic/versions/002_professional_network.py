"""Professional network: user_type, profile, institutions, organisations, education, experience.

Revision ID: 002_professional_network
Revises: 001_initial
Create Date: 2025-03-18

"""
from alembic import op

revision = "002_professional_network"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── Users extension ─────────────────────────────────────────────────────
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(32) NOT NULL DEFAULT 'general'")
    # Existing users get 'general'; founders keep 'admin' (set by seed)
    op.execute("""
        UPDATE users SET user_type = 'general'
        WHERE LOWER(email) != 'founders@ithras.com'
    """)
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS headline VARCHAR(255)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS summary TEXT")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_slug VARCHAR(64) UNIQUE")

    # ─── Master lists ────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS institutions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(64) UNIQUE NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'listed',
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS institution_degree_majors (
            id SERIAL PRIMARY KEY,
            institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
            degree VARCHAR(255) NOT NULL,
            majors_json TEXT DEFAULT '[]',
            status VARCHAR(32) NOT NULL DEFAULT 'listed',
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(institution_id, degree, majors_json)
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS organisations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(64) UNIQUE NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'listed',
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS organisation_combos (
            id SERIAL PRIMARY KEY,
            organisation_id INTEGER NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
            business_unit VARCHAR(255) NOT NULL DEFAULT '',
            function VARCHAR(255) NOT NULL DEFAULT '',
            title VARCHAR(255) NOT NULL DEFAULT '',
            status VARCHAR(32) NOT NULL DEFAULT 'listed',
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # ─── User data ───────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS education_entries (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL,
            institution_degree_majors_id INTEGER REFERENCES institution_degree_majors(id) ON DELETE SET NULL,
            institution_name VARCHAR(255),
            degree VARCHAR(255) NOT NULL,
            majors_json TEXT DEFAULT '[]',
            start_month VARCHAR(7) NOT NULL,
            end_month VARCHAR(7),
            status VARCHAR(32) NOT NULL DEFAULT 'listed',
            admin_suggested_json TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS experience_groups (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            organisation_id INTEGER REFERENCES organisations(id) ON DELETE SET NULL,
            organisation_name VARCHAR(255),
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS internal_movements (
            id SERIAL PRIMARY KEY,
            experience_group_id INTEGER NOT NULL REFERENCES experience_groups(id) ON DELETE CASCADE,
            organisation_combo_id INTEGER REFERENCES organisation_combos(id) ON DELETE SET NULL,
            business_unit VARCHAR(255) NOT NULL DEFAULT '',
            function VARCHAR(255) NOT NULL DEFAULT '',
            title VARCHAR(255) NOT NULL,
            start_month VARCHAR(7) NOT NULL,
            end_month VARCHAR(7),
            status VARCHAR(32) NOT NULL DEFAULT 'listed',
            admin_suggested_json TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # ─── Approval tracking ───────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS pending_institutions (
            id SERIAL PRIMARY KEY,
            institution_name VARCHAR(255) NOT NULL,
            degree VARCHAR(255) NOT NULL,
            majors_json TEXT DEFAULT '[]',
            submitted_by INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            education_entry_id INTEGER REFERENCES education_entries(id) ON DELETE SET NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            admin_suggested_json TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS pending_organisations (
            id SERIAL PRIMARY KEY,
            organisation_name VARCHAR(255) NOT NULL,
            business_unit VARCHAR(255) NOT NULL DEFAULT '',
            function VARCHAR(255) NOT NULL DEFAULT '',
            title VARCHAR(255) NOT NULL,
            submitted_by INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            experience_group_id INTEGER REFERENCES experience_groups(id) ON DELETE SET NULL,
            movement_id INTEGER REFERENCES internal_movements(id) ON DELETE SET NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            admin_suggested_json TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Indexes for lookups
    op.execute("CREATE INDEX IF NOT EXISTS idx_education_entries_user ON education_entries(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_experience_groups_user ON experience_groups(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_internal_movements_eg ON internal_movements(experience_group_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_institutions_slug ON institutions(slug)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_organisations_slug ON organisations(slug)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_users_profile_slug ON users(profile_slug) WHERE profile_slug IS NOT NULL")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS pending_organisations CASCADE")
    op.execute("DROP TABLE IF EXISTS pending_institutions CASCADE")
    op.execute("DROP TABLE IF EXISTS internal_movements CASCADE")
    op.execute("DROP TABLE IF EXISTS experience_groups CASCADE")
    op.execute("DROP TABLE IF EXISTS education_entries CASCADE")
    op.execute("DROP TABLE IF EXISTS organisation_combos CASCADE")
    op.execute("DROP TABLE IF EXISTS organisations CASCADE")
    op.execute("DROP TABLE IF EXISTS institution_degree_majors CASCADE")
    op.execute("DROP TABLE IF EXISTS institutions CASCADE")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS user_type")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS headline")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS summary")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS profile_slug")
