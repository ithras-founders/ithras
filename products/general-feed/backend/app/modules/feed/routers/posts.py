"""Feed API: posts, likes, comments, views, engagement."""
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from app.modules.shared import database
from app.modules.shared.auth import get_current_user, get_current_user_optional
from app.modules.shared.models.core import User

router = APIRouter(prefix="/api/v1/feed", tags=["feed"])


class CreatePostRequest(BaseModel):
    text: str = ""
    image_urls: list[str] = []


class AddCommentRequest(BaseModel):
    text: str


def _allow_feed_user(user: User):
    if user.role not in ("CANDIDATE", "RECRUITER", "SYSTEM_ADMIN"):
        raise HTTPException(status_code=403, detail="Feed access requires CANDIDATE, RECRUITER, or SYSTEM_ADMIN role")


def _parse_image_urls(val) -> list:
    if val is None:
        return []
    if isinstance(val, list):
        return val
    if isinstance(val, str):
        try:
            return json.loads(val) if val else []
        except json.JSONDecodeError:
            return []
    return []


def _serialize_post(
    row: dict,
    like_count: int = 0,
    comment_count: int = 0,
    liked: bool = False,
    author_name: str | None = None,
    author_photo_url: str | None = None,
    author_recently_active: bool = False,
) -> dict:
    return {
        "id": row["id"],
        "author_id": row["author_id"],
        "author_name": author_name or "",
        "author_photo_url": author_photo_url or None,
        "author_recently_active": author_recently_active,
        "text": row["text"] or "",
        "image_urls": _parse_image_urls(row.get("image_urls")),
        "view_count": row.get("view_count", 0) or 0,
        "like_count": like_count,
        "comment_count": comment_count,
        "liked": liked,
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
    }


def _get_author_info(db: Session, author_id: str) -> tuple[str, str | None, bool]:
    try:
        row = db.execute(
            text("SELECT name, profile_photo_url, last_active_at FROM users WHERE id = :id"),
            {"id": author_id},
        ).fetchone()
    except Exception:
        row = db.execute(
            text("SELECT name, profile_photo_url FROM users WHERE id = :id"),
            {"id": author_id},
        ).fetchone()
    if not row:
        return ("", None, False)
    r = row._mapping
    last_active = r.get("last_active_at")
    is_recently_active = False
    if last_active:
        from datetime import datetime, timedelta
        dt = last_active.replace(tzinfo=None) if hasattr(last_active, "replace") and getattr(last_active, "tzinfo", None) else last_active
        if hasattr(dt, "year") and (datetime.utcnow() - dt) < timedelta(days=7):
            is_recently_active = True
    return (r.get("name") or "", r.get("profile_photo_url"), is_recently_active)


