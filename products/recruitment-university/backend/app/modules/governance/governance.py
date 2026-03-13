"""Placement governance - delegates to shared governance engine."""
from app.modules.shared.services.governance_engine import check_shortlist_rule, is_offer_release_valid


def check_shortlist_governance(candidate_id: str, new_job, db):
    """Enforce governance rules from candidate's policy. Delegates to shared engine."""
    return check_shortlist_rule(candidate_id, new_job, db)
