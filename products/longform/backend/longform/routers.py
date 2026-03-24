"""LongForm API — publications, posts, subscribe, star."""
import logging
import re
from io import BytesIO
from typing import Any, Literal, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from PIL import Image
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from shared.database.database import get_db
from shared.auth.auth import get_current_user, get_current_user_optional

from longform.sanitize import sanitize_longform_body
from longform.media_paths import get_longform_media_root

router = APIRouter(prefix="/api/v1/longform", tags=["longform"])
log = logging.getLogger("ithras")

LONGFORM_IMAGE_MAX_BYTES = 5 * 1024 * 1024
_PIL_FORMAT_EXT = {"JPEG": ".jpg", "PNG": ".png", "GIF": ".gif", "WEBP": ".webp"}

LONGFORM_MIGRATION_HINT = (
    "LongForm storage is not initialized. Run: alembic upgrade head "
    "(revision 018_longform_system)."
)


def _longform_schema_missing(exc: BaseException) -> bool:
    raw = str(getattr(exc, "orig", exc) or exc).lower()
    if "longform" not in raw:
        return False
    return (
        "does not exist" in raw
        or "undefinedtable" in raw.replace(" ", "")
        or "no such table" in raw
    )


def require_longform_tables(db: Session = Depends(get_db)) -> None:
    """Fail fast with 503 when migration 018 has not been applied."""
    try:
        db.execute(text("SELECT 1 FROM longform_publications LIMIT 1"))
    except ProgrammingError as e:
        if _longform_schema_missing(e):
            log.warning("LongForm tables missing — %s", e)
            raise HTTPException(status_code=503, detail=LONGFORM_MIGRATION_HINT) from None
        raise


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-") or "untitled"


def _uid(user) -> int:
    return int(getattr(user, "user_numerical", None) or getattr(user, "id", 0))


# ─── Pydantic ───────────────────────────────────────────────────────────────
class PublicationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=512)
    slug: Optional[str] = Field(None, max_length=128)
    tagline: Optional[str] = Field(None, max_length=512)
    description: Optional[str] = None


class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=512)
    slug: Optional[str] = Field(None, max_length=160)
    subtitle: Optional[str] = Field(None, max_length=512)
    body: str = ""
    status: Literal["draft", "published"] = "draft"


class PostPatch(BaseModel):
    title: Optional[str] = Field(None, max_length=512)
    subtitle: Optional[str] = Field(None, max_length=512)
    body: Optional[str] = None
    status: Optional[Literal["draft", "published"]] = None


# ─── List publications ──────────────────────────────────────────────────────
@router.get("/publications/", summary="List publications")
def list_publications(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    subscribed: Optional[int] = Query(None, description="1 = only publications I subscribe to"),
    mine: Optional[int] = Query(None, description="1 = only publications I own"),
    sort: Literal["updated", "popular"] = Query("updated"),
):
    uid = _uid(user)
    sub_filter = ""
    mine_filter = ""
    params: dict[str, Any] = {"lim": limit, "off": offset, "uid": uid}
    if subscribed == 1:
        sub_filter = """
          AND EXISTS (
            SELECT 1 FROM longform_subscriptions s
            WHERE s.publication_id = p.id AND s.user_id = :uid
          )
        """
    if mine == 1:
        mine_filter = "AND p.owner_user_id = :uid"
    order_by = (
        "subscriber_count DESC, p.updated_at DESC"
        if sort == "popular"
        else "p.updated_at DESC"
    )
    q = text(f"""
        SELECT p.id, p.owner_user_id, p.slug, p.title, p.tagline, p.description,
               p.created_at, p.updated_at,
               (SELECT COUNT(*)::int FROM longform_subscriptions s WHERE s.publication_id = p.id) AS subscriber_count,
               (SELECT COUNT(*)::int FROM longform_posts po
                 WHERE po.publication_id = p.id AND po.status = 'published') AS published_post_count,
               EXISTS (SELECT 1 FROM longform_subscriptions s2 WHERE s2.publication_id = p.id AND s2.user_id = :uid) AS subscribed
        FROM longform_publications p
        WHERE 1=1 {sub_filter} {mine_filter}
        ORDER BY {order_by}
        LIMIT :lim OFFSET :off
    """)
    try:
        rows = db.execute(q, params).mappings().all()
    except ProgrammingError as e:
        if _longform_schema_missing(e):
            log.warning("LongForm tables missing; returning empty publications list. %s", e)
            return {"items": [], "limit": limit, "offset": offset}
        raise
    return {"items": [dict(r) for r in rows], "limit": limit, "offset": offset}