@router.post("/posts", response_model=dict)
def create_post(
    req: CreatePostRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Create a post. Auth required; CANDIDATE or RECRUITER."""
    _allow_feed_user(user)
    post_id = f"fp_{uuid.uuid4().hex}"
    image_urls = req.image_urls or []
    db.execute(
        text("""
            INSERT INTO feed_posts (id, author_id, text, image_urls)
            VALUES (:id, :author_id, :text, :image_urls::jsonb)
        """),
        {
            "id": post_id,
            "author_id": user.id,
            "text": (req.text or "").strip(),
            "image_urls": json.dumps(image_urls),
        },
    )
    db.execute(text("UPDATE users SET last_active_at = NOW() WHERE id = :id"), {"id": user.id})
    db.commit()
    row = db.execute(text("SELECT * FROM feed_posts WHERE id = :id"), {"id": post_id}).fetchone()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create post")
    r = dict(row._mapping)
    author_name, author_photo_url, author_recently_active = _get_author_info(db, r["author_id"])
    return _serialize_post(r, author_name=author_name, author_photo_url=author_photo_url, author_recently_active=author_recently_active)


@router.get("/posts", response_model=dict)
def list_posts(
    author_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(database.get_db),
):
    """List posts, paginated, ordered by created_at desc."""
    # Allow unauthenticated for public feed? Plan says auth - we'll make it optional for listing
    where = "WHERE 1=1"
    params = {"limit": limit, "offset": offset}
    if author_id:
        where += " AND fp.author_id = :author_id"
        params["author_id"] = author_id

    rows = db.execute(
        text(f"""
            SELECT fp.*,
                   COALESCE(lc.cnt, 0) AS like_count,
                   COALESCE(cc.cnt, 0) AS comment_count
            FROM feed_posts fp
            LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM feed_likes GROUP BY post_id) lc ON lc.post_id = fp.id
            LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM feed_comments GROUP BY post_id) cc ON cc.post_id = fp.id
            {where}
            ORDER BY fp.created_at DESC
            LIMIT :limit OFFSET :offset
        """),
        params,
    ).fetchall()

    result = []
    for row in rows:
        r = dict(row._mapping)
        liked = False
        if user:
            lk = db.execute(
                text("SELECT 1 FROM feed_likes WHERE post_id = :post_id AND user_id = :user_id"),
                {"post_id": r["id"], "user_id": user.id},
            ).fetchone()
            liked = lk is not None
        author_name, author_photo_url, author_recently_active = _get_author_info(db, r["author_id"])
        result.append(
            _serialize_post(
                r,
                like_count=r.get("like_count", 0),
                comment_count=r.get("comment_count", 0),
                liked=liked,
                author_name=author_name,
                author_photo_url=author_photo_url,
                author_recently_active=author_recently_active,
            )
        )

    return {"items": result, "limit": limit, "offset": offset}


@router.get("/posts/{post_id}", response_model=dict)
def get_post(
    post_id: str,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(database.get_db),
):
    """Get single post with like/comment/view counts."""
    row = db.execute(
        text("""
            SELECT fp.*,
                   (SELECT COUNT(*) FROM feed_likes WHERE post_id = fp.id) AS like_count,
                   (SELECT COUNT(*) FROM feed_comments WHERE post_id = fp.id) AS comment_count
            FROM feed_posts fp
            WHERE fp.id = :post_id
        """),
        {"post_id": post_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Post not found")
    r = dict(row._mapping)
    liked = False
    if user:
        lk = db.execute(
            text("SELECT 1 FROM feed_likes WHERE post_id = :post_id AND user_id = :user_id"),
            {"post_id": post_id, "user_id": user.id},
        ).fetchone()
        liked = lk is not None
    author_name, author_photo_url, author_recently_active = _get_author_info(db, r["author_id"])
    return _serialize_post(
        r,
        like_count=r.get("like_count", 0),
        comment_count=r.get("comment_count", 0),
        liked=liked,
        author_name=author_name,
        author_photo_url=author_photo_url,
        author_recently_active=author_recently_active,
    )


@router.post("/posts/{post_id}/like", response_model=dict)
def toggle_like(
    post_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Toggle like on a post."""
    _allow_feed_user(user)
    post = db.execute(text("SELECT id FROM feed_posts WHERE id = :id"), {"id": post_id}).fetchone()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    existing = db.execute(
        text("SELECT id FROM feed_likes WHERE post_id = :post_id AND user_id = :user_id"),
        {"post_id": post_id, "user_id": user.id},
    ).fetchone()
    if existing:
        db.execute(text("DELETE FROM feed_likes WHERE post_id = :post_id AND user_id = :user_id"), {"post_id": post_id, "user_id": user.id})
        db.commit()
        return {"liked": False}
    like_id = f"fl_{uuid.uuid4().hex}"
    db.execute(
        text("INSERT INTO feed_likes (id, post_id, user_id) VALUES (:id, :post_id, :user_id)"),
        {"id": like_id, "post_id": post_id, "user_id": user.id},
    )
    db.commit()
    return {"liked": True}


