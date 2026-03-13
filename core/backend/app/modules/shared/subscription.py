"""Subscription and onboarding helpers for institution/company feature gating."""
from sqlalchemy.orm import Session

from . import models


def get_institution_features(db: Session, institution_id: str | None) -> list[str]:
    """Return the features list for an institution. Empty list if None or not found."""
    if not institution_id:
        return []
    inst = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not inst or not inst.features:
        return []
    return inst.features if isinstance(inst.features, list) else []


def institution_has_feature(db: Session, institution_id: str | None, feature: str) -> bool:
    """True if the institution has the given feature. Placement and governance require status=PARTNER."""
    if not institution_id:
        return False
    inst = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not inst:
        return False
    # Placement and governance require PARTNER status
    if feature in ("placement", "governance"):
        if getattr(inst, "status", "PARTNER") != "PARTNER":
            return False
    features = get_institution_features(db, institution_id)
    return feature in features


def institution_is_partner(db: Session, institution_id: str | None) -> bool:
    """True if institution status is PARTNER (runs recruitment through platform)."""
    if not institution_id:
        return False
    inst = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not inst:
        return False
    return getattr(inst, "status", "PARTNER") == "PARTNER"


def institution_is_listed(db: Session, institution_id: str | None) -> bool:
    """True if institution status is LISTED or PARTNER (has full details)."""
    if not institution_id:
        return False
    inst = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not inst:
        return False
    s = getattr(inst, "status", "PARTNER")
    return s in ("LISTED", "PARTNER")


def institution_is_verified(db: Session, institution_id: str | None) -> bool:
    """Deprecated: use institution_is_listed. Kept for backward compat."""
    return institution_is_listed(db, institution_id)


def institution_is_fully_onboarded(db: Session, institution_id: str | None) -> bool:
    """True if institution has placement (status=PARTNER). Deprecated: use institution_is_partner."""
    return institution_is_partner(db, institution_id)


def company_is_onboarded(db: Session, company_id: str | None) -> bool:
    """True if company status is PARTNER (recruits through platform). Full recruiter access."""
    if not company_id:
        return False
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        return False
    return getattr(company, "status", "PARTNER") == "PARTNER"


def company_is_partner(db: Session, company_id: str | None) -> bool:
    """Alias for company_is_onboarded. True if company status is PARTNER."""
    return company_is_onboarded(db, company_id)


def company_is_listed(db: Session, company_id: str | None) -> bool:
    """True if company status is LISTED or PARTNER (has full profile)."""
    if not company_id:
        return False
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        return False
    s = getattr(company, "status", "PARTNER")
    return s in ("LISTED", "PARTNER")


def company_is_verified(db: Session, company_id: str | None) -> bool:
    """Deprecated: use company_is_listed. Kept for backward compat."""
    return company_is_listed(db, company_id)


def get_institution_allowed_roles(db: Session, institution_id: str | None) -> list[str]:
    """Return allowed role IDs for an institution. Empty list if None or not found."""
    if not institution_id:
        return []
    inst = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not inst:
        return []
    roles = getattr(inst, "allowed_roles", None)
    return roles if isinstance(roles, list) else []


def get_company_allowed_roles(db: Session, company_id: str | None) -> list[str]:
    """Return allowed role IDs for a company. Empty list if None or not found."""
    if not company_id:
        return []
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        return []
    roles = getattr(company, "allowed_roles", None)
    return roles if isinstance(roles, list) else []


def get_user_institution_id(db: Session, user_id: str) -> str | None:
    """Get the user's active institution_id from institution links. Returns first active link's institution."""
    from .links import get_active_institution_links

    links = get_active_institution_links(db, user_id)
    for link in links:
        if link.institution_id:
            return link.institution_id
    return None


def get_user_company_id(db: Session, user_id: str) -> str | None:
    """Get the user's active company_id from organization links. Returns first active link's company."""
    from .links import get_active_organization_links

    links = get_active_organization_links(db, user_id)
    for link in links:
        if link.company_id:
            return link.company_id
    return None
