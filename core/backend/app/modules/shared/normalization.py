"""Normalization helpers for canonical lookup keys."""
import re


def normalize_canonical_key(value: str) -> str:
    """Normalize free-text keys for case-insensitive duplicate detection."""
    return re.sub(r"\s+", " ", (value or "").strip().lower())

