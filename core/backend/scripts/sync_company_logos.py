#!/usr/bin/env python3
"""
Sync company logos from database to local assets.

Fetches all companies, downloads ACTUAL brand logos (from apistemic + Clearbit APIs),
saves to ithras/assets/companies/, and updates logo_url in DB. Rejects placeholder images.
"""

import sys
import os
import io
import asyncio
import aiohttp
import re
import argparse
from pathlib import Path
from typing import Optional, Tuple
from urllib.parse import urlparse

try:
    from PIL import Image
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.modules.shared.database import SessionLocal
from app.modules.shared.models import Company

from app.config import settings

_scripts_dir = Path(__file__).resolve().parent
_ithras_root = _scripts_dir.parent.parent.parent
_assets_dir = _ithras_root / "assets" / "companies"
ASSETS_COMPANIES_DIR = settings.ASSETS_COMPANIES_DIR or str(_assets_dir)

# Minimum file size (bytes) - smaller images are likely placeholders
MIN_LOGO_SIZE = 500

# User-Agent for apistemic (required for server-side requests)
USER_AGENT = "IthrasPlacement/1.0 (+https://github.com/fig-agentics/pantheon)"

# Curated domain mapping for Indian and global companies (name pattern -> domain)
COMPANY_DOMAINS = {
    "accenture": "accenture.com",
    "adobe": "adobe.com",
    "airtel": "airtel.in",
    "amazon": "amazon.com",
    "american express": "americanexpress.com",
    "apple": "apple.com",
    "asian paints": "asianpaints.com",
    "axis bank": "axisbank.com",
    "bain": "bain.com",
    "bcg": "bcg.com",
    "boston consulting": "bcg.com",
    "bajaj": "bajajauto.com",
    "bajaj auto": "bajajauto.com",
    "capgemini": "capgemini.com",
    "cisco": "cisco.com",
    "citibank": "citi.com",
    "coca cola": "coca-cola.com",
    "coca-cola": "coca-cola.com",
    "cognizant": "cognizant.com",
    "dabur": "dabur.com",
    "deloitte": "deloitte.com",
    "ey": "ey.com",
    "ey parthenon": "ey.com",
    "flipkart": "flipkart.com",
    "goldman sachs": "goldmansachs.com",
    "google": "google.com",
    "hdfc bank": "hdfcbank.com",
    "hdfc life": "hdfclife.com",
    "hero motocorp": "heromotocorp.com",
    "hsbc": "hsbc.com",
    "icici bank": "icicibank.com",
    "icici securities": "icicisecurities.com",
    "icici prudential": "iciciprulife.com",
    "idfc first": "idfcfirstbank.com",
    "infosys": "infosys.com",
    "itc": "itcportal.com",
    "itc limited": "itcportal.com",
    "j.p. morgan": "jpmorgan.com",
    "jpmorgan": "jpmorgan.com",
    "jpmorgan chase": "jpmorgan.com",
    "kotak mahindra": "kotak.com",
    "kpmg": "kpmg.com",
    "larsen toubro": "larsentoubro.com",
    "l&t": "larsentoubro.com",
    "marico": "marico.com",
    "maruti suzuki": "marutisuzuki.com",
    "mastercard": "mastercard.com",
    "mckinsey": "mckinsey.com",
    "meta": "meta.com",
    "facebook": "meta.com",
    "microsoft": "microsoft.com",
    "morgan stanley": "morganstanley.com",
    "myntra": "myntra.com",
    "nestle": "nestle.com",
    "nestlé": "nestle.com",
    "nykaa": "nykaa.com",
    "ola": "olacabs.com",
    "oracle": "oracle.com",
    "paytm": "paytm.com",
    "pepsico": "pepsico.com",
    "pepsi": "pepsico.com",
    "pg": "pg.com",
    "p&g": "pg.com",
    "procter gamble": "pg.com",
    "pwc": "pwc.com",
    "pricewaterhouse": "pwc.com",
    "reliance": "ril.com",
    "reliance industries": "ril.com",
    "reliance retail": "relianceretail.com",
    "reliance jio": "jio.com",
    "salesforce": "salesforce.com",
    "sbi card": "sbicard.com",
    "standard chartered": "sc.com",
    "swiggy": "swiggy.com",
    "tata motors": "tatamotors.com",
    "tata steel": "tatasteel.com",
    "tata power": "tatapower.com",
    "tata capital": "tatacapital.com",
    "tata elxsi": "tataelxsi.com",
    "tcs": "tcs.com",
    "tata consultancy": "tcs.com",
    "uber": "uber.com",
    "unilever": "unilever.com",
    "hul": "hul.co.in",
    "hindustan unilever": "hul.co.in",
    "urban company": "urbancompany.com",
    "visa": "visa.com",
    "vodafone idea": "vi.co.in",
    "wipro": "wipro.com",
    "zomato": "zomato.com",
    "adani": "adaniport.com",
    "cipla": "cipla.com",
    "sun pharma": "sunpharma.com",
    "hcltech": "hcltech.com",
    "hcl tech": "hcltech.com",
    "ntpc": "ntpc.co.in",
    "bpcl": "bpcl.in",
    "hpcl": "hpcl.co.in",
    "iocl": "iocl.com",
    "indian oil": "iocl.com",
    "indian oil corporation": "iocl.com",
    "oil and natural gas": "ongcindia.com",
    "ongc": "ongcindia.com",
    "hindustan petroleum": "hpcl.co.in",
    "bharat petroleum": "bpcl.in",
    "tata administrative": "tata.com",
    "tas": "tata.com",
    "acc limited": "acclimited.com",
    "ambuja cements": "ambujacement.com",
    "ultratech": "ultratechcement.com",
    "tvsmotor": "tvsmotor.com",
    "tvs motor": "tvsmotor.com",
    "godrej": "godrej.com",
    "mahindra": "mahindra.com",
    "bennett coleman": "timesgroup.com",
    "times group": "timesgroup.com",
    "accenture strategy": "accenture.com",
    "infosys consulting": "infosys.com",
    "infosys bpm": "infosys.com",
}

