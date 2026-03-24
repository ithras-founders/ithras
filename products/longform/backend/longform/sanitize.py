"""Sanitize LongForm post HTML (server-side, aligned with DOMPurify on the client)."""
from __future__ import annotations

from copy import deepcopy

_LONGFORM_TAGS = frozenset(
    {
        "p",
        "br",
        "strong",
        "em",
        "b",
        "i",
        "u",
        "s",
        "strike",
        "del",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "blockquote",
        "code",
        "pre",
        "hr",
        "a",
        "img",
        "sup",
        "sub",
        "span",
    }
)

_ALLOWED_FONT_SIZES = frozenset({"14px", "17px", "20px", "24px"})
_ALLOWED_FONT_FAMILIES = frozenset(
    {
        "georgia, times new roman, serif",
        "ui-sans-serif, system-ui, sans-serif",
        "ui-monospace, monospace",
    }
)


def _norm_font_family_value(value: str) -> str:
    s = value.replace('"', "").replace("'", "").lower()
    parts = [p.strip() for p in s.split(",") if p.strip()]
    return ", ".join(parts)


def _font_family_allowed(value: str) -> bool:
    return _norm_font_family_value(value) in _ALLOWED_FONT_FAMILIES


def _sanitize_span_style(value: str | None) -> str | None:
    if not value:
        return None
    allowed: list[str] = []
    for decl in value.split(";"):
        decl = decl.strip()
        if not decl or ":" not in decl:
            continue
        prop, _, val = decl.partition(":")
        prop = prop.strip().lower()
        val = val.strip()
        if prop == "font-size" and val in _ALLOWED_FONT_SIZES:
            allowed.append(f"font-size: {val}")
        elif prop == "font-family" and _font_family_allowed(val):
            allowed.append(f"font-family: {val}")
    if not allowed:
        return None
    return "; ".join(allowed)


def _attr_filter(tag: str, attr: str, value: str | None) -> str | None:
    if value is None:
        return None
    v = value.strip()
    if tag == "a" and attr == "href":
        if v.startswith(("/", "http://", "https://", "mailto:")):
            return v
        return None
    if tag == "img" and attr == "src":
        if v.startswith(("/", "http://", "https://")):
            return v
        return None
    if tag == "span" and attr == "style":
        return _sanitize_span_style(v)
    return value


def sanitize_longform_body(html: str) -> str:
    """Lazy-import nh3 so listing/reading LongForm works even if a dev env missed `pip install nh3`."""
    try:
        import nh3
    except ImportError as e:
        raise RuntimeError(
            "LongForm requires the 'nh3' package (HTML sanitization). "
            "Run: pip install -r core/app/backend/requirements.txt (or rebuild the API image)."
        ) from e
    if not html:
        return ""
    attrs = deepcopy(nh3.ALLOWED_ATTRIBUTES)
    # Do not whitelist "rel" on <a> when link_rel is set — ammonia forbids both.
    attrs["a"] = set(attrs.get("a", set())) | {"href", "title"}
    attrs["img"] = set(attrs.get("img", set())) | {"src", "alt", "title", "width", "height"}
    attrs["span"] = {"style"}
    attrs["sup"] = set(attrs.get("sup", set()))
    attrs["sub"] = set(attrs.get("sub", set()))
    allowed_attr_map = {k: v for k, v in attrs.items() if k == "*" or k in _LONGFORM_TAGS}
    return nh3.clean(
        html,
        tags=_LONGFORM_TAGS,
        attributes=allowed_attr_map,
        attribute_filter=_attr_filter,
        link_rel="noopener noreferrer",
    )
