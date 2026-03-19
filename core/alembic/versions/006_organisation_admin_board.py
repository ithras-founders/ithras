"""Organisation Admin Board: extended profile, business_units_v2, functions_v2, roles_v2, admins, activity log.

Revision ID: 006_organisation_admin_board
Revises: 005_institution_admin_board
Create Date: 2025-03

"""
from alembic import op
from sqlalchemy import text


revision = "006_organisation_admin_board"
down_revision = "005_institution_admin_board"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── Extend organisations table ─────────────────────────────────────────
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS short_name VARCHAR(128)")
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS organisation_type VARCHAR(64)")
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS industry VARCHAR(128)")
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS headquarters VARCHAR(255)")
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS founded_year INTEGER")
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS company_size VARCHAR(64)")
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(512)")
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS brand_colors_json TEXT")
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(512)")
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(512)")
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS crunchbase_url VARCHAR(512)")
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true")
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS draft_json TEXT")

    # ─── organisation_business_units_v2 (with head) ──────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS organisation_business_units_v2 (
            id SERIAL PRIMARY KEY,
            organisation_id INTEGER NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            head_user_id INTEGER REFERENCES users(user_numerical) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(organisation_id, name)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_org_business_units_v2_org ON organisation_business_units_v2(organisation_id)")

    # ─── organisation_functions_v2 (linked to BU) ───────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS organisation_functions_v2 (
            id SERIAL PRIMARY KEY,
            organisation_id INTEGER NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
            business_unit_id INTEGER REFERENCES organisation_business_units_v2(id) ON DELETE SET NULL,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_org_functions_v2_org ON organisation_functions_v2(organisation_id)")

    # ─── organisation_roles_v2 (title, level, function, BU) ─────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS organisation_roles_v2 (
            id SERIAL PRIMARY KEY,
            organisation_id INTEGER NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            level VARCHAR(32) DEFAULT 'C10',
            function_id INTEGER REFERENCES organisation_functions_v2(id) ON DELETE SET NULL,
            business_unit_id INTEGER REFERENCES organisation_business_units_v2(id) ON DELETE SET NULL,
            employment_type VARCHAR(64) DEFAULT 'full_time',
            status VARCHAR(32) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_org_roles_v2_org ON organisation_roles_v2(organisation_id)")

    # ─── organisation_admins ────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS organisation_admins (
            id SERIAL PRIMARY KEY,
            organisation_id INTEGER NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            role VARCHAR(32) NOT NULL DEFAULT 'admin',
            added_by_user_id INTEGER REFERENCES users(user_numerical) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(organisation_id, user_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_organisation_admins_org ON organisation_admins(organisation_id)")

    # ─── organisation_activity_log ───────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS organisation_activity_log (
            id SERIAL PRIMARY KEY,
            organisation_id INTEGER NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(user_numerical) ON DELETE SET NULL,
            action VARCHAR(128) NOT NULL,
            details_json TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_organisation_activity_log_org ON organisation_activity_log(organisation_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_organisation_activity_log_created ON organisation_activity_log(created_at DESC)")

    # ─── Bootstrap business_units_v2 from organisation_business_units ─────────
    conn = op.get_bind()
    r = conn.execute(text("SELECT id, organisation_id, name FROM organisation_business_units ORDER BY organisation_id, name"))
    for row in r.fetchall():
        conn.execute(
            text("""
                INSERT INTO organisation_business_units_v2 (organisation_id, name)
                VALUES (:oid, :n)
            """),
            {"oid": row.organisation_id, "n": (row.name or "").strip()},
        )

    # ─── Bootstrap functions_v2 from organisation_functions ──────────────────
    r2 = conn.execute(text("SELECT id, organisation_id, name FROM organisation_functions ORDER BY organisation_id, name"))
    for row in r2.fetchall():
        conn.execute(
            text("""
                INSERT INTO organisation_functions_v2 (organisation_id, name)
                VALUES (:oid, :n)
            """),
            {"oid": row.organisation_id, "n": (row.name or "").strip()},
        )

    # ─── Bootstrap roles_v2 from organisation_titles ──────────────────────────
    r3 = conn.execute(text("SELECT id, organisation_id, title FROM organisation_titles ORDER BY organisation_id, title"))
    for row in r3.fetchall():
        conn.execute(
            text("""
                INSERT INTO organisation_roles_v2 (organisation_id, title, status)
                VALUES (:oid, :t, 'active')
            """),
            {"oid": row.organisation_id, "t": (row.title or "").strip()},
        )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS organisation_activity_log CASCADE")
    op.execute("DROP TABLE IF EXISTS organisation_admins CASCADE")
    op.execute("DROP TABLE IF EXISTS organisation_roles_v2 CASCADE")
    op.execute("DROP TABLE IF EXISTS organisation_functions_v2 CASCADE")
    op.execute("DROP TABLE IF EXISTS organisation_business_units_v2 CASCADE")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS draft_json")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS is_public")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS crunchbase_url")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS twitter_url")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS linkedin_url")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS brand_colors_json")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS cover_image_url")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS company_size")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS founded_year")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS headquarters")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS industry")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS organisation_type")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS short_name")
