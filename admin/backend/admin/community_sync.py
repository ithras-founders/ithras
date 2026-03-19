"""Community sync helpers: ensure general channel, create communities for institutions/orgs."""
import re
from sqlalchemy import text


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-") or "n-a"


def ensure_community_has_general_channel(db, community_id: int, description: str = "General discussion") -> bool:
    """Ensure community has a 'general' channel. Creates if missing. Returns True if created."""
    r = db.execute(
        text("SELECT 1 FROM channels WHERE community_id = :cid AND slug = 'general'"),
        {"cid": community_id},
    )
    if r.scalar():
        return False
    db.execute(
        text("INSERT INTO channels (community_id, name, slug, description) VALUES (:cid, 'General', 'general', :desc)"),
        {"cid": community_id, "desc": description},
    )
    db.execute(text("UPDATE communities SET has_channels = true, updated_at = NOW() WHERE id = :cid"), {"cid": community_id})
    return True


def ensure_institution_community(db, institution_id: int, name: str) -> int | None:
    """
    Ensure a listed institution has a community. Creates one with General channel if missing.
    General channel description: "For current students".
    Also adds institution_admins as community admins.
    Returns community_id or None if community already existed.
    """
    r = db.execute(
        text("SELECT id FROM communities WHERE institution_id = :iid AND type = 'institution'"),
        {"iid": institution_id},
    )
    existing = r.fetchone()
    if existing:
        ensure_community_has_general_channel(db, existing.id, "For current students")
        _sync_institution_admins_to_community(db, institution_id, existing.id)
        return None

    slug = _slug(name)
    n = 0
    while True:
        r2 = db.execute(text("SELECT 1 FROM communities WHERE slug = :s"), {"s": slug})
        if not r2.scalar():
            break
        n += 1
        slug = f"{slug}-{n}"

    db.execute(
        text("""
            INSERT INTO communities (name, slug, type, description, institution_id, has_channels, status)
            VALUES (:name, :slug, 'institution', :desc, :iid, true, 'listed')
        """),
        {
            "name": name,
            "slug": slug,
            "desc": f"Community for {name}",
            "iid": institution_id,
        },
    )
    cid = db.execute(text("SELECT lastval()")).scalar()
    db.execute(
        text("INSERT INTO channels (community_id, name, slug, description) VALUES (:cid, 'General', 'general', :desc)"),
        {"cid": cid, "desc": "For current students"},
    )
    _sync_institution_admins_to_community(db, institution_id, cid)
    return cid


def ensure_organisation_community(db, organisation_id: int, name: str) -> int | None:
    """
    Ensure a listed organisation has a community. Creates one with General channel if missing.
    General channel description: "For current employees".
    Also adds organisation_admins as community admins.
    Returns community_id or None if community already existed.
    """
    r = db.execute(
        text("SELECT id FROM communities WHERE organisation_id = :oid AND type = 'organisation'"),
        {"oid": organisation_id},
    )
    existing = r.fetchone()
    if existing:
        ensure_community_has_general_channel(db, existing.id, "For current employees")
        _sync_organisation_admins_to_community(db, organisation_id, existing.id)
        return None

    slug = _slug(name)
    n = 0
    while True:
        r2 = db.execute(text("SELECT 1 FROM communities WHERE slug = :s"), {"s": slug})
        if not r2.scalar():
            break
        n += 1
        slug = f"{slug}-{n}"

    db.execute(
        text("""
            INSERT INTO communities (name, slug, type, description, organisation_id, has_channels, status)
            VALUES (:name, :slug, 'organisation', :desc, :oid, true, 'listed')
        """),
        {
            "name": name,
            "slug": slug,
            "desc": f"Community for {name}",
            "oid": organisation_id,
        },
    )
    cid = db.execute(text("SELECT lastval()")).scalar()
    db.execute(
        text("INSERT INTO channels (community_id, name, slug, description) VALUES (:cid, 'General', 'general', :desc)"),
        {"cid": cid, "desc": "For current employees"},
    )
    _sync_organisation_admins_to_community(db, organisation_id, cid)
    return cid


def _sync_institution_admins_to_community(db, institution_id: int, community_id: int) -> None:
    """Add institution admins as community admins."""
    rows = db.execute(
        text("SELECT user_id FROM institution_admins WHERE institution_id = :iid"),
        {"iid": institution_id},
    ).fetchall()
    for row in rows:
        try:
            db.execute(
                text("""
                    INSERT INTO community_members (community_id, user_id, role)
                    VALUES (:cid, :uid, 'admin')
                    ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'admin'
                """),
                {"cid": community_id, "uid": row.user_id},
            )
        except Exception:
            pass
    if rows:
        db.execute(
            text("UPDATE communities SET member_count = (SELECT COUNT(*) FROM community_members WHERE community_id = :cid) WHERE id = :cid"),
            {"cid": community_id},
        )


def add_institution_admin_to_community(db, institution_id: int, user_id: int) -> None:
    """Add a single institution admin to the institution's community as admin (when they're invited)."""
    r = db.execute(
        text("SELECT id FROM communities WHERE institution_id = :iid AND type = 'institution'"),
        {"iid": institution_id},
    )
    row = r.fetchone()
    if not row:
        return
    try:
        db.execute(
            text("""
                INSERT INTO community_members (community_id, user_id, role)
                VALUES (:cid, :uid, 'admin')
                ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'admin'
            """),
            {"cid": row.id, "uid": user_id},
        )
        db.execute(
            text("UPDATE communities SET member_count = (SELECT COUNT(*) FROM community_members WHERE community_id = :cid) WHERE id = :cid"),
            {"cid": row.id},
        )
    except Exception:
        pass


def add_organisation_admin_to_community(db, organisation_id: int, user_id: int) -> None:
    """Add a single organisation admin to the organisation's community as admin (when they're invited)."""
    r = db.execute(
        text("SELECT id FROM communities WHERE organisation_id = :oid AND type = 'organisation'"),
        {"oid": organisation_id},
    )
    row = r.fetchone()
    if not row:
        return
    try:
        db.execute(
            text("""
                INSERT INTO community_members (community_id, user_id, role)
                VALUES (:cid, :uid, 'admin')
                ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'admin'
            """),
            {"cid": row.id, "uid": user_id},
        )
        db.execute(
            text("UPDATE communities SET member_count = (SELECT COUNT(*) FROM community_members WHERE community_id = :cid) WHERE id = :cid"),
            {"cid": row.id},
        )
    except Exception:
        pass


def _sync_organisation_admins_to_community(db, organisation_id: int, community_id: int) -> None:
    """Add organisation admins as community admins."""
    rows = db.execute(
        text("SELECT user_id FROM organisation_admins WHERE organisation_id = :oid"),
        {"oid": organisation_id},
    ).fetchall()
    for row in rows:
        try:
            db.execute(
                text("""
                    INSERT INTO community_members (community_id, user_id, role)
                    VALUES (:cid, :uid, 'admin')
                    ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'admin'
                """),
                {"cid": community_id, "uid": row.user_id},
            )
        except Exception:
            pass
    if rows:
        db.execute(
            text("UPDATE communities SET member_count = (SELECT COUNT(*) FROM community_members WHERE community_id = :cid) WHERE id = :cid"),
            {"cid": community_id},
        )
