"""
Database introspection and query execution API for Analytics.
Lists tables, table details, refresh stats, and execute SQL.
"""
import re
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional, Any
from pydantic import BaseModel

from app.modules.shared import database

router = APIRouter(prefix="/api/v1/analytics/database", tags=["analytics-database"])

MAX_RESULT_ROWS = 10000


def _is_read_only(query: str) -> bool:
    """Check if query appears to be SELECT-only (no INSERT/UPDATE/DELETE)."""
    q = re.sub(r'--.*$', '', query, flags=re.MULTILINE)
    q = re.sub(r'/\*.*?\*/', '', q, flags=re.DOTALL)
    q = q.strip().upper()
    if not q:
        return True
    first_word = q.split()[0] if q else ''
    return first_word in ('SELECT', 'WITH', 'SHOW', 'DESCRIBE', 'EXPLAIN')


@router.post("/refresh-stats")
def refresh_stats(db: Session = Depends(database.get_db)):
    """Run ANALYZE on all public tables to update row count estimates."""
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
    is_primary_key: bool = False


class TableDetailResponse(BaseModel):
    table_name: str
    table_schema: str
    approximate_row_count: Optional[int] = None
    columns: List[ColumnInfo]
    primary_key_columns: List[str] = []


class ExecuteRequest(BaseModel):
    query: str
    params: Optional[List[Any]] = None
    read_only: bool = True


class ExecuteResponse(BaseModel):
    columns: List[str]
    rows: List[List[Any]]
    row_count: int
    error: Optional[str] = None


@router.get("/tables", response_model=TableListResponse)
def get_tables(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("table_name"),
    order: str = Query("asc"),
    db: Session = Depends(database.get_db),
):
    """List database tables with pagination, filter, and sort."""
    order_dir = "DESC" if order.lower() == "desc" else "ASC"
    if sort_by not in ("table_name", "approximate_row_count"):
        sort_by = "table_name"
    row_count_expr = "GREATEST(0, COALESCE(pg.n_live_tup, c.reltuples::bigint))"
    sort_expr = "table_name" if sort_by == "table_name" else row_count_expr
    offset_val = (page - 1) * page_size

    search_filter = ""
    params = {"limit_val": page_size, "offset_val": offset_val}
    if search and search.strip():
        search_filter = "AND t.table_name ILIKE :search_pattern"
        params["search_pattern"] = f"%{search.strip()}%"

    count_sql = text(f"""
        SELECT COUNT(*) as cnt FROM information_schema.tables t
        WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE' {search_filter}
    """)
    total = db.execute(count_sql, params).scalar() or 0

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
    rows = db.execute(list_sql, params).fetchall()
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
def get_table_details(table_name: str, db: Session = Depends(database.get_db)):
    """Get table details: columns and approximate row count."""
    check_sql = text("""
        SELECT t.table_schema, GREATEST(0, COALESCE(pg.n_live_tup, c.reltuples::bigint, 0))::bigint
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name AND c.relkind = 'r'
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
        LEFT JOIN pg_stat_user_tables pg ON pg.schemaname = t.table_schema AND pg.relname = t.table_name
        WHERE t.table_schema = 'public' AND t.table_name = :table_name AND t.table_type = 'BASE TABLE'
    """)
    check_row = db.execute(check_sql, {"table_name": table_name}).fetchone()
    if not check_row:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
    table_schema, approx_count = check_row[0], check_row[1]

    pk_sql = text("""
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        JOIN pg_class c ON c.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = :schema AND c.relname = :table_name AND i.indisprimary
          AND a.attnum > 0 AND NOT a.attisdropped
        ORDER BY array_position(i.indkey, a.attnum)
    """)
    pk_rows = db.execute(pk_sql, {"schema": table_schema, "table_name": table_name}).fetchall()
    primary_key_columns = [row[0] for row in pk_rows]

    cols_sql = text("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = :schema AND table_name = :table_name
        ORDER BY ordinal_position
    """)
    cols = db.execute(cols_sql, {"schema": table_schema, "table_name": table_name}).fetchall()
    pk_set = set(primary_key_columns)
    columns = [
        ColumnInfo(
            column_name=row[0],
            data_type=row[1],
            is_nullable=row[2],
            column_default=row[3],
            is_primary_key=row[0] in pk_set,
        )
        for row in cols
    ]
    return TableDetailResponse(
        table_name=table_name,
        table_schema=table_schema,
        approximate_row_count=int(approx_count) if approx_count is not None and approx_count >= 0 else 0,
        columns=columns,
        primary_key_columns=primary_key_columns,
    )


@router.post("/execute", response_model=ExecuteResponse)
def execute_query(req: ExecuteRequest, db: Session = Depends(database.get_db)):
    """
    Execute SQL query. When read_only=true, blocks INSERT/UPDATE/DELETE.
    Limits result to MAX_RESULT_ROWS. Uses parameterized execution.
    """
    query = (req.query or "").strip()
    if not query:
        return ExecuteResponse(columns=[], rows=[], row_count=0, error="Empty query")

    if req.read_only and not _is_read_only(query):
        return ExecuteResponse(
            columns=[], rows=[], row_count=0,
            error="Write operations (INSERT/UPDATE/DELETE) are disabled in read-only mode"
        )

    try:
        params = req.params
        if isinstance(params, dict) and params:
            result = db.execute(text(query), params)
        else:
            result = db.execute(text(query))

        if result.returns_rows:
            rows = result.fetchmany(MAX_RESULT_ROWS + 1)
            if len(rows) > MAX_RESULT_ROWS:
                rows = rows[:MAX_RESULT_ROWS]
            columns = list(result.keys())
            serialized = []
            for row in rows:
                serialized.append([
                    str(v) if hasattr(v, 'isoformat') else v
                    for v in row
                ])
            return ExecuteResponse(columns=columns, rows=serialized, row_count=len(serialized))
        else:
            db.commit()
            return ExecuteResponse(columns=[], rows=[], row_count=0)
    except Exception as e:
        db.rollback()
        return ExecuteResponse(columns=[], rows=[], row_count=0, error=str(e))