# ─── Recent posts (discovery) ─────────────────────────────────────────────────
@router.get("/posts/recent/", summary="Recent published posts across platform")
def recent_posts(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=50),
    sort: Literal["recent", "trending"] = Query("recent"),
):
    _uid(user)
    order_by = (
        "(SELECT COUNT(*)::int FROM longform_post_stars stc WHERE stc.post_id = po.id) DESC, "
        "po.published_at DESC NULLS LAST, po.id DESC"
        if sort == "trending"
        else "po.published_at DESC NULLS LAST, po.id DESC"
    )
    q = text(f"""
        SELECT po.id, po.slug, po.title, po.subtitle, po.published_at, po.created_at,
               po.publication_id,
               p.slug AS publication_slug, p.title AS publication_title,
               LEFT(po.body, 280) AS excerpt,
               (SELECT COUNT(*)::int FROM longform_post_stars stc WHERE stc.post_id = po.id) AS star_count
        FROM longform_posts po
        JOIN longform_publications p ON p.id = po.publication_id
        WHERE po.status = 'published'
        ORDER BY {order_by}
        LIMIT :lim
    """)
    try:
        rows = db.execute(q, {"lim": limit}).mappings().all()
    except ProgrammingError as e:
        if _longform_schema_missing(e):
            log.warning("LongForm tables missing; returning empty recent posts. %s", e)
            return {"items": []}
        raise
    return {"items": [dict(r) for r in rows]}


# ─── Create publication ───────────────────────────────────────────────────────
@router.post("/publications/", summary="Create publication (authenticated)")
def create_publication(
    body: PublicationCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    _longform: None = Depends(require_longform_tables),
):
    uid = _uid(user)
    slug = _slug(body.slug or body.title)
    base = slug
    n = 0
    while True:
        check = db.execute(
            text("SELECT 1 FROM longform_publications WHERE slug = :s"),
            {"s": slug},
        ).first()
        if not check:
            break
        n += 1
        slug = f"{base}-{n}"
        if n > 50:
            raise HTTPException(status_code=400, detail="Could not allocate unique slug")
    row = db.execute(
        text("""
            INSERT INTO longform_publications (owner_user_id, slug, title, tagline, description)
            VALUES (:uid, :slug, :title, :tagline, :description)
            RETURNING id, owner_user_id, slug, title, tagline, description, created_at, updated_at
        """),
        {
            "uid": uid,
            "slug": slug,
            "title": body.title.strip(),
            "tagline": body.tagline,
            "description": body.description,
        },
    ).mappings().first()
    db.commit()
    return dict(row)


# ─── Publication by slug ─────────────────────────────────────────────────────
@router.get("/publications/{pub_slug}/", summary="Publication detail + posts")
def get_publication(
    pub_slug: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    _longform: None = Depends(require_longform_tables),
):
    uid = _uid(user)
    pub = db.execute(
        text("""
            SELECT p.id, p.owner_user_id, p.slug, p.title, p.tagline, p.description,
                   p.created_at, p.updated_at,
                   (SELECT COUNT(*)::int FROM longform_subscriptions s WHERE s.publication_id = p.id) AS subscriber_count,
                   EXISTS (SELECT 1 FROM longform_subscriptions s2 WHERE s2.publication_id = p.id AND s2.user_id = :uid) AS subscribed
            FROM longform_publications p
            WHERE p.slug = :slug
        """),
        {"slug": pub_slug, "uid": uid},
    ).mappings().first()
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")
    pub_d = dict(pub)
    is_owner = pub_d["owner_user_id"] == uid
    status_cond = "1=1" if is_owner else "po.status = 'published'"
    posts = db.execute(
        text(f"""
            SELECT po.id, po.slug, po.title, po.subtitle, po.status, po.published_at, po.created_at,
                   LENGTH(po.body) AS body_length
            FROM longform_posts po
            WHERE po.publication_id = :pid AND ({status_cond})
            ORDER BY po.published_at DESC NULLS LAST, po.id DESC
        """),
        {"pid": pub_d["id"]},
    ).mappings().all()
    pub_d["posts"] = [dict(p) for p in posts]
    return pub_d