CONTENT_TYPE_TO_EXT = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/svg+xml": "svg",
    "image/webp": "webp",
    "image/gif": "gif",
}


def get_domain_for_company(company_name: str) -> Optional[str]:
    """Get domain from curated mapping or guess from company name."""
    if not company_name or not company_name.strip():
        return None
    name_lower = company_name.lower().strip()
    # Direct match
    if name_lower in COMPANY_DOMAINS:
        return COMPANY_DOMAINS[name_lower]
    # Partial match - find best match
    name_clean = re.sub(r"[^a-z0-9\s]", " ", name_lower)
    name_clean = " ".join(name_clean.split())
    for key, domain in COMPANY_DOMAINS.items():
        if key in name_clean or name_clean in key:
            return domain
    # Guess from name: "McKinsey & Company" -> mckinsey
    clean = name_lower.replace("&", "and").replace(",", "").replace(".", "")
    clean = "".join(c for c in clean if c.isalnum() or c == " ")
    clean = clean.replace(" ", "").strip()
    if len(clean) < 4:
        return None
    return None  # Don't guess - use curated only for quality


def get_extension_from_content_type(content_type: str) -> str:
    """Infer file extension from Content-Type header."""
    if not content_type:
        return "png"
    ct = content_type.split(";")[0].strip().lower()
    return CONTENT_TYPE_TO_EXT.get(ct, "png")


def sanitize_company_id(company_id: str) -> str:
    """Ensure company_id is safe for filenames."""
    return re.sub(r'[^\w\-_]', '_', company_id) or "unknown"


def _session_headers() -> dict:
    return {"User-Agent": USER_AGENT}


def _to_webp(data: bytes, ext: str) -> Optional[bytes]:
    """Convert image bytes to WebP format. Returns None if conversion fails."""
    if not HAS_PILLOW:
        return data if ext == "webp" else None
    try:
        img = Image.open(io.BytesIO(data))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGBA")
        elif img.mode != "RGB":
            img = img.convert("RGB")
        out = io.BytesIO()
        img.save(out, "WEBP", quality=85)
        return out.getvalue()
    except Exception:
        return None


