"""Seed listed organisations (Fortune 500 + India top 100) and institutions (engineering + B-schools).

Idempotent: INSERT ... ON CONFLICT (slug) DO UPDATE.

Run from repo root (or any cwd) after DB migrations:
  python3 core/setup/backend/seed_directory_entities.py

Requires DATABASE_URL (via shared database config).
"""
from __future__ import annotations

import csv
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

_this = os.path.abspath(__file__)
_backend = os.path.dirname(_this)
_setup = os.path.dirname(_backend)
_core = os.path.dirname(_setup)
_ws = os.path.dirname(_core)
for p in (_core, _ws):
    if p not in sys.path:
        sys.path.insert(0, p)

_SEED_MARKER = "india_institutions_engineering_100.json"


def _dir_seeds_path() -> Path:
    """Resolve seed files: only accept a directory that contains the bundle.

    - Monorepo: ``<workspace>/data/seeds/directory``
    - Cloud Run image: ``/core/data/seeds/directory`` (see Dockerfile.backend)
    - docker-compose: mount ``./data/seeds/directory:/core/data/seeds/directory`` because
      ``./core:/core`` hides image layers under ``/core``.
    """
    ws_candidate = Path(_ws) / "data" / "seeds" / "directory"
    core_candidate = Path(_core) / "data" / "seeds" / "directory"
    env_override = (os.environ.get("DIRECTORY_SEEDS_PATH") or "").strip()
    candidates = [core_candidate, ws_candidate]
    if env_override:
        candidates.insert(0, Path(env_override))
    for cand in candidates:
        if cand.is_dir() and (cand / _SEED_MARKER).is_file():
            return cand
    tried = ", ".join(str(p) for p in candidates)
    raise FileNotFoundError(
        f"Directory seed bundle not found (missing {_SEED_MARKER}). Tried: {tried}. "
        "For docker-compose bind-mount ./data/seeds/directory to /core/data/seeds/directory, "
        "or set DIRECTORY_SEEDS_PATH."
    )


DIR_SEEDS = _dir_seeds_path()


def _slug(s: str, max_len: int = 64) -> str:
    t = re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-") or "x"
    return t[:max_len]


def _norm_url(raw: str | None) -> str | None:
    w = (raw or "").strip()
    if not w:
        return None
    if w.startswith("http://") or w.startswith("https://"):
        return w
    return "https://" + w.lstrip("/")


def _domain_from_url(url: str | None) -> str | None:
    if not url:
        return None
    try:
        u = urlparse(url)
        host = (u.netloc or "").lower().replace("www.", "")
        return host or None
    except Exception:
        return None


def _favicon(domain: str | None) -> str | None:
    if not domain:
        return None
    return f"https://www.google.com/s2/favicons?domain={domain}&sz=256"


def _load_json(name: str) -> list[dict]:
    p = DIR_SEEDS / name
    return json.loads(p.read_text(encoding="utf-8"))


def _iter_fortune500_rows() -> list[dict]:
    p = DIR_SEEDS / "_fortune500_source.csv"
    with p.open(newline="", encoding="utf-8", errors="replace") as f:
        r = csv.reader(f)
        rows = list(r)
    if len(rows) < 2:
        return []
    header = rows[0]
    # First column is an index; data starts at column 1
    keys = [h.replace("\n", " ").strip() for h in header[1:]]
    out = []
    for row in rows[1:]:
        if len(row) < 2:
            continue
        cells = row[1:]
        d = {}
        for i, k in enumerate(keys):
            d[k] = cells[i] if i < len(cells) else ""
        out.append(d)
    return out


