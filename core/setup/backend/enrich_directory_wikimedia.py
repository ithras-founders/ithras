"""Set logo_url from Wikidata / Wikimedia Commons using each row's wikipedia_url.

Resolves: enwiki title → Wikidata Q → P154 (logo) first, then P18 (image), then enwiki pageimages.

  python3 core/setup/backend/enrich_directory_wikimedia.py
  python3 core/setup/backend/enrich_directory_wikimedia.py --force

Use --force to replace existing Commons / upload.wikimedia.org URLs (e.g. after improving priority).

Requires network and valid TLS trust store (~0.35s between API calls).
"""
from __future__ import annotations

import json
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DIR_SEEDS = ROOT / "data" / "seeds" / "directory"

UA = "IthrasDirectorySeed/1.0 (directory logos via Wikidata; contact: ops@ithras)"
DELAY_SEC = 0.35


def _ssl_context() -> ssl.SSLContext:
    try:
        import certifi  # type: ignore

        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def _get_json(url: str) -> dict | list | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30, context=_ssl_context()) as resp:
            return json.loads(resp.read().decode("utf-8", errors="replace"))
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError, OSError):
        return None


def title_from_wikipedia_url(url: str) -> str | None:
    if not url or "wikipedia.org" not in url.lower():
        return None
    try:
        path = urllib.parse.urlparse(url).path
        if "/wiki/" not in path:
            return None
        raw = path.split("/wiki/", 1)[-1]
        return urllib.parse.unquote(raw).replace("_", " ")
    except Exception:
        return None


def commons_filepath_url(filename: str) -> str:
    fn = (filename or "").strip().replace(" ", "_")
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(fn, safe="_()%")


def enwiki_original_pageimage(title: str) -> str | None:
    """Lead / page image from enwiki when Wikidata has no P18/P154."""
    if not title:
        return None
    params = {
        "action": "query",
        "titles": title,
        "prop": "pageimages",
        "piprop": "original",
        "format": "json",
        "redirects": 1,
    }
    url = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode(params)
    data = _get_json(url)
    time.sleep(DELAY_SEC)
    if not data or "query" not in data:
        return None
    for page in (data["query"].get("pages") or {}).values():
        if page.get("missing") or page.get("invalid"):
            continue
        orig = page.get("original") or {}
        src = orig.get("source")
        if isinstance(src, str) and src.startswith("https://upload.wikimedia.org"):
            return src
    return None


def wikidata_id_for_enwiki_title(title: str) -> str | None:
    if not title:
        return None
    params = {
        "action": "query",
        "prop": "pageprops",
        "ppprop": "wikibase_item",
        "format": "json",
        "titles": title,
    }
    url = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode(params)
    data = _get_json(url)
    time.sleep(DELAY_SEC)
    if not data or "query" not in data:
        return None
    for page in (data["query"].get("pages") or {}).values():
        if page.get("missing") or page.get("invalid"):
            continue
        pp = page.get("pageprops") or {}
        q = pp.get("wikibase_item")
        if q and isinstance(q, str) and q.startswith("Q"):
            return q
    return None


def _first_filename_p18(claims: dict) -> str | None:
    for stmt in claims.get("P18") or []:
        sn = stmt.get("mainsnak") or {}
        if sn.get("snaktype") != "value":
            continue
        dv = sn.get("datavalue") or {}
        if dv.get("type") == "string" and isinstance(dv.get("value"), str):
            return dv["value"]
    return None


def _first_logo_entity_id(claims: dict) -> str | None:
    for stmt in claims.get("P154") or []:
        sn = stmt.get("mainsnak") or {}
        if sn.get("snaktype") != "value":
            continue
        dv = sn.get("datavalue") or {}
        if dv.get("type") == "wikibase-entityid":
            val = dv.get("value") or {}
            q = val.get("id")
            if q and isinstance(q, str) and q.startswith("Q"):
                return q
    return None


def commons_url_from_file_entity(qid: str) -> str | None:
    params = {"action": "wbgetentities", "ids": qid, "props": "sitelinks", "format": "json"}
    url = "https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode(params)
    data = _get_json(url)
    time.sleep(DELAY_SEC)
    if not data or "entities" not in data:
        return None
    ent = (data["entities"] or {}).get(qid) or {}
    title = (ent.get("sitelinks") or {}).get("commonswiki", {}).get("title")
    if not title or not isinstance(title, str):
        return None
    if title.startswith("File:"):
        title = title[5:]
    return commons_filepath_url(title)


def wikimedia_logo_url_for_wikipedia_article(title: str) -> str | None:
    qid = wikidata_id_for_enwiki_title(title)
    if qid:
        params = {"action": "wbgetentities", "ids": qid, "props": "claims", "format": "json"}
        url = "https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode(params)
        data = _get_json(url)
        time.sleep(DELAY_SEC)
        if data and "entities" in data:
            ent = (data["entities"] or {}).get(qid) or {}
            claims = ent.get("claims") or {}
            logo_q = _first_logo_entity_id(claims)
            if logo_q:
                u = commons_url_from_file_entity(logo_q)
                if u:
                    return u
            p18 = _first_filename_p18(claims)
            if p18:
                return commons_filepath_url(p18)
    return enwiki_original_pageimage(title)


def enrich_record(rec: dict, *, force: bool) -> bool:
    wiki_url = (rec.get("wikipedia_url") or "").strip()
    title = title_from_wikipedia_url(wiki_url)
    if not title:
        return False
    img = wikimedia_logo_url_for_wikipedia_article(title)
    if not img or not img.startswith("http"):
        return False
    old = (rec.get("logo_url") or "").lower()
    if not force and ("commons.wikimedia.org" in old or "upload.wikimedia.org" in old):
        return False
    if rec.get("logo_url") == img:
        return False
    rec["logo_url"] = img
    return True


def run_file(path: Path, *, force: bool) -> tuple[int, int]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        return 0, 0
    n_upd = 0
    for rec in data:
        if isinstance(rec, dict) and enrich_record(rec, force=force):
            n_upd += 1
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(data), n_upd


def main() -> None:
    force = "--force" in sys.argv
    if force:
        print("mode: force (replacing existing Wikimedia logo URLs where a new URL is resolved)")
    for name in ("india_institutions_engineering_100.json", "india_institutions_bschools.json"):
        fp = DIR_SEEDS / name
        if not fp.exists():
            print("skip missing", fp)
            continue
        total, upd = run_file(fp, force=force)
        print(fp.name, "records", total, "logos updated", upd)


if __name__ == "__main__":
    main()