async def fetch_logo_url_apistemic(
    session: aiohttp.ClientSession, domain: str
) -> Optional[str]:
    """Try apistemic logos API (real brand logos, free). Returns URL or None."""
    url = f"https://logos-api.apistemic.com/domain:{domain}?fallback=404"
    try:
        async with session.get(
            url, timeout=aiohttp.ClientTimeout(total=5), headers=_session_headers()
        ) as resp:
            if resp.status == 200:
                ct = resp.headers.get("content-type", "")
                if "image" in ct:
                    return url  # Use same URL for download (404 when no logo)
    except Exception:
        pass
    return None


async def fetch_logo_url_clearbit(
    session: aiohttp.ClientSession, domain: str
) -> Optional[str]:
    """Try Clearbit Logo API."""
    url = f"https://logo.clearbit.com/{domain}"
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=3)) as resp:
            if resp.status == 200:
                ct = resp.headers.get("content-type", "")
                if "image" in ct:
                    return url
    except Exception:
        pass
    return None


async def fetch_logo_url_wikimedia(
    session: aiohttp.ClientSession, company_name: str
) -> Optional[str]:
    """
    Try Wikimedia Commons for company logo via Wikidata.
    Search Wikipedia -> get Wikidata entity -> P154 (logo image).
    Returns Commons redirect URL or None.
    """
    if not company_name or len(company_name.strip()) < 3:
        return None
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
            search_url, params=params, timeout=aiohttp.ClientTimeout(total=5), headers=_session_headers()
        ) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()
            results = data.get("query", {}).get("search", [])
            if not results:
                return None
            # Use first result (best match)
            title = results[0].get("title", "")
            if not title:
                return None

        # 2. Get page props to find Wikidata ID
        params2 = {
            "action": "query",
            "titles": title,
            "prop": "pageprops",
            "format": "json",
        }
        async with session.get(
            search_url, params=params2, timeout=aiohttp.ClientTimeout(total=5), headers=_session_headers()
        ) as resp:
            if resp.status != 200:
                return None
            data2 = await resp.json()
            pages = data2.get("query", {}).get("pages", {})
            page = next(iter(pages.values()), {})
            wikidata_id = page.get("pageprops", {}).get("wikibase_item")
            if not wikidata_id:
                return None

        # 3. Get P154 (logo image) from Wikidata
        wd_url = "https://www.wikidata.org/w/api.php"
        params3 = {
            "action": "wbgetentities",
            "ids": wikidata_id,
            "props": "claims",
            "format": "json",
        }
        async with session.get(
            wd_url, params=params3, timeout=aiohttp.ClientTimeout(total=5), headers=_session_headers()
        ) as resp:
            if resp.status != 200:
                return None
            data3 = await resp.json()
            entities = data3.get("entities", {})
            entity = entities.get(wikidata_id, {})
            claims = entity.get("claims", {})
            p154 = claims.get("P154", [])
            if not p154:
                return None
            # Get mainsnak value
            mainsnak = p154[0].get("mainsnak", {})
            if mainsnak.get("snaktype") != "value":
                return None
            datavalue = mainsnak.get("datavalue", {})
            value = datavalue.get("value", {})
            filename = value.get("text") or value.get("id")
            if not filename:
                return None
            # Commons redirect URL (works for any Commons file)
            return f"https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/{filename}&width=300"
    except Exception:
        pass
    return None


async def fetch_logo_url(
    session: aiohttp.ClientSession, company_name: str
) -> Optional[str]:
    """
    Fetch actual company logo URL. Tries Wikimedia first, then apistemic + Clearbit.
    Returns None if no real logo (never returns UI Avatars or other placeholders).
    """
    # Try Wikimedia first (works by company name, no domain needed)
    url = await fetch_logo_url_wikimedia(session, company_name or "")
    if url:
        return url
    domain = get_domain_for_company(company_name)
    if not domain:
        return None
    # Try apistemic (better coverage for many brands)
    url = await fetch_logo_url_apistemic(session, domain)
    if url:
        return url
    # Fallback to Clearbit
    url = await fetch_logo_url_clearbit(session, domain)
    return url


