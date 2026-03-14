"""CAT mock scoring: raw score, section-wise aggregation, topic-level stats."""
from typing import Dict, List, Any, Optional


def compute_cat_raw_score(
    correct_count: int,
    wrong_count: int,
    marks_correct: float = 3.0,
    marks_wrong: float = -1.0,
) -> float:
    """Compute raw score: +3 per correct, -1 per wrong (MCQ). TITA has no penalty."""
    return correct_count * marks_correct + wrong_count * marks_wrong


def estimate_percentile_from_raw(raw_score: float, max_possible: float) -> float:
    """
    Rough percentile estimate from raw score.
    Uses simplified curve: higher raw -> higher percentile.
    In production, use historical distribution or published conversion tables.
    """
    if max_possible <= 0:
        return 0.0
    ratio = raw_score / max_possible
    # Approximate: 50% raw -> ~50 percentile, 80% raw -> ~90, etc.
    if ratio <= 0:
        return 0.0
    if ratio >= 1.0:
        return 99.9
    # Simplified logistic-like curve
    import math
    pct = 50 + 50 * math.tanh((ratio - 0.5) * 3)
    return round(max(0, min(99.9, pct)), 1)


def aggregate_topic_scores(
    responses: List[Dict[str, Any]],
    questions_by_id: Dict[str, Dict],
) -> Dict[str, Dict[str, Any]]:
    """
    Aggregate responses by (section, topic).
    responses: [{question_id, selected_option, is_correct, time_spent_sec}]
    questions_by_id: {id: {section, topic, question_type}}
    Returns: {(section, topic): {attempts_count, correct_count, accuracy_pct, avg_time_sec}}
    """
    by_topic: Dict[tuple, List[Dict]] = {}
    for r in responses:
        qid = r.get("question_id")
        if not qid or qid not in questions_by_id:
            continue
        q = questions_by_id[qid]
        section = q.get("section") or "UNKNOWN"
        topic = q.get("topic") or "UNKNOWN"
        key = (section, topic)
        if key not in by_topic:
            by_topic[key] = []
        by_topic[key].append(r)

    result = {}
    for (section, topic), items in by_topic.items():
        correct = sum(1 for x in items if x.get("is_correct"))
        total = len(items)
        times = [x.get("time_spent_sec") for x in items if x.get("time_spent_sec") is not None]
        avg_time = sum(times) / len(times) if times else None
        result[f"{section}:{topic}"] = {
            "section": section,
            "topic": topic,
            "attempts_count": total,
            "correct_count": correct,
            "accuracy_pct": round(100 * correct / total, 1) if total else 0,
            "avg_time_sec": round(avg_time, 1) if avg_time is not None else None,
        }
    return result
