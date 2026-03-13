"""Governance rules - delegates to shared configurable engine. Rules come from policy templates."""
from app.modules.shared.services.governance_engine import check_shortlist_rule


def check_shortlist_governance(candidate_id: str, new_job, db):
    """Enforces governance rules from candidate's policy (configurable via templates)."""
    return check_shortlist_rule(candidate_id, new_job, db)
