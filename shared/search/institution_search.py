"""
Ranked institution search: multi-field matching, token + synonym expansion, and
personalization (boost schools in the signed-in user's education history).

Deterministic SQL scoring—no external ML service—tuned like lightweight LTR features.
"""
from __future__ import annotations

from typing import Any

from sqlalchemy import text

from shared.search.institution_query import (
    FAMILY_TOKENS,
    fold_for_like,
    significant_tokens,
    slugify_query,
    variants_for_token,
)


def user_institution_ids(db, user_id: int | None) -> list[int]:
    if not user_id:
        return []
    r = db.execute(
        text(
            "SELECT DISTINCT institution_id FROM education_entries "
            "WHERE user_id = :uid AND institution_id IS NOT NULL"
        ),
        {"uid": int(user_id)},
    )
    return [int(row.institution_id) for row in r.fetchall() if row.institution_id is not None]


def _bind_token_params(sig: list[str], raw: str, params: dict[str, Any], col: str = "z.h") -> str:
    folded = fold_for_like(raw.strip())
    params["fb"] = f"%{folded}%" if folded else "%"
    if not sig:
        return f"{col} LIKE :fb"
    parts: list[str] = []
    for ti, tok in enumerate(sig):
        variants = variants_for_token(tok)
        ors: list[str] = []
        for vi, v in enumerate(variants):
            key = f"tok_{ti}_{vi}"
            params[key] = f"%{v}%"
            ors.append(f"{col} LIKE :{key}")
        parts.append("(" + " OR ".join(ors) + ")")
    token_and = " AND ".join(parts)
    return f"(( {token_and} ) OR {col} LIKE :fb)"


def search_institutions_ranked(
    db,
    free_text: str,
    limit: int,
    offset: int = 0,
    user_id: int | None = None,
) -> tuple[list[dict], int]:
    raw = (free_text or "").strip()
    if len(raw) < 2:
        return [], 0

    sig = significant_tokens(raw)
    user_ids = user_institution_ids(db, user_id)
    ambiguous = bool(sig) and len(sig) == 1 and sig[0] in FAMILY_TOKENS
    edu_weight = 320 if ambiguous and user_ids else 180 if user_ids else 0
    if user_ids:
        ids_csv = ",".join(str(int(x)) for x in sorted(set(user_ids)))
        edu_sql = f"CASE WHEN m.id IN ({ids_csv}) THEN {edu_weight} ELSE 0 END"
    else:
        edu_sql = "0"

    slug_ex = slugify_query(raw)
    qlower = raw.lower()
    name_pf = qlower + "%" if len(qlower) >= 2 else "%"
    qwrap = f"%{qlower}%"
    has_ord = 1 if len(sig) >= 2 else 0
    ord_pat = "%" + "%".join(sig) + "%" if len(sig) >= 2 else ""

    params: dict[str, Any] = {
        "slug_ex": slug_ex,
        "name_pf": name_pf,
        "qwrap": qwrap,
        "has_ord": has_ord,
        "ord_pat": ord_pat,
        "lim": limit,
        "off": max(0, offset),
    }
    where_matched = _bind_token_params(sig, raw, params, col="z.h")

    hay = """LOWER(TRIM(
      COALESCE(i.name,'') || ' ' || COALESCE(i.short_name,'') || ' ' ||
      COALESCE(i.slug,'') || ' ' || COALESCE(i.city,'') || ' ' || COALESCE(i.state,'') || ' ' ||
      COALESCE(i.country,'') || ' ' || COALESCE(i.institution_type,'') || ' ' || COALESCE(i.description,'')
    ))"""

    rank_expr = f"""(
      CASE WHEN LOWER(m.slug) = :slug_ex THEN 420 ELSE 0 END +
      CASE WHEN LOWER(m.name) LIKE :name_pf THEN 260 ELSE 0 END +
      CASE WHEN LOWER(COALESCE(m.short_name,'')) LIKE :qwrap THEN 200 ELSE 0 END +
      CASE WHEN LOWER(COALESCE(m.name,'')) LIKE :qwrap THEN 120 ELSE 0 END +
      CASE WHEN LOWER(COALESCE(m.city,'')) LIKE :qwrap OR LOWER(COALESCE(m.state,'')) LIKE :qwrap THEN 70 ELSE 0 END +
      CASE WHEN LOWER(COALESCE(m.description,'')) LIKE :qwrap THEN 40 ELSE 0 END +
      CASE WHEN :has_ord = 1 AND m.h LIKE :ord_pat THEN 130 ELSE 0 END +
      CASE WHEN m.h LIKE :fb THEN 35 ELSE 0 END +
      {edu_sql}
    )"""

    cte = f"""
WITH hx AS (
  SELECT i.id, i.name, i.slug, i.logo_url, i.short_name, i.city, i.state, i.description,
         {hay} AS h
  FROM institutions i
  WHERE i.status = 'listed'
),
matched AS (
  SELECT * FROM hx z
  WHERE {where_matched}
)
"""

    sql = f"""
{cte}
SELECT m.id, m.name, m.slug, m.logo_url, {rank_expr} AS _rk
FROM matched m
ORDER BY _rk DESC, CHAR_LENGTH(m.name), m.name
LIMIT :lim OFFSET :off
"""

    rows = db.execute(text(sql), params).fetchall()

    count_sql = f"""
{cte}
SELECT COUNT(*) AS n FROM matched
"""
    count_params = {k: v for k, v in params.items() if k not in ("lim", "off")}
    total_row = db.execute(text(count_sql), count_params).fetchone()
    total = int(total_row.n) if total_row else 0

    items = [
        {
            "id": r.id,
            "name": r.name,
            "slug": r.slug,
            "logo_url": getattr(r, "logo_url", None),
            "href": f"/i/{r.slug}",
        }
        for r in rows
    ]
    return items, total
