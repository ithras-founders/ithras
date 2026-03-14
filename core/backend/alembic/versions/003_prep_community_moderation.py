"""Add community moderation columns and seed preparation permissions/roles."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
import datetime

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None

PREP_COMMUNITY_PERMISSIONS = [
    ("preparation.community.view", "View Community Posts", "preparation"),
    ("preparation.community.post", "Create Posts and Comments", "preparation"),
    ("preparation.community.moderate", "Moderate Posts and Comments", "preparation"),
    ("preparation.community.admin", "Manage Community", "preparation"),
]


def _perm_id(code: str) -> str:
    return f"perm_{code.replace('.', '_')}"


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # 1. Add columns to prep_community_posts
    if "prep_community_posts" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("prep_community_posts")]
        if "status" not in cols:
            op.add_column("prep_community_posts", sa.Column("status", sa.String(), nullable=False, server_default="ACTIVE"))
        if "pinned_at" not in cols:
            op.add_column("prep_community_posts", sa.Column("pinned_at", sa.DateTime(), nullable=True))
        if "moderated_by" not in cols:
            op.add_column("prep_community_posts", sa.Column("moderated_by", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True))
        if "moderated_at" not in cols:
            op.add_column("prep_community_posts", sa.Column("moderated_at", sa.DateTime(), nullable=True))
        if "moderation_reason" not in cols:
            op.add_column("prep_community_posts", sa.Column("moderation_reason", sa.Text(), nullable=True))
        try:
            op.create_index("ix_prep_community_posts_status", "prep_community_posts", ["status"], unique=False)
        except Exception:
            pass

    # 2. Add columns to prep_community_comments
    if "prep_community_comments" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("prep_community_comments")]
        if "status" not in cols:
            op.add_column("prep_community_comments", sa.Column("status", sa.String(), nullable=False, server_default="ACTIVE"))
        if "moderated_by" not in cols:
            op.add_column("prep_community_comments", sa.Column("moderated_by", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True))
        if "moderated_at" not in cols:
            op.add_column("prep_community_comments", sa.Column("moderated_at", sa.DateTime(), nullable=True))
        if "moderation_reason" not in cols:
            op.add_column("prep_community_comments", sa.Column("moderation_reason", sa.Text(), nullable=True))
        try:
            op.create_index("ix_prep_community_comments_status", "prep_community_comments", ["status"], unique=False)
        except Exception:
            pass

    # 3. Seed preparation community permissions
    for code, name, category in PREP_COMMUNITY_PERMISSIONS:
        perm_id = _perm_id(code)
        try:
            existing = conn.execute(text("SELECT 1 FROM permissions WHERE code = :c"), {"c": code}).fetchone()
        except Exception:
            existing = None
        if not existing:
            conn.execute(
                text("INSERT INTO permissions (id, code, name, category) VALUES (:id, :code, :name, :category)"),
                {"id": perm_id, "code": code, "name": name, "category": category},
            )

    # 4. Add permissions to SYSTEM_ADMIN
    for code, _, _ in PREP_COMMUNITY_PERMISSIONS:
        perm_id = _perm_id(code)
        try:
            existing = conn.execute(
                text("SELECT 1 FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.id = 'SYSTEM_ADMIN' AND rp.permission_id = :pid"),
                {"pid": perm_id},
            ).fetchone()
        except Exception:
            existing = None
        if not existing:
            conn.execute(
                text("INSERT INTO role_permissions (role_id, permission_id) VALUES ('SYSTEM_ADMIN', :pid)"),
                {"pid": perm_id},
            )

    # 5. Add preparation.community.view and preparation.community.post to CANDIDATE, RECRUITER, etc.
    view_perm = _perm_id("preparation.community.view")
    post_perm = _perm_id("preparation.community.post")
    for role_id in ["CANDIDATE", "RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "FACULTY_OBSERVER", "ALUMNI", "PROFESSIONAL"]:
        for perm_id in [view_perm, post_perm]:
            try:
                existing = conn.execute(
                    text("SELECT 1 FROM role_permissions WHERE role_id = :rid AND permission_id = :pid"),
                    {"rid": role_id, "pid": perm_id},
                ).fetchone()
                if not existing:
                    conn.execute(
                        text("INSERT INTO role_permissions (role_id, permission_id) VALUES (:rid, :pid)"),
                        {"rid": role_id, "pid": perm_id},
                    )
            except Exception:
                pass

    # 6. Create PREP_COMMUNITY_MODERATOR and PREP_COMMUNITY_ADMIN roles
    now = datetime.datetime.utcnow().isoformat()
    for role_id, name, desc, perm_codes in [
        (
            "PREP_COMMUNITY_MODERATOR",
            "Prep Community Moderator",
            "Can moderate preparation community posts and comments",
            ["preparation.community.view", "preparation.community.post", "preparation.community.moderate"],
        ),
        (
            "PREP_COMMUNITY_ADMIN",
            "Prep Community Admin",
            "Full preparation community management",
            ["preparation.community.view", "preparation.community.post", "preparation.community.moderate", "preparation.community.admin"],
        ),
    ]:
        try:
            existing = conn.execute(text("SELECT 1 FROM roles WHERE id = :id"), {"id": role_id}).fetchone()
        except Exception:
            existing = None
        if not existing:
            conn.execute(
                text(
                    "INSERT INTO roles (id, name, type, description, is_system, created_at, updated_at) "
                    "VALUES (:id, :name, 'PREDEFINED', :desc, true, :now, :now)"
                ),
                {"id": role_id, "name": name, "desc": desc, "now": now},
            )
        for perm_code in perm_codes:
            perm_id = _perm_id(perm_code)
            try:
                existing_rp = conn.execute(
                    text("SELECT 1 FROM role_permissions WHERE role_id = :rid AND permission_id = :pid"),
                    {"rid": role_id, "pid": perm_id},
                ).fetchone()
            except Exception:
                existing_rp = None
            if not existing_rp:
                conn.execute(
                    text("INSERT INTO role_permissions (role_id, permission_id) VALUES (:rid, :pid)"),
                    {"rid": role_id, "pid": perm_id},
                )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Remove roles
    for role_id in ("PREP_COMMUNITY_MODERATOR", "PREP_COMMUNITY_ADMIN"):
        conn.execute(text("DELETE FROM role_permissions WHERE role_id = :rid"), {"rid": role_id})
        conn.execute(text("DELETE FROM roles WHERE id = :id"), {"id": role_id})

    # Remove permissions
    for code, _, _ in PREP_COMMUNITY_PERMISSIONS:
        perm_id = _perm_id(code)
        conn.execute(text("DELETE FROM role_permissions WHERE permission_id = :pid"), {"pid": perm_id})
        conn.execute(text("DELETE FROM permissions WHERE id = :id"), {"id": perm_id})

    # Drop columns from prep_community_comments
    if "prep_community_comments" in inspector.get_table_names():
        op.drop_index("ix_prep_community_comments_status", "prep_community_comments", if_exists=True)
        op.drop_column("prep_community_comments", "moderation_reason")
        op.drop_column("prep_community_comments", "moderated_at")
        op.drop_column("prep_community_comments", "moderated_by")
        op.drop_column("prep_community_comments", "status")

    # Drop columns from prep_community_posts
    if "prep_community_posts" in inspector.get_table_names():
        op.drop_index("ix_prep_community_posts_status", "prep_community_posts", if_exists=True)
        op.drop_column("prep_community_posts", "moderation_reason")
        op.drop_column("prep_community_posts", "moderated_at")
        op.drop_column("prep_community_posts", "moderated_by")
        op.drop_column("prep_community_posts", "pinned_at")
        op.drop_column("prep_community_posts", "status")