def _fortune_organisations() -> list[dict]:
    seen_slugs: dict[str, int] = {}
    orgs: list[dict] = []
    for d in _iter_fortune500_rows():
        name = (d.get("Company") or "").strip()
        if not name:
            continue
        rank = (d.get("Rank") or "").strip()
        industry = (d.get("Industry") or "").strip()
        city = (d.get("City") or "").strip()
        state = (d.get("State") or "").strip()
        website = _norm_url(d.get("Website") or "")
        employees = (d.get("Employees") or "").strip()
        revenue = (d.get("Revenue (in millions, USD)") or "").strip()
        profits = (d.get("Profits (in millions, USD)") or "").strip()
        ticker = (d.get("Ticker") or "").strip()
        ceo = (d.get("CEO") or "").strip()
        hq = ", ".join(x for x in [city, state, "United States"] if x)
        base = _slug(name)
        if base in seen_slugs:
            seen_slugs[base] += 1
            slug = f"{base}-{_slug(rank or str(seen_slugs[base]), 12)}".strip("-")[:64]
        else:
            seen_slugs[base] = 0
            slug = base[:64]
        dom = _domain_from_url(website)
        desc_parts = [
            f"{name} ranks #{rank} on the Fortune 500 (seed snapshot).",
            f"Industry: {industry}." if industry else "",
            f"Headquarters: {hq}." if hq.strip(", ") else "",
            f"Approximate headcount (directory field): {employees}." if employees else "",
            f"Reported revenue (USD millions): {revenue}." if revenue else "",
            f"Reported net profit (USD millions): {profits}." if profits else "",
            f"Stock ticker: {ticker}." if ticker else "",
            f"CEO: {ceo}." if ceo else "",
            f"Website: {website}." if website else "",
        ]
        description = " ".join(p for p in desc_parts if p)
        orgs.append(
            {
                "name": name[:255],
                "slug": slug,
                "short_name": (ticker[:128] if ticker else None),
                "organisation_type": "Public company",
                "industry": industry[:128] if industry else None,
                "headquarters": hq[:255] if hq else None,
                "founded_year": None,
                "company_size": employees[:64] if employees else None,
                "website": website[:255] if website else None,
                "logo_url": (_favicon(dom)[:512] if dom else None),
                "description": description or None,
            }
        )
    return orgs


def _upsert_organisation(db, row: dict) -> None:
    from sqlalchemy import text

    db.execute(
        text(
            """
            INSERT INTO organisations (
                name, slug, status, logo_url, description, website,
                short_name, organisation_type, industry, headquarters, founded_year, company_size
            ) VALUES (
                :name, :slug, 'listed', :logo_url, :description, :website,
                :short_name, :organisation_type, :industry, :headquarters, :founded_year, :company_size
            )
            ON CONFLICT (slug) DO UPDATE SET
                name = EXCLUDED.name,
                status = 'listed',
                logo_url = EXCLUDED.logo_url,
                description = EXCLUDED.description,
                website = EXCLUDED.website,
                short_name = EXCLUDED.short_name,
                organisation_type = EXCLUDED.organisation_type,
                industry = EXCLUDED.industry,
                headquarters = EXCLUDED.headquarters,
                founded_year = EXCLUDED.founded_year,
                company_size = EXCLUDED.company_size
            """
        ),
        {
            "name": row["name"],
            "slug": row["slug"],
            "logo_url": row.get("logo_url"),
            "description": row.get("description"),
            "website": row.get("website"),
            "short_name": row.get("short_name"),
            "organisation_type": row.get("organisation_type"),
            "industry": row.get("industry"),
            "headquarters": row.get("headquarters"),
            "founded_year": row.get("founded_year"),
            "company_size": row.get("company_size"),
        },
    )


