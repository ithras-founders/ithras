"""AI-powered CAT prep insights using Gemini."""
import json
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


def get_cat_prep_insights(
    section_scores: Dict[str, float],
    topic_scores: List[Dict[str, Any]],
    mock_count: int = 0,
    last_mock_date: Optional[str] = None,
    target_percentile: float = 95.0,
    api_key: Optional[str] = None,
    model: str = "gemini-2.0-flash",
) -> List[str]:
    """
    Call Gemini to generate 3-5 personalized prep insights.
    Returns list of insight strings. Falls back to rule-based if API fails.
    """
    weak_topics = [
        t for t in topic_scores
        if (t.get("accuracy_pct") or 0) < 60 and (t.get("attempts_count") or 0) >= 2
    ]
    weak_topics = sorted(weak_topics, key=lambda x: x.get("accuracy_pct") or 0)[:5]

    if not api_key:
        return _rule_based_insights(section_scores, weak_topics, mock_count)

    try:
        import requests
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        prompt = f"""You are a CAT exam coach. Given the following student data:
- Section-wise accuracy: VARC={section_scores.get('VARC', 0):.0f}%, DILR={section_scores.get('DILR', 0):.0f}%, QA={section_scores.get('QA', 0):.0f}%
- Topic-wise weak areas: {json.dumps(weak_topics[:5])}
- Mock count: {mock_count}
- Last mock date: {last_mock_date or 'N/A'}
- Target: {target_percentile:.0f}+ percentile

Provide 3-5 specific, actionable prep insights. Format: short bullet points (each 1-2 lines).
Focus on: which topics to practice, how many mocks this week, time management tips.
Return ONLY a JSON object with key "insights" as an array of strings. No other text.
Example: {{"insights": ["Focus 2 hours on Para Jumbles - current accuracy 45%", "Take 2 full mocks this week"]}}
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"},
        }
        r = requests.post(url, json=payload, timeout=30)
        r.raise_for_status()
        resp = r.json()
        raw = resp.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
        parsed = json.loads(raw) if isinstance(raw, str) else raw
        insights = parsed.get("insights", [])
        if isinstance(insights, list) and len(insights) > 0:
            return insights[:5]
    except Exception as e:
        logger.warning("Gemini CAT insights failed: %s", e)

    return _rule_based_insights(section_scores, weak_topics, mock_count)


def _rule_based_insights(
    section_scores: Dict[str, float],
    weak_topics: List[Dict],
    mock_count: int,
) -> List[str]:
    """Fallback rule-based insights when Gemini is unavailable."""
    insights = []
    for section, acc in section_scores.items():
        if acc < 50:
            insights.append(f"Focus on {section} - accuracy {acc:.0f}% is below target. Practice 15-20 questions daily.")
    for t in weak_topics[:3]:
        topic = t.get("topic", "topic")
        acc = t.get("accuracy_pct", 0)
        insights.append(f"Improve {topic}: current accuracy {acc:.0f}%. Do timed drills of 10 questions.")
    if mock_count < 2:
        insights.append("Take at least 2 full mocks this month to build exam readiness.")
    if len(insights) < 3:
        insights.append("Maintain consistent daily practice. Review wrong answers and learn from mistakes.")
    return insights[:5]
