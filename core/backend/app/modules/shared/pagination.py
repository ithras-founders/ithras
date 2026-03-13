"""Pagination helpers for list endpoints."""
from fastapi import Query
from typing import Optional

DEFAULT_LIMIT = 50
MAX_LIMIT = 100


def pagination_params(
    limit: Optional[int] = Query(DEFAULT_LIMIT, ge=1, le=MAX_LIMIT, description="Max items to return"),
    offset: Optional[int] = Query(0, ge=0, description="Offset for pagination"),
):
    """Common pagination query params."""
    return {"limit": limit, "offset": offset}


def paginate_query(query, limit: int, offset: int):
    """Apply limit and offset to SQLAlchemy query. Returns (items, total)."""
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    return items, total
