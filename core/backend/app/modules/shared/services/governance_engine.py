"""
Governance rule engine - enforces configurable shortlist and offer rules from policy templates.
Rules are read from policy.global_caps (maxShortlists, sectorDistribution, offerReleaseAt, etc).
System admins create governance templates; institutions map templates to their policies.

Lateral vs campus:
  - Lateral institutions (tier="Lateral") default to ROLLING offer mode and relaxed shortlist caps.
  - Campus institutions use SYNC offer mode with strict tier/sector caps.
"""
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.modules.shared import models

logger = logging.getLogger(__name__)

# Defaults when no policy or global_caps configured
DEFAULT_MAX_SHORTLISTS = 12
DEFAULT_SECTOR_DISTRIBUTION = [6, 4, 2]
DEFAULT_MAX_SECTORS = 3

# Lateral defaults (relaxed)
LATERAL_MAX_SHORTLISTS = 50
LATERAL_SECTOR_DISTRIBUTION = [50]
LATERAL_MAX_SECTORS = 10


def is_lateral_institution(institution_id: str | None, db: Session) -> bool:
    """Check if the given institution is a lateral hiring entity."""
    if not institution_id:
        return False
    inst = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    return inst is not None and (inst.tier or "").lower() == "lateral"


def resolve_policy_for_candidate(candidate_id: str, db: Session):
    """Resolve the policy for a candidate via their program or institution. Public API for routers."""
    return _resolve_policy_for_candidate(candidate_id, db)


def _resolve_policy_for_candidate(candidate_id: str, db: Session):
    """Resolve the policy for a candidate via their program or institution."""
    user = db.query(models.User).filter(models.User.id == candidate_id).first()
    if not user:
        return None
    # Prefer program-level policy (non-template, active)
    if user.program_id:
        policy = db.query(models.Policy).filter(
            models.Policy.program_id == user.program_id,
            models.Policy.is_template == False,
            models.Policy.status.in_(["ACTIVE", "DRAFT"])
        ).first()
        if policy:
            return policy
    # Fallback to institution-level policy
    if user.institution_id:
        policy = db.query(models.Policy).filter(
            models.Policy.institution_id == user.institution_id,
            models.Policy.program_id.is_(None),
            models.Policy.is_template == False,
            models.Policy.status.in_(["ACTIVE", "DRAFT"])
        ).first()
        if policy:
            return policy
    return db.query(models.Policy).filter(
        models.Policy.is_template == False,
        models.Policy.status == "ACTIVE"
    ).first()


def _get_governance_rules(policy, lateral: bool = False) -> dict:
    """Extract governance rules from policy.global_caps. Returns dict with defaults for missing keys.

    When ``lateral`` is True and policy doesn't explicitly set caps, defaults are relaxed
    (higher shortlist limit, ROLLING offers, no sector cap enforcement).
    """
    caps = (policy and policy.global_caps) or {}

    if lateral:
        default_max = LATERAL_MAX_SHORTLISTS
        default_dist = LATERAL_SECTOR_DISTRIBUTION
        default_sectors = LATERAL_MAX_SECTORS
        default_mode = "ROLLING"
    else:
        default_max = DEFAULT_MAX_SHORTLISTS
        default_dist = DEFAULT_SECTOR_DISTRIBUTION
        default_sectors = DEFAULT_MAX_SECTORS
        default_mode = "SYNC"

    dist = caps.get("sectorDistribution") or caps.get("distribution") or default_dist
    return {
        "maxShortlists": caps.get("maxShortlists", default_max),
        "sectorDistribution": dist if isinstance(dist, list) else default_dist,
        "maxSectors": caps.get("maxSectors", len(dist) if isinstance(dist, list) else default_sectors),
        "topDecileExempt": caps.get("topDecileExempt", True),
        "offerReleaseAt": caps.get("offerReleaseAt"),
        "offerReleaseMode": caps.get("offerReleaseMode", default_mode),
    }


