"""
Database introspection API for System Admin.
Lists tables with pagination, filter, sort. Table details with columns.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel

from app.modules.shared import database

router = APIRouter(prefix="/api/v1/admin/database", tags=["database"])


@router.post("/refresh-stats")
def refresh_stats(db: Session = Depends(database.get_db)):
    """
    Run ANALYZE on all public tables to update row count estimates.
    Call this if row counts show 0 but tables have data.
    """
    try:
        db.execute(text("ANALYZE"))
        db.commit()
        return {"message": "Database statistics refreshed"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


class TableListItem(BaseModel):
    table_name: str
    table_schema: str
    approximate_row_count: Optional[int] = None


class TableListResponse(BaseModel):
    items: List[TableListItem]
    total: int
    page: int
    page_size: int


class ColumnInfo(BaseModel):
    column_name: str
    data_type: str
    is_nullable: str
    column_default: Optional[str] = None


class TableDetailResponse(BaseModel):
    table_name: str
    table_schema: str
    approximate_row_count: Optional[int] = None
    columns: List[ColumnInfo]


@router.get("/tables", response_model=TableListResponse)
def get_tables(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Filter by table name (case-insensitive)"),
    sort_by: str = Query("table_name", description="Sort by: table_name | approximate_row_count"),
    order: str = Query("asc", description="Order: asc | desc"),
    db: Session = Depends(database.get_db),
):
    """
    List database tables with pagination, filter, and sort.
    Uses pg_class.reltuples (ANALYZE estimate) with pg_stat fallback for row counts.
    """
    order_dir = "DESC" if order.lower() == "desc" else "ASC"
    if sort_by not in ("table_name", "approximate_row_count"):
        sort_by = "table_name"

    # Row count: prefer pg_stat.n_live_tup (exact), else pg_class.reltuples (ANALYZE estimate)
    row_count_expr = "GREATEST(0, COALESCE(pg.n_live_tup, c.reltuples::bigint))"
    sort_expr = "table_name" if sort_by == "table_name" else f"{row_count_expr}"
    offset_val = (page - 1) * page_size

    search_filter = ""
    params = {"limit_val": page_size, "offset_val": offset_val}
    if search and search.strip():
        search_filter = "AND t.table_name ILIKE :search_pattern"
        params["search_pattern"] = f"%{search.strip()}%"

    # Count total (with same filter)
    count_sql = text(f"""
        SELECT COUNT(*) as cnt
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE' {search_filter}
    """)
    count_result = db.execute(count_sql, params)
    total = count_result.scalar() or 0

    # List tables: join pg_class (reltuples) and pg_stat (n_live_tup) for row counts
    list_sql = text(f"""
        SELECT t.table_name, t.table_schema,
            GREATEST(0, COALESCE(pg.n_live_tup, c.reltuples::bigint, 0))::bigint as approximate_row_count
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name AND c.relkind = 'r'
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
        LEFT JOIN pg_stat_user_tables pg ON pg.schemaname = t.table_schema AND pg.relname = t.table_name
        WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE' {search_filter}
        ORDER BY {sort_expr} {order_dir}
        LIMIT :limit_val OFFSET :offset_val
    """)
    result = db.execute(list_sql, params)
    rows = result.fetchall()

    items = [
        TableListItem(
            table_name=row[0],
            table_schema=row[1],
            approximate_row_count=int(row[2]) if row[2] is not None and row[2] >= 0 else 0,
        )
        for row in rows
    ]

    return TableListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/tables/{table_name}", response_model=TableDetailResponse)
def get_table_details(
    table_name: str,
    db: Session = Depends(database.get_db),
):
    """
    Get table details: columns metadata and approximate row count.
    """
    # Validate table exists and get row count (pg_stat + pg_class fallback)
    check_sql = text("""
        SELECT t.table_schema, GREATEST(0, COALESCE(pg.n_live_tup, c.reltuples::bigint, 0))::bigint
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name AND c.relkind = 'r'
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
        LEFT JOIN pg_stat_user_tables pg ON pg.schemaname = t.table_schema AND pg.relname = t.table_name
        WHERE t.table_schema = 'public' AND t.table_name = :table_name AND t.table_type = 'BASE TABLE'
    """)
    check_result = db.execute(check_sql, {"table_name": table_name})
    check_row = check_result.fetchone()
    if not check_row:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")

    table_schema, approx_count = check_row[0], check_row[1]

    # Get columns
    cols_sql = text("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = :schema AND table_name = :table_name
        ORDER BY ordinal_position
    """)
    cols_result = db.execute(cols_sql, {"schema": table_schema, "table_name": table_name})
    columns = [
        ColumnInfo(
            column_name=row[0],
            data_type=row[1],
            is_nullable=row[2],
            column_default=row[3],
        )
        for row in cols_result.fetchall()
    ]

    return TableDetailResponse(
        table_name=table_name,
        table_schema=table_schema,
        approximate_row_count=int(approx_count) if approx_count is not None and approx_count >= 0 else 0,
        columns=columns,
    )