def _upsert_institution(db, row: dict) -> None:
    from sqlalchemy import text

    db.execute(
        text(
            """
            INSERT INTO institutions (
                name, slug, status, logo_url, description, website,
                short_name, institution_type, founded_year, country, state, city, campus_type,
                wikipedia_url
            ) VALUES (
                :name, :slug, 'listed', :logo_url, :description, :website,
                :short_name, :institution_type, :founded_year, :country, :state, :city, :campus_type,
                :wikipedia_url
            )
            ON CONFLICT (slug) DO UPDATE SET
                name = EXCLUDED.name,
                status = 'listed',
                logo_url = EXCLUDED.logo_url,
                description = EXCLUDED.description,
                website = EXCLUDED.website,
                short_name = EXCLUDED.short_name,
                institution_type = EXCLUDED.institution_type,
                founded_year = EXCLUDED.founded_year,
                country = EXCLUDED.country,
                state = EXCLUDED.state,
                city = EXCLUDED.city,
                campus_type = EXCLUDED.campus_type,
                wikipedia_url = EXCLUDED.wikipedia_url
            """
        ),
        {
            "name": row["name"][:255],
            "slug": row["slug"][:64],
            "logo_url": (row.get("logo_url") or None),
            "description": row.get("description"),
            "website": (row.get("website") or None),
            "short_name": (row.get("short_name") or None),
            "institution_type": (row.get("institution_type") or None),
            "founded_year": row.get("founded_year"),
            "country": (row.get("country") or None),
            "state": (row.get("state") or None),
            "city": (row.get("city") or None),
            "campus_type": (row.get("campus_type") or None),
            "wikipedia_url": (row.get("wikipedia_url") or None),
        },
    )


def seed_directory() -> dict[str, int]:
    from sqlalchemy import text
    from shared.database.database import SessionLocal

    eng = _load_json("india_institutions_engineering_100.json")
    bs = _load_json("india_institutions_bschools.json")
    in_co = _load_json("india_companies_100.json")
    f500 = _fortune_organisations()

    counts = {"institutions": 0, "organisations": 0, "degree_rows": 0, "combo_rows": 0}

    db = SessionLocal()
    try:
        for row in eng + bs:
            _upsert_institution(db, row)
            counts["institutions"] += 1

        for row in in_co + f500:
            _upsert_organisation(db, row)
            counts["organisations"] += 1

        # Default programmes: engineering vs B-school
        majors_eng = '["Computer Science","Electrical Engineering","Mechanical Engineering","Civil Engineering"]'
        majors_mba = '["General Management","Finance","Marketing","Operations"]'

        ins_bt = text(
            """
            INSERT INTO institution_degree_majors (institution_id, degree, majors_json, status)
            SELECT i.id, 'B.Tech', :majors, 'listed'
            FROM institutions i
            WHERE i.slug = :slug
              AND NOT EXISTS (
                SELECT 1 FROM institution_degree_majors m
                WHERE m.institution_id = i.id AND m.degree = 'B.Tech'
              )
            """
        )
        for r in eng:
            res = db.execute(ins_bt, {"slug": r["slug"], "majors": majors_eng})
            counts["degree_rows"] += res.rowcount or 0

        ins_mba = text(
            """
            INSERT INTO institution_degree_majors (institution_id, degree, majors_json, status)
            SELECT i.id, 'MBA', :majors, 'listed'
            FROM institutions i
            WHERE i.slug = :slug
              AND NOT EXISTS (
                SELECT 1 FROM institution_degree_majors m
                WHERE m.institution_id = i.id AND m.degree = 'MBA'
              )
            """
        )
        for r in bs:
            res = db.execute(ins_mba, {"slug": r["slug"], "majors": majors_mba})
            counts["degree_rows"] += res.rowcount or 0

        ins_combo = text(
            """
            INSERT INTO organisation_combos (organisation_id, business_unit, function, title, status)
            SELECT o.id, 'Corporate', 'General', 'Professional', 'listed'
            FROM organisations o
            WHERE o.slug = :slug
              AND NOT EXISTS (SELECT 1 FROM organisation_combos c WHERE c.organisation_id = o.id)
            """
        )
        for r in in_co + f500:
            res = db.execute(ins_combo, {"slug": r["slug"]})
            counts["combo_rows"] += res.rowcount or 0

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    return counts


if __name__ == "__main__":
    c = seed_directory()
    print(
        "seed_directory_entities:",
        f"institutions upserts={c['institutions']}",
        f"organisations upserts={c['organisations']}",
        f"new degree_majors rows={c['degree_rows']}",
        f"new organisation_combos rows={c['combo_rows']}",
    )
