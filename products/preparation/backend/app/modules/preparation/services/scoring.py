"""Deterministic scoring for CV, PI, WAT - no AI, rule-based."""
import json
import os
import re
from typing import Dict, List, Any, Optional


def _load_rubric(rubric_name: str) -> dict:
    """Load rubric config from JSON file."""
    config_dir = os.path.join(os.path.dirname(__file__), "..", "config", "rubrics")
    path = os.path.join(config_dir, f"{rubric_name}.json")
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _check_format_complete(cv_data: dict) -> bool:
    """Rule: CV has key sections (education, experience, skills, achievements)."""
    required = ["education", "experience", "skills", "achievements"]
    data_str = json.dumps(cv_data).lower() if isinstance(cv_data, dict) else str(cv_data).lower()
    # Simple heuristic: section keys or common headers present
    section_keywords = ["education", "experience", "work", "skills", "achievement", "project"]
    found = sum(1 for k in section_keywords if k in data_str)
    return found >= 3


def _check_impact_quantified(text: str) -> bool:
    """Rule: Text contains numbers/metrics (%, $, numbers)."""
    if not text:
        return False
    return bool(re.search(r"\d+%|\d+\s*(?:x|%|people|users|revenue|\$|Rs\.?|cr|mn)", text, re.I))


def _check_action_verbs(text: str) -> bool:
    """Rule: Contains strong action verbs."""
    action_verbs = [
        "led", "managed", "built", "created", "developed", "implemented",
        "improved", "increased", "reduced", "designed", "launched", "achieved",
        "drove", "established", "executed", "optimized", "scaled",
    ]
    text_lower = (text or "").lower()
    return any(v in text_lower for v in action_verbs)


def _check_no_generic_claims(text: str) -> bool:
    """Rule: Avoid generic phrases like 'hard worker', 'team player' without proof."""
    generic = ["hard worker", "team player", "quick learner", "passionate", "dedicated"]
    text_lower = (text or "").lower()
    return not any(g in text_lower for g in generic)


def compute_cv_readiness_score(cv_data: dict, cv_text: Optional[str] = None) -> Dict[str, Any]:
    """
    Rule-based CV checklist score. Returns score (0-100), checklist results, and suggestions.
    """
    rubric = _load_rubric("cv_checklist")
    checks = rubric.get("checks", [])
    text = cv_text or json.dumps(cv_data) if isinstance(cv_data, dict) else str(cv_data)

    checklist = {}
    for c in checks:
        cid = c.get("id", "")
        if cid == "format_complete":
            checklist[cid] = _check_format_complete(cv_data if isinstance(cv_data, dict) else {})
        elif cid == "impact_quantified":
            checklist[cid] = _check_impact_quantified(text)
        elif cid == "action_verbs":
            checklist[cid] = _check_action_verbs(text)
        elif cid == "role_depth":
            checklist[cid] = len(text.split()) > 100 and _check_action_verbs(text)
        elif cid == "achievements_listed":
            checklist[cid] = "achievement" in text.lower() or "achieved" in text.lower()
        elif cid == "no_generic_claims":
            checklist[cid] = _check_no_generic_claims(text)
        else:
            checklist[cid] = False

    total = 0.0
    for c in checks:
        w = c.get("weight", 0)
        if checklist.get(c.get("id", "")):
            total += w
    score = round(min(100, total * 100), 1)

    suggestions = []
    for c in checks:
        if not checklist.get(c.get("id", "")):
            suggestions.append(f"Improve: {c.get('name', c.get('id', ''))}")

    return {
        "score": score,
        "checklist": checklist,
        "suggestions": suggestions[:5],
    }


def compute_pi_rubric_score(
    clarity: float = 0,
    structure: float = 0,
    relevance: float = 0,
    confidence: float = 0,
    dimensions: Optional[Dict[str, float]] = None,
) -> float:
    """Aggregate PI rubric dimensions into weighted score (0-100)."""
    rubric = _load_rubric("pi_rubric")
    dims = rubric.get("dimensions", [])
    if dimensions:
        total = 0.0
        weight_sum = 0.0
        for d in dims:
            w = d.get("weight", 0)
            max_s = d.get("max_score", 10)
            val = dimensions.get(d.get("id", ""), 0) or 0
            total += (val / max_s) * w if max_s else 0
            weight_sum += w
        return round(min(100, (total / weight_sum * 100) if weight_sum else 0), 1)

    mapping = {"clarity": clarity, "structure": structure, "relevance": relevance, "confidence": confidence}
    total = 0.0
    weight_sum = 0.0
    for d in dims:
        w = d.get("weight", 0)
        max_s = d.get("max_score", 10)
        val = mapping.get(d.get("id", ""), 0) or 0
        total += (val / max_s) * w if max_s else 0
        weight_sum += w
    return round(min(100, (total / weight_sum * 100) if weight_sum else 0), 1)


def compute_wat_rubric_score(
    clarity: float = 0,
    structure: float = 0,
    relevance: float = 0,
    dimensions: Optional[Dict[str, float]] = None,
) -> float:
    """Aggregate WAT rubric dimensions into weighted score (0-100)."""
    rubric = _load_rubric("wat_rubric")
    dims = rubric.get("dimensions", [])
    if dimensions:
        total = 0.0
        weight_sum = 0.0
        for d in dims:
            w = d.get("weight", 0)
            max_s = d.get("max_score", 10)
            val = dimensions.get(d.get("id", ""), 0) or 0
            total += (val / max_s) * w if max_s else 0
            weight_sum += w
        return round(min(100, (total / weight_sum * 100) if weight_sum else 0), 1)

    mapping = {"clarity": clarity, "structure": structure, "relevance": relevance}
    total = 0.0
    weight_sum = 0.0
    for d in dims:
        w = d.get("weight", 0)
        max_s = d.get("max_score", 10)
        val = mapping.get(d.get("id", ""), 0) or 0
        total += (val / max_s) * w if max_s else 0
        weight_sum += w
    return round(min(100, (total / weight_sum * 100) if weight_sum else 0), 1)


def compute_weekly_readiness_score(
    admission_score: Optional[float] = None,
    mock_count_7d: int = 0,
    wat_count_7d: int = 0,
    cv_complete: bool = False,
    milestones_count: int = 0,
) -> float:
    """
    Composite weekly readiness from profile + activity. Deterministic.
    """
    score = 0.0
    if admission_score is not None:
        score += admission_score * 0.4  # 40% from baseline
    score += min(20, mock_count_7d * 5)  # 5 pts per mock, cap 20
    score += min(15, wat_count_7d * 5)  # 5 pts per WAT, cap 15
    if cv_complete:
        score += 15
    score += min(10, milestones_count * 2)  # 2 pts per milestone, cap 10
    return round(min(100, score), 1)