def check_shortlist_rule(candidate_id: str, new_job: models.JobPosting, db: Session):
    """
    Enforce shortlist governance rules from candidate's policy.
    Rules are read from policy.global_caps (configurable per institution via templates).
    Lateral institutions get relaxed defaults when the policy doesn't override.
    Returns (valid: bool, error: str).
    """
    user = db.query(models.User).filter(models.User.id == candidate_id).first()
    lateral = is_lateral_institution(user.institution_id if user else None, db)
    policy = _resolve_policy_for_candidate(candidate_id, db)
    rules = _get_governance_rules(policy, lateral=lateral)

    if rules["topDecileExempt"] and new_job.is_top_decile:
        return True, ""

    active_shortlists = db.query(models.Shortlist).join(
        models.JobPosting, models.Shortlist.job_id == models.JobPosting.id
    ).filter(
        models.Shortlist.candidate_id == candidate_id,
        models.Shortlist.status.in_(["Held", "Accepted", "Preferential"]),
        models.JobPosting.is_top_decile == False
    ).all()

    if len(active_shortlists) >= rules["maxShortlists"]:
        return False, "ACTIVE_SHORTLIST_CAP_EXCEEDED"

    job_ids = [s.job_id for s in active_shortlists]
    jobs = db.query(models.JobPosting).filter(models.JobPosting.id.in_(job_ids)).all() if job_ids else []
    jobs_by_id = {j.id: j for j in jobs}

    sectors = {}
    for s in active_shortlists:
        job = jobs_by_id.get(s.job_id)
        if job and job.sector:
            sectors[job.sector] = sectors.get(job.sector, 0) + 1

    new_sector = new_job.sector or "Other"
    sectors[new_sector] = sectors.get(new_sector, 0) + 1
    counts = sorted(sectors.values(), reverse=True)
    limits = rules["sectorDistribution"]
    max_sectors = rules["maxSectors"]

    for i, count in enumerate(counts):
        if i >= max_sectors:
            return False, "MAX_SECTORS_VIOLATION"
        limit = limits[i] if i < len(limits) else 0
        if count > limit:
            return False, f"SECTOR_LIMIT_VIOLATION"

    return True, ""


def check_batch_eligibility(candidate_id: str, cycle_id: str | None, db: Session) -> tuple[bool, str]:
    """Check if a candidate's batch is eligible for the target cycle.

    Eligibility rules stored in policy.global_caps["eligible_batches"] (list of batch IDs).
    If the key is absent or empty, all batches are eligible (backward-compatible).
    Returns (eligible: bool, error: str).
    """
    if not cycle_id:
        return True, ""
    user = db.query(models.User).filter(models.User.id == candidate_id).first()
    if not user:
        return False, "USER_NOT_FOUND"
    if not user.batch_id:
        return True, ""  # no batch assigned -> allow (legacy users)
    policy = _resolve_policy_for_candidate(candidate_id, db)
    if not policy:
        return True, ""
    caps = policy.global_caps or {}
    eligible_batches = caps.get("eligible_batches") or caps.get("eligibleBatches")
    if not eligible_batches or not isinstance(eligible_batches, list):
        return True, ""
    if user.batch_id in eligible_batches:
        return True, ""
    return False, "BATCH_NOT_ELIGIBLE"


def is_offer_release_valid(release_time, policy=None, lateral: bool = False):
    """
    Check if offer release time is valid per policy's governance config.
    If offerReleaseMode=ROLLING or offerReleaseAt is null, always valid.
    Lateral pipelines default to ROLLING so offers are always immediately valid.
    Otherwise, release_time must be >= offerReleaseAt.
    """
    rules = _get_governance_rules(policy, lateral=lateral)
    if rules["offerReleaseMode"] == "ROLLING" or not rules["offerReleaseAt"]:
        return True
    try:
        if isinstance(rules["offerReleaseAt"], str):
            window = datetime.fromisoformat(rules["offerReleaseAt"].replace("Z", "+00:00"))
        else:
            window = rules["offerReleaseAt"]
        if hasattr(release_time, "tzinfo") and release_time.tzinfo and (window.tzinfo is None):
            import datetime as dt
            window = window.replace(tzinfo=dt.timezone.utc)
        return release_time >= window
    except (TypeError, ValueError):
        return True
