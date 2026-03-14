"""Rule-based next-best-action recommendations - no AI."""
from typing import List, Dict, Any, Optional


def _get_radar_from_baseline(baseline_metadata: dict) -> Dict[str, float]:
    """Extract strength/weakness radar from baseline_metadata."""
    radar = baseline_metadata.get("strength_weakness_radar", {})
    if not radar:
        return {
            "academics": 50.0,
            "story": 50.0,
            "communication": 50.0,
            "business_awareness": 50.0,
            "confidence": 50.0,
        }
    return radar


def get_top_5_actions(
    admission_readiness_score: Optional[float] = None,
    baseline_metadata: Optional[dict] = None,
    mock_count_7d: int = 0,
    wat_count_7d: int = 0,
    cv_complete: bool = False,
    cat_percentile: Optional[float] = None,
) -> List[str]:
    """
    Rule-based top 5 actions this week. Deterministic.
    """
    radar = _get_radar_from_baseline(baseline_metadata or {})
    actions: List[str] = []

    # Low communication -> more PI mocks
    if radar.get("communication", 50) < 50 and mock_count_7d < 3:
        actions.append("Schedule 2-3 PI mocks this week to build communication confidence")

    # Low writing -> WAT practice
    if radar.get("story", 50) < 55 or wat_count_7d < 2:
        actions.append("Complete 2 timed WAT practices on business/current affairs topics")

    # CV not complete
    if not cv_complete:
        actions.append("Finalize your B-school format CV with quantified achievements")

    # High percentile, weak story -> strengthen narrative
    if cat_percentile and cat_percentile >= 95 and radar.get("story", 50) < 60:
        actions.append("Prepare TMAY and work-ex story with 3-4 STAR examples")

    # Low business awareness
    if radar.get("business_awareness", 50) < 55:
        actions.append("Read 2 business/current affairs articles and note key arguments")

    # Low confidence
    if radar.get("confidence", 50) < 50:
        actions.append("Book a peer mock or mentor session to practice under pressure")

    # Generic fillers if we have fewer than 5
    fillers = [
        "Review school-specific PI question banks for your target schools",
        "Update your target school shortlist and deadlines",
        "Practice one GD topic with a study partner",
    ]
    for f in fillers:
        if len(actions) >= 5:
            break
        if f not in actions:
            actions.append(f)

    return actions[:5]


def get_next_best_action(
    baseline_metadata: Optional[dict] = None,
    mock_count_7d: int = 0,
    wat_count_7d: int = 0,
    cv_complete: bool = False,
) -> str:
    """
    Single next-best-action. Used for 'what to fix next' prompts.
    """
    radar = _get_radar_from_baseline(baseline_metadata or {})

    if not cv_complete:
        return "Complete your CV in B-school format with quantified achievements"

    if radar.get("communication", 50) < 50:
        return "Focus on PI mocks - communication is a key gap"

    if radar.get("story", 50) < 55 or wat_count_7d < 2:
        return "Practice WAT - structure and argument quality need work"

    if radar.get("business_awareness", 50) < 55:
        return "Read business/current affairs and practice articulating views"

    if mock_count_7d < 2:
        return "Schedule 2 PI mocks this week to maintain consistency"

    return "Continue with school-specific prep and peer mocks"