async def download_logo(
    session: aiohttp.ClientSession, url: str, company_id: str
) -> Optional[Tuple[bytes, str]]:
    """
    Download logo from URL. Returns (bytes, ext) or None. Rejects placeholders (small images).
    """
    try:
        headers = _session_headers() if ("apistemic" in url or "wikimedia" in url) else {}
        async with session.get(
            url, timeout=aiohttp.ClientTimeout(total=10), headers=headers
        ) as resp:
            if resp.status != 200:
                return None
            content_type = resp.headers.get("content-type", "")
            ext = get_extension_from_content_type(content_type)
            if ext == "png" and "svg" in content_type:
                ext = "svg"
            data = await resp.read()
            # Reject placeholder images (too small)
            if len(data) < MIN_LOGO_SIZE:
                return None
            return (data, ext)
    except Exception as e:
        print(f"  ✗ Failed to download {url[:60]}...: {e}")
        return None


async def sync_one_company(
    session: aiohttp.ClientSession,
    company: Company,
    output_dir: str,
    force: bool = False,
) -> Optional[str]:
    """
    Sync a single company's logo. Returns local path on success, None on failure/skip.
    """
    company_id = sanitize_company_id(company.id)
    logo_url = company.logo_url

    if not force and logo_url and logo_url.startswith("/assets/companies/"):
        filename = logo_url.split("/")[-1]
        filepath = os.path.join(output_dir, filename)
        if os.path.exists(filepath) and os.path.getsize(filepath) >= MIN_LOGO_SIZE:
            return logo_url  # Already has real logo

    source_url = None
    if logo_url and (logo_url.startswith("http://") or logo_url.startswith("https://")):
        if "ui-avatars" in logo_url:
            source_url = None
        else:
            source_url = logo_url
    if not source_url:
        source_url = await fetch_logo_url(session, company.name or "")

    if not source_url:
        return None

    result = await download_logo(session, source_url, company_id)
    if not result:
        return None

    data, ext = result
    # Always save as WebP for consistency and smaller size
    if ext != "webp" and HAS_PILLOW:
        webp_data = _to_webp(data, ext)
        if webp_data:
            data = webp_data
            ext = "webp"
    filename = f"{company_id}.{ext}"
    filepath = os.path.join(output_dir, filename)

    try:
        with open(filepath, "wb") as f:
            f.write(data)
    except OSError as e:
        print(f"  ✗ Failed to write {filepath}: {e}")
        return None

    return f"/assets/companies/{filename}"


def sync_all(db: Session, output_dir: str, force: bool = False) -> Tuple[int, int, int]:
    """
    Sync all companies. Returns (success_count, fail_count, skipped_count).
    """
    async def run():
        success = 0
        fail = 0
        skipped = 0
        async with aiohttp.ClientSession() as session:
            companies = db.query(Company).all()
            for company in companies:
                result = await sync_one_company(session, company, output_dir, force=force)
                if result:
                    company.logo_url = result
                    db.add(company)
                    success += 1
                    print(f"  ✓ {company.name} -> {result}")
                elif not get_domain_for_company(company.name or ""):
                    skipped += 1
                    print(f"  ⊘ {company.name} (no domain mapping)")
                else:
                    fail += 1
                    print(f"  ✗ {company.name} (no logo found)")
        return success, fail, skipped

    return asyncio.run(run())


def main():
    parser = argparse.ArgumentParser(description="Sync company logos to local assets")
    parser.add_argument(
        "--force",
        "-f",
        action="store_true",
        help="Re-download all logos (replace existing, including placeholders)",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("Sync Company Logos (Real Brand Logos Only)")
    print("=" * 60)

    output_dir = ASSETS_COMPANIES_DIR
    os.makedirs(output_dir, exist_ok=True)
    print(f"\nOutput directory: {output_dir}")
    print(f"Force mode: {args.force}\n")

    db = SessionLocal()
    try:
        companies_count = db.query(Company).count()
        print(f"Companies in DB: {companies_count}\n")

        if companies_count == 0:
            print("No companies to sync.")
            return 0

        success, fail, skipped = sync_all(db, output_dir, force=args.force)
        db.commit()

        print("\n" + "=" * 60)
        print(f"Done: {success} synced, {fail} no logo, {skipped} no mapping")
        print("=" * 60)
        return 0 if fail == 0 else 1
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