@router.post("/posts/{post_id}/comments", response_model=dict)
def add_comment(
    post_id: str,
    req: AddCommentRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Add a comment to a post."""
    _allow_feed_user(user)
    post = db.execute(text("SELECT id FROM feed_posts WHERE id = :id"), {"id": post_id}).fetchone()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    comment_id = f"fc_{uuid.uuid4().hex}"
    db.execute(
        text("INSERT INTO feed_comments (id, post_id, author_id, text) VALUES (:id, :post_id, :author_id, :text)"),
        {"id": comment_id, "post_id": post_id, "author_id": user.id, "text": (req.text or "").strip()},
    )
    db.execute(text("UPDATE users SET last_active_at = NOW() WHERE id = :id"), {"id": user.id})
    db.commit()
    row = db.execute(text("SELECT * FROM feed_comments WHERE id = :id"), {"id": comment_id}).fetchone()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create comment")
    r = row._mapping
    author_name, _ = _get_author_info(db, r["author_id"])
    return {
        "id": r["id"],
        "post_id": r["post_id"],
        "author_id": r["author_id"],
        "author_name": author_name,
        "text": r["text"],
        "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
    }


@router.get("/posts/{post_id}/comments", response_model=dict)
def list_comments(
    post_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(database.get_db),
):
    """List comments for a post."""
    post = db.execute(text("SELECT id FROM feed_posts WHERE id = :id"), {"id": post_id}).fetchone()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    rows = db.execute(
        text("""
            SELECT fc.* FROM feed_comments fc
            WHERE fc.post_id = :post_id
            ORDER BY fc.created_at ASC
            LIMIT :limit OFFSET :offset
        """),
        {"post_id": post_id, "limit": limit, "offset": offset},
    ).fetchall()
    items = []
    for row in rows:
        r = dict(row._mapping)
        author_name, _ = _get_author_info(db, r["author_id"])
        items.append({
            "id": r["id"],
            "post_id": r["post_id"],
            "author_id": r["author_id"],
            "author_name": author_name,
            "text": r["text"],
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        })
    return {"items": items, "limit": limit, "offset": offset}


@router.post("/posts/{post_id}/view", response_model=dict)
def record_view(
    post_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Increment view count (for recruiter visibility)."""
    _allow_feed_user(user)
    r = db.execute(text("UPDATE feed_posts SET view_count = view_count + 1 WHERE id = :id RETURNING view_count"), {"id": post_id}).fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="Post not found")
    db.commit()
    return {"view_count": r[0]}


@router.get("/engagement/{user_id}", response_model=dict)
def get_engagement(
    user_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Engagement summary for a user (for Trust Score / recruiter view)."""
    _allow_feed_user(user)
    stats = db.execute(
        text("""
            SELECT
                COUNT(DISTINCT fp.id) AS total_posts,
                COALESCE(SUM((SELECT COUNT(*) FROM feed_likes WHERE post_id = fp.id)), 0) AS total_likes_received,
                COALESCE(SUM((SELECT COUNT(*) FROM feed_comments WHERE post_id = fp.id)), 0) AS total_comments_received,
                MAX(fp.created_at) AS last_post_at
            FROM feed_posts fp
            WHERE fp.author_id = :user_id
        """),
        {"user_id": user_id},
    ).fetchone()
    posts_this_week = db.execute(
        text("""
            SELECT COUNT(*) FROM feed_posts
            WHERE author_id = :user_id AND created_at >= NOW() - INTERVAL '7 days'
        """),
        {"user_id": user_id},
    ).scalar() or 0

    user_row = db.execute(
        text("SELECT last_active_at FROM users WHERE id = :id"),
        {"id": user_id},
    ).fetchone()
    last_active_at = user_row._mapping.get("last_active_at") if user_row else None
    is_recently_active = False
    if last_active_at:
        from datetime import datetime, timedelta
        dt = last_active_at.replace(tzinfo=None) if hasattr(last_active_at, "replace") and last_active_at.tzinfo else last_active_at
        if isinstance(dt, datetime) and (datetime.utcnow() - dt) < timedelta(days=7):
            is_recently_active = True

    r = stats._mapping if stats else {}
    total_posts = r.get("total_posts", 0) or 0
    total_likes = r.get("total_likes_received", 0) or 0
    total_comments = r.get("total_comments_received", 0) or 0
    # Simple trust score: feed engagement + activity recency (0-100)
    engagement_score = min(50, (total_posts * 3) + (total_likes * 0.3) + (total_comments * 0.5) + (posts_this_week * 5))
    activity_bonus = 10 if is_recently_active else 0
    trust_score = min(100.0, round(engagement_score + activity_bonus + 20, 1))  # Base 20 for having account

    return {
        "user_id": user_id,
        "total_posts": total_posts,
        "total_likes_received": total_likes,
        "total_comments_received": total_comments,
        "last_post_at": r.get("last_post_at").isoformat() if r.get("last_post_at") else None,
        "last_active_at": last_active_at.isoformat() if last_active_at else None,
        "posts_this_week": posts_this_week,
        "is_recently_active": is_recently_active,
        "trust_score": trust_score,
    }