# ─── Single post ──────────────────────────────────────────────────────────────
@router.get("/publications/{pub_slug}/posts/{post_slug}/", summary="Read post")
def get_post(
    pub_slug: str,
    post_slug: str,
    user=Depends(get_current_user_optional),
    db: Session = Depends(get_db),
    _longform: None = Depends(require_longform_tables),
):
    uid = _uid(user) if user else 0
    row = db.execute(
        text("""
            SELECT po.id, po.publication_id, po.slug, po.title, po.subtitle, po.body, po.status,
                   po.published_at, po.created_at,
                   p.slug AS publication_slug, p.title AS publication_title, p.owner_user_id,
                   EXISTS (SELECT 1 FROM longform_post_stars st WHERE st.post_id = po.id AND st.user_id = :uid) AS starred,
                   (SELECT COUNT(*)::int FROM longform_post_stars stc WHERE stc.post_id = po.id) AS star_count,
                   EXISTS (SELECT 1 FROM longform_subscriptions s WHERE s.publication_id = p.id AND s.user_id = :uid) AS subscribed
            FROM longform_posts po
            JOIN longform_publications p ON p.id = po.publication_id
            WHERE p.slug = :pub_slug AND po.slug = :post_slug
        """),
        {"pub_slug": pub_slug, "post_slug": post_slug, "uid": uid},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Post not found")
    d = dict(row)
    if d["status"] != "published" and d["owner_user_id"] != uid:
        raise HTTPException(status_code=404, detail="Post not found")
    return d


# ─── Upload image (publication owner) ─────────────────────────────────────────
@router.post("/publications/{publication_id}/images/", summary="Upload image for post body (owner)")
async def upload_longform_image(
    publication_id: int,
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    _longform: None = Depends(require_longform_tables),
):
    uid = _uid(user)
    pub = db.execute(
        text("SELECT id, owner_user_id FROM longform_publications WHERE id = :id"),
        {"id": publication_id},
    ).mappings().first()
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")
    if dict(pub)["owner_user_id"] != uid:
        raise HTTPException(status_code=403, detail="Only the owner can upload images")
    raw = await file.read()
    if len(raw) > LONGFORM_IMAGE_MAX_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 5MB)")
    if len(raw) < 16:
        raise HTTPException(status_code=400, detail="Invalid image file")
    try:
        Image.open(BytesIO(raw)).verify()
        buf = BytesIO(raw)
        img = Image.open(buf)
        img.load()
        fmt = (img.format or "").upper()
        if fmt not in _PIL_FORMAT_EXT:
            raise HTTPException(status_code=400, detail="Unsupported image type")
        ext = _PIL_FORMAT_EXT[fmt]
        root = get_longform_media_root()
        dest_dir = root / str(publication_id)
        dest_dir.mkdir(parents=True, exist_ok=True)
        name = f"{uuid4().hex}{ext}"
        out_path = dest_dir / name
        save_kw: dict[str, Any] = {}
        if fmt == "JPEG":
            img = img.convert("RGB")
            save_kw = {"quality": 88, "optimize": True}
        elif fmt == "WEBP":
            save_kw = {"quality": 88, "method": 4}
        img.save(out_path, format=fmt, **save_kw)
    except HTTPException:
        raise
    except Exception as e:
        log.warning("LongForm image upload failed: %s", e)
        raise HTTPException(status_code=400, detail="Could not process image") from None
    url = f"/media/longform/{publication_id}/{name}"
    return {"url": url}


# ─── Create post ─────────────────────────────────────────────────────────────
@router.post("/publications/{publication_id}/posts/", summary="Create post (owner)")
def create_post(
    publication_id: int,
    body: PostCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    _longform: None = Depends(require_longform_tables),
):
    uid = _uid(user)
    pub = db.execute(
        text("SELECT id, owner_user_id FROM longform_publications WHERE id = :id"),
        {"id": publication_id},
    ).mappings().first()
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")
    if dict(pub)["owner_user_id"] != uid:
        raise HTTPException(status_code=403, detail="Only the owner can create posts")
    slug = _slug(body.slug or body.title)
    base = slug
    n = 0
    while True:
        check = db.execute(
            text("SELECT 1 FROM longform_posts WHERE publication_id = :pid AND slug = :s"),
            {"pid": publication_id, "s": slug},
        ).first()
        if not check:
            break
        n += 1
        slug = f"{base}-{n}"
    safe_body = sanitize_longform_body(body.body or "")
    if body.status == "published":
        row = db.execute(
            text("""
                INSERT INTO longform_posts (publication_id, slug, title, subtitle, body, status, published_at)
                VALUES (:pid, :slug, :title, :subtitle, :body, :status, NOW())
                RETURNING id, publication_id, slug, title, subtitle, body, status, published_at, created_at
            """),
            {
                "pid": publication_id,
                "slug": slug,
                "title": body.title.strip(),
                "subtitle": body.subtitle,
                "body": safe_body,
                "status": body.status,
            },
        ).mappings().first()
    else:
        row = db.execute(
            text("""
                INSERT INTO longform_posts (publication_id, slug, title, subtitle, body, status)
                VALUES (:pid, :slug, :title, :subtitle, :body, :status)
                RETURNING id, publication_id, slug, title, subtitle, body, status, published_at, created_at
            """),
            {
                "pid": publication_id,
                "slug": slug,
                "title": body.title.strip(),
                "subtitle": body.subtitle,
                "body": safe_body,
                "status": body.status,
            },
        ).mappings().first()
    db.commit()
    return dict(row)


