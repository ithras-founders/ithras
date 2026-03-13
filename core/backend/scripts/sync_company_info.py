#!/usr/bin/env python3
"""
Fetch and populate company headquarters and founding_year from Wikipedia/Wikidata.

Uses Wikipedia search -> Wikidata entity -> P159 (headquarters), P571 (inception).
Updates companies in DB. Run after sync_company_logos or independently.
"""

import sys
import os
import argparse
import asyncio
import aiohttp
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.modules.shared.database import SessionLocal
from app.modules.shared.models import Company

USER_AGENT = "IthrasPlacement/1.0 (+https://github.com/fig-agentics/ithras)"


def _headers():
    return {"User-Agent": USER_AGENT}


async def fetch_company_info(
    session: aiohttp.ClientSession, company_name: str
) -> tuple[str | None, int | None]:
    """
    Fetch headquarters and founding_year from Wikidata.
    Returns (headquarters_str, founding_year_int) or (None, None).
    """
    if not company_name or len(company_name.strip()) < 3:
        return (None, None)
    try:
        # 1. Search Wikipedia for the company
        search_url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "list": "search",
            "srsearch": company_name.strip(),
            "srlimit": 3,
            "format": "json",
        }
        async with session.get(
            search_url, params=params, timeout=aiohttp.ClientTimeout(total=5), headers=_headers()
        ) as resp:
            if resp.status != 200:
                return (None, None)
            data = await resp.json()
            results = data.get("query", {}).get("search", [])
            if not results:
                return (None, None)
            title = results[0].get("title", "")
            if not title:
                return (None, None)

        # 2. Get Wikidata ID from page
        params2 = {
            "action": "query",
            "titles": title,
            "prop": "pageprops",
            "format": "json",
        }
        async with session.get(
            search_url, params=params2, timeout=aiohttp.ClientTimeout(total=5), headers=_headers()
        ) as resp:
            if resp.status != 200:
                return (None, None)
            data2 = await resp.json()
            pages = data2.get("query", {}).get("pages", {})
            page = next(iter(pages.values()), {})
            wikidata_id = page.get("pageprops", {}).get("wikibase_item")
            if not wikidata_id:
                return (None, None)

        # 3. Get P159 (headquarters) and P571 (inception) from Wikidata
        wd_url = "https://www.wikidata.org/w/api.php"
        params3 = {
            "action": "wbgetentities",
            "ids": wikidata_id,
            "props": "claims",
            "format": "json",
        }
        async with session.get(
            wd_url, params=params3, timeout=aiohttp.ClientTimeout(total=5), headers=_headers()
        ) as resp:
            if resp.status != 200:
                return (None, None)
            data3 = await resp.json()
            entities = data3.get("entities", {})
            entity = entities.get(wikidata_id, {})
            claims = entity.get("claims", {})

            headquarters = None
            founding_year = None

            # P159 = headquarters location (can be item or string)
            p159 = claims.get("P159", [])
            if p159:
                mainsnak = p159[0].get("mainsnak", {})
                if mainsnak.get("snaktype") == "value":
                    datavalue = mainsnak.get("datavalue", {}).get("value", {})
                    # Can be {"id": "Q123"} (item) or {"text": "..."} (string)
                    if "id" in datavalue:
                        # Resolve item label
                        qid = datavalue["id"]
                        label = await _get_wikidata_label(session, qid)
                        headquarters = label
                    elif "text" in datavalue:
                        headquarters = datavalue.get("text", "").strip() or None

            # P571 = inception (founded)
            p571 = claims.get("P571", [])
            if p571:
                mainsnak = p571[0].get("mainsnak", {})
                if mainsnak.get("snaktype") == "value":
                    datavalue = mainsnak.get("datavalue", {}).get("value", {})
                    time_str = datavalue.get("time", "")
                    # Format: "+1926-00-00T00:00:00Z" -> 1926
                    if time_str and time_str.startswith("+"):
                        try:
                            founding_year = int(time_str[1:5])
                        except (ValueError, IndexError):
                            pass

            return (headquarters, founding_year)
    except Exception:
        pass
    return (None, None)


async def _get_wikidata_label(session: aiohttp.ClientSession, qid: str) -> str | None:
    """Get English label for a Wikidata item."""
    try:
        wd_url = "https://www.wikidata.org/w/api.php"
        params = {
            "action": "wbgetentities",
            "ids": qid,
            "props": "labels",
            "languages": "en",
            "format": "json",
        }
        async with session.get(
            wd_url, params=params, timeout=aiohttp.ClientTimeout(total=3), headers=_headers()
        ) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()
            entity = data.get("entities", {}).get(qid, {})
            labels = entity.get("labels", {})
            en = labels.get("en", {})
            return en.get("value") if en else None
    except Exception:
        return None


async def sync_all_companies(db: Session) -> tuple[int, int]:
    """Fetch and update company info. Returns (updated_count, skip_count)."""
    updated = 0
    skipped = 0

    async with aiohttp.ClientSession() as session:
        companies = db.query(Company).all()
        for company in companies:
            if not company.name:
                skipped += 1
                continue
            hq, year = await fetch_company_info(session, company.name)
            changed = False
            if hq and (not company.headquarters or company.headquarters != hq):
                company.headquarters = hq
                changed = True
            if year is not None and (company.founding_year is None or company.founding_year != year):
                company.founding_year = year
                changed = True
            if changed:
                db.add(company)
                updated += 1
                print(f"  ✓ {company.name} -> HQ: {hq or '-'}, Founded: {year or '-'}")
            else:
                skipped += 1
    return updated, skipped


def main():
    parser = argparse.ArgumentParser(description="Sync company headquarters and founding year from Wikidata")
    parser.add_argument("--dry-run", action="store_true", help="Fetch but do not commit")
    args = parser.parse_args()

    print("=" * 60)
    print("Sync Company Info (Headquarters, Founding Year)")
    print("=" * 60)

    db = SessionLocal()
    try:
        count = db.query(Company).count()
        print(f"\nCompanies in DB: {count}\n")
        if count == 0:
            print("No companies to sync.")
            return 0

        updated, skipped = asyncio.run(sync_all_companies(db))
        if not args.dry_run and updated > 0:
            db.commit()
        elif args.dry_run:
            db.rollback()
            print("\n[DRY RUN] No changes committed.")

        print("\n" + "=" * 60)
        print(f"Done: {updated} updated, {skipped} skipped/unchanged")
        print("=" * 60)
        return 0
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
