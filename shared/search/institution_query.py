"""
Pure helpers for institution search: tokenization, stop-words, and city synonyms.
(No database / SQLAlchemy imports — safe for lightweight unit tests.)
"""
from __future__ import annotations

import re

_SHORT_OK = frozenset(
    {
        "iim",
        "iit",
        "nit",
        "iiit",
        "isb",
        "iisc",
        "bits",
        "xlri",
        "fms",
        "spjimr",
        "mdi",
        "iimc",
        "iima",
        "iimb",
        "iiml",
    }
)

_STOP = frozenset(
    {
        "of",
        "the",
        "and",
        "in",
        "at",
        "for",
        "a",
        "an",
        "to",
        "on",
        "india",
        "indian",
        "institute",
        "institution",
        "university",
        "college",
        "school",
        "faculty",
        "department",
        "management",
        "technology",
        "engineering",
        "science",
        "international",
        "national",
        "advanced",
        "studies",
        "research",
        "education",
        "academy",
        "centre",
        "center",
        "government",
        "public",
        "deemed",
        "autonomous",
    }
)

FAMILY_TOKENS = frozenset({"iim", "iit", "iiit", "nit", "iisc", "aiims", "isb", "bits"})

_TOKEN_ALIASES: dict[str, tuple[str, ...]] = {
    "bengaluru": ("bangalore",),
    "bangalore": ("bengaluru",),
    "kolkata": ("calcutta",),
    "calcutta": ("kolkata",),
    "mumbai": ("bombay",),
    "bombay": ("mumbai",),
    "chennai": ("madras",),
    "madras": ("chennai",),
    "puducherry": ("pondicherry",),
    "pondicherry": ("puducherry",),
}


def slugify_query(q: str) -> str:
    t = re.sub(r"[^a-z0-9]+", "-", (q or "").lower()).strip("-")
    return t[:80] if t else ""


def fold_for_like(q: str) -> str:
    t = re.sub(r"[^a-z0-9]+", "%", (q or "").lower()).strip("%")
    while "%%" in t:
        t = t.replace("%%", "%")
    return t


def variants_for_token(tok: str) -> list[str]:
    s = {tok}
    alts = _TOKEN_ALIASES.get(tok)
    if alts:
        s.update(alts)
    for key, vals in _TOKEN_ALIASES.items():
        if tok in vals:
            s.add(key)
            s.update(vals)
    return sorted(s)


def extract_query_tokens(raw: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", (raw or "").lower())


def significant_tokens(raw: str) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for t in extract_query_tokens(raw):
        if t in _STOP:
            continue
        if len(t) < 3 and t not in _SHORT_OK:
            continue
        if t not in seen:
            seen.add(t)
            out.append(t)
        if len(out) >= 10:
            break
    return out
