"""Initial setup - single migration for project restart.

Creates full schema from ORM + non-ORM tables, seeds permissions and roles.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
import datetime

revision = "001"
down_revision = None
branch_labels = None
depends_on = None

# --- Permissions: merged from 003, 030, 033, 047 ---
PREDEFINED_PERMISSIONS = [
    ("placement.cycles.view", "View Placement Cycles", "placement"),
    ("placement.cycles.manage", "Manage Placement Cycles", "placement"),
    ("placement.cycles.configure", "Configure Placement Cycles", "placement"),
    ("cv.templates.view", "View CV Templates", "cv"),
    ("cv.templates.create", "Create CV Templates", "cv"),
    ("cv.templates.assign", "Assign CV Templates", "cv"),
    ("cv.templates.publish", "Publish CV Templates", "cv"),
    ("applications.view_own", "View Own Applications", "applications"),
    ("applications.view_all", "View All Applications", "applications"),
    ("applications.create", "Create Applications", "applications"),
    ("applications.approve", "Approve Applications", "applications"),
    ("users.view", "View Users", "users"),
    ("users.create", "Create Users", "users"),
    ("users.manage_roles", "Manage User Roles", "users"),
    ("institution.view", "View Institution", "institution"),
    ("institution.manage", "Manage Institution", "institution"),
    ("institution.manage_programs", "Manage Programs", "institution"),
    ("company.view", "View Company", "company"),
    ("company.manage", "Manage Company", "company"),
    ("company.manage_jobs", "Manage Jobs", "company"),
    ("system.admin", "System Administration", "system"),
    ("system.view_telemetry", "View Telemetry", "system"),
    ("system.view_analytics", "View Analytics", "system"),
    ("governance.workflows.view", "View Governance Workflows", "governance"),
    ("governance.workflows.manage", "Manage Governance Workflows", "governance"),
    ("governance.policies.approve", "Approve Policies", "governance"),
    # 030 - Identity
    ("profile.self.view", "View Own Profile", "identity"),
    ("profile.self.edit", "Edit Own Profile", "identity"),
    ("profile.affiliations.view", "View Affiliations", "identity"),
    ("auth.profile.switch", "Switch Profile", "identity"),
    ("cv.self.view", "View Own CV", "cv"),
    ("cv.self.manage", "Manage Own CV", "cv"),
    ("applications.self.view", "View Own Applications", "applications"),
    ("placement.students.view", "View Students", "placement"),
    ("placement.students.manage", "Manage Students", "placement"),
    ("placement.eligibility.view", "View Eligibility", "placement"),
    ("placement.eligibility.override", "Override Eligibility", "placement"),
    ("recruitment.discovery.search", "Search Talent", "recruitment"),
    ("recruitment.shortlist.manage", "Manage Shortlist", "recruitment"),
    ("recruitment.offer.approve", "Approve Offers", "recruitment"),
    ("recruitment.job_profiles.view", "View Job Profiles", "recruitment"),
    ("recruitment.job_profiles.create", "Create Job Profiles", "recruitment"),
    ("recruitment.job_profiles.manage", "Manage Job Profiles", "recruitment"),
    ("institution.structure.view", "View Institution Structure", "institution"),
    ("institution.structure.manage", "Manage Institution Structure", "institution"),
    ("company.business_units.manage", "Manage Business Units", "company"),
    ("system.audit.view", "View Audit Log", "system"),
    ("system.permissions.manage", "Manage Permissions", "system"),
    ("governance.workflows.approve", "Approve Workflows", "governance"),
    # 033 - Opportunities
    ("opportunities.view", "View Opportunities", "opportunities"),
    ("opportunities.personalized.view", "View Personalized Opportunities", "opportunities"),
    # 047 - Org read
    ("company.structure.view", "View Company Structure", "company"),
    ("company.about.view", "View Company About", "company"),
    ("institution.about.view", "View Institution About", "institution"),
]

PREDEFINED_ROLES = {
    "SYSTEM_ADMIN": {
        "name": "System Admin",
        "description": "Full system access",
        "permissions": [p[0] for p in PREDEFINED_PERMISSIONS],
    },
    "INSTITUTION_ADMIN": {
        "name": "Institution Admin",
        "description": "Institution-scoped administration",
        "permissions": [
            "institution.view", "institution.manage", "institution.manage_programs",
            "users.view", "users.create", "users.manage_roles",
            "placement.cycles.view", "governance.workflows.view",
            "institution.about.view", "institution.structure.view",
        ],
    },
    "PLACEMENT_TEAM": {
        "name": "Placement Team",
        "description": "Manages placement operations",
        "permissions": [
            "placement.cycles.view", "placement.cycles.manage", "placement.cycles.configure",
            "cv.templates.assign", "cv.templates.publish", "cv.templates.view",
            "applications.view_all", "applications.approve",
            "governance.workflows.view", "governance.workflows.manage", "governance.policies.approve",
            "users.view", "institution.about.view", "institution.structure.view",
        ],
    },
    "PLACEMENT_ADMIN": {
        "name": "Placement Admin",
        "description": "Placement team with user management rights",
        "permissions": [
            "placement.cycles.view", "placement.cycles.manage", "placement.cycles.configure",
            "cv.templates.assign", "cv.templates.publish", "cv.templates.view", "cv.templates.create",
            "applications.view_all", "applications.approve",
            "governance.workflows.view", "governance.workflows.manage", "governance.policies.approve",
            "users.view", "users.create", "users.manage_roles",
            "institution.about.view", "institution.structure.view",
        ],
    },
    "CANDIDATE": {
        "name": "Student / Candidate",
        "description": "Student enrolled in a program",
        "permissions": [
            "placement.cycles.view", "cv.templates.view",
            "applications.view_own", "applications.create",
            "profile.self.view", "profile.self.edit", "auth.profile.switch", "applications.self.view",
            "cv.self.view", "cv.self.manage",
            "opportunities.view", "opportunities.personalized.view",
        ],
    },
    "RECRUITER": {
        "name": "Recruiter",
        "description": "Company recruiter",
        "permissions": [
            "company.view", "company.manage", "company.manage_jobs",
            "applications.view_all", "placement.cycles.view",
            "profile.self.view", "profile.self.edit", "auth.profile.switch", "applications.self.view",
            "company.about.view", "company.structure.view",
            "opportunities.view", "opportunities.personalized.view",
        ],
    },
    "FACULTY_OBSERVER": {
        "name": "Faculty Observer",
        "description": "Read-only governance access",
        "permissions": [
            "placement.cycles.view", "applications.view_all", "governance.workflows.view",
            "profile.self.view", "profile.self.edit", "auth.profile.switch", "applications.self.view",
            "institution.about.view", "institution.structure.view",
        ],
    },
    "ALUMNI": {
        "name": "Alumni",
        "description": "Read-only placement cycle access",
        "permissions": ["placement.cycles.view"],
    },
    "PROFESSIONAL": {
        "name": "Professional",
        "description": "Lateral job seeker without institution",
        "permissions": [
            "placement.cycles.view", "cv.templates.view",
            "applications.view_own", "applications.create",
            "profile.self.view", "profile.self.edit", "auth.profile.switch", "applications.self.view",
            "cv.self.view", "cv.self.manage",
            "opportunities.view", "opportunities.personalized.view",
        ],
    },
}

def _perm_id(code: str) -> str:
    return f"perm_{code.replace('.', '_')}"


def upgrade() -> None:
    """Create full schema and seed data."""
    from app.modules.shared.database import Base
    from app.modules.shared import models  # noqa: F401

    conn = op.get_bind()

    # 1. Create all ORM-backed tables
    Base.metadata.create_all(bind=conn)

    # 2. Create non-ORM tables (feed, job_profiles, recruiter_outreach, user_follows)
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "feed_posts" not in tables:
        op.create_table(
            "feed_posts",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("author_id", sa.String(), nullable=False, index=True),
            sa.Column("text", sa.Text(), nullable=False, server_default=""),
            sa.Column("image_urls", sa.JSON(), nullable=True, server_default="[]"),
            sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
        )
        op.create_index("ix_feed_posts_created_at", "feed_posts", ["created_at"])

    if "feed_likes" not in tables:
        op.create_table(
            "feed_likes",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("post_id", sa.String(), nullable=False, index=True),
            sa.Column("user_id", sa.String(), nullable=False, index=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["post_id"], ["feed_posts.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.UniqueConstraint("post_id", "user_id", name="uq_feed_likes_post_user"),
        )

    if "feed_comments" not in tables:
        op.create_table(
            "feed_comments",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("post_id", sa.String(), nullable=False, index=True),
            sa.Column("author_id", sa.String(), nullable=False, index=True),
            sa.Column("text", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["post_id"], ["feed_posts.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
        )

    if "user_follows" not in tables:
        op.create_table(
            "user_follows",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("follower_id", sa.String(), nullable=False, index=True),
            sa.Column("following_id", sa.String(), nullable=False, index=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["follower_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["following_id"], ["users.id"], ondelete="CASCADE"),
            sa.UniqueConstraint("follower_id", "following_id", name="uq_user_follows_follower_following"),
        )

    if "job_profiles" not in tables:
        op.create_table(
            "job_profiles",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("company_id", sa.String(), nullable=False, index=True),
            sa.Column("created_by", sa.String(), nullable=False, index=True),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("jd_text", sa.Text(), nullable=True),
            sa.Column("sector", sa.String(), nullable=True),
            sa.Column("min_cgpa", sa.Float(), nullable=True),
            sa.Column("max_backlogs", sa.Integer(), nullable=True),
            sa.Column("skills_keywords", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("experience_years_min", sa.Integer(), nullable=True),
            sa.Column("institution_ids", sa.JSON(), nullable=True),
            sa.Column("program_ids", sa.JSON(), nullable=True),
            sa.Column("status", sa.String(), nullable=False, server_default="DRAFT"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="CASCADE"),
        )

    if "recruiter_outreach" not in tables:
        op.create_table(
            "recruiter_outreach",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("recruiter_id", sa.String(), nullable=False, index=True),
            sa.Column("candidate_id", sa.String(), nullable=False, index=True),
            sa.Column("job_profile_id", sa.String(), nullable=True, index=True),
            sa.Column("message", sa.Text(), nullable=True),
            sa.Column("status", sa.String(), nullable=False, server_default="PENDING"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["recruiter_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["candidate_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["job_profile_id"], ["job_profiles.id"], ondelete="SET NULL"),
        )

    # 3. Seed permissions (idempotent)
    for code, name, category in PREDEFINED_PERMISSIONS:
        perm_id = _perm_id(code)
        existing = conn.execute(text("SELECT 1 FROM permissions WHERE code = :c"), {"c": code}).fetchone()
        if not existing:
            conn.execute(
                text("INSERT INTO permissions (id, code, name, category) VALUES (:id, :code, :name, :category)"),
                {"id": perm_id, "code": code, "name": name, "category": category},
            )

    # 4. Seed roles and role_permissions (idempotent)
    now = datetime.datetime.utcnow().isoformat()
    for role_id, role_def in PREDEFINED_ROLES.items():
        existing = conn.execute(text("SELECT 1 FROM roles WHERE id = :id"), {"id": role_id}).fetchone()
        if not existing:
            conn.execute(
                text(
                    "INSERT INTO roles (id, name, type, description, is_system, created_at, updated_at) "
                    "VALUES (:id, :name, 'PREDEFINED', :desc, true, :now, :now)"
                ),
                {"id": role_id, "name": role_def["name"], "desc": role_def["description"], "now": now},
            )
        for perm_code in role_def["permissions"]:
            perm_id = _perm_id(perm_code)
            existing_rp = conn.execute(
                text("SELECT 1 FROM role_permissions WHERE role_id = :rid AND permission_id = :pid"),
                {"rid": role_id, "pid": perm_id},
            ).fetchone()
            if not existing_rp:
                conn.execute(
                    text("INSERT INTO role_permissions (role_id, permission_id) VALUES (:rid, :pid)"),
                    {"rid": role_id, "pid": perm_id},
                )


def downgrade() -> None:
    """Drop all tables."""
    from app.modules.shared.database import Base
    from app.modules.shared import models  # noqa: F401

    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # Drop non-ORM tables first (they reference ORM tables)
    for t in ("recruiter_outreach", "job_profiles", "feed_comments", "feed_likes", "feed_posts", "user_follows"):
        if t in tables:
            op.drop_table(t)

    # Drop all ORM-backed tables
    Base.metadata.drop_all(bind=conn)