# ─── Patch post (publish / edit) ──────────────────────────────────────────────
@router.patch("/posts/{post_id}/", summary="Update post (owner)")
def patch_post(
    post_id: int,
    body: PostPatch,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    _longform: None = Depends(require_longform_tables),
):
    uid = _uid(user)
    po = db.execute(
        text("""
            SELECT po.id, po.publication_id, p.owner_user_id
            FROM longform_posts po
            JOIN longform_publications p ON p.id = po.publication_id
            WHERE po.id = :id
        """),
        {"id": post_id},
    ).mappings().first()
    if not po:
        raise HTTPException(status_code=404, detail="Post not found")
    if dict(po)["owner_user_id"] != uid:
        raise HTTPException(status_code=403, detail="Only the owner can edit")
    updates = []
    params: dict[str, Any] = {"id": post_id}
    if body.title is not None:
        updates.append("title = :title")
        params["title"] = body.title.strip()
    if body.subtitle is not None:
        updates.append("subtitle = :subtitle")
        params["subtitle"] = body.subtitle
    if body.body is not None:
        updates.append("body = :body")
        params["body"] = sanitize_longform_body(body.body)
    if body.status is not None:
        updates.append("status = :status")
        params["status"] = body.status
        if body.status == "published":
            updates.append("published_at = COALESCE(published_at, NOW())")
    if not updates:
        row = db.execute(
            text("SELECT * FROM longform_posts WHERE id = :id"),
            {"id": post_id},
        ).mappings().first()
        return dict(row)
    updates.append("updated_at = NOW()")
    db.execute(
        text(f"UPDATE longform_posts SET {', '.join(updates)} WHERE id = :id"),
        params,
    )
    db.commit()
    row = db.execute(
        text("SELECT * FROM longform_posts WHERE id = :id"),
        {"id": post_id},
    ).mappings().first()
    return dict(row)


# ─── Subscribe ────────────────────────────────────────────────────────────────
@router.post("/publications/{publication_id}/subscribe/", summary="Subscribe")
def subscribe(
    publication_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    _longform: None = Depends(require_longform_tables),
):
    uid = _uid(user)
    pub = db.execute(
        text("SELECT id FROM longform_publications WHERE id = :id"),
        {"id": publication_id},
    ).first()
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")
    db.execute(
        text("""
            INSERT INTO longform_subscriptions (user_id, publication_id)
            VALUES (:uid, :pid)
            ON CONFLICT DO NOTHING
        """),
        {"uid": uid, "pid": publication_id},
    )
    db.commit()
    return {"subscribed": True}


@router.delete("/publications/{publication_id}/subscribe/", summary="Unsubscribe")
def unsubscribe(
    publication_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    _longform: None = Depends(require_longform_tables),
):
    uid = _uid(user)
    db.execute(
        text("DELETE FROM longform_subscriptions WHERE user_id = :uid AND publication_id = :pid"),
        {"uid": uid, "pid": publication_id},
    )
    db.commit()
    return {"subscribed": False}


# ─── Star ─────────────────────────────────────────────────────────────────────
@router.post("/posts/{post_id}/star/", summary="Star post")
def star_post(
    post_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    _longform: None = Depends(require_longform_tables),
):
    uid = _uid(user)
    po = db.execute(
        text("SELECT id FROM longform_posts WHERE id = :id"),
        {"id": post_id},
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="Post not found")
    db.execute(
        text("""
            INSERT INTO longform_post_stars (user_id, post_id)
            VALUES (:uid, :pid)
            ON CONFLICT DO NOTHING
        """),
        {"uid": uid, "pid": post_id},
    )
    db.commit()
    return {"starred": True}


@router.delete("/posts/{post_id}/star/", summary="Unstar post")
def unstar_post(
    post_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    _longform: None = Depends(require_longform_tables),
):
    uid = _uid(user)
    db.execute(
        text("DELETE FROM longform_post_stars WHERE user_id = :uid AND post_id = :pid"),
        {"uid": uid, "pid": post_id},
    )
    db.commit()
    return {"starred": False}
