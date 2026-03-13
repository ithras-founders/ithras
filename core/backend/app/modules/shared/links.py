"""
Individual-Institution-Organization link helpers.

Alumni = end_date IS NOT NULL AND end_date < now()
Active links = end_date IS NULL OR end_date >= now()
"""
import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_


def is_alumni(link) -> bool:
    """True when link has end_date in the past (alumni of that context)."""
    if not link or link.end_date is None:
        return False
    now = datetime.datetime.utcnow()
    return link.end_date < now


def is_link_active(link, now=None) -> bool:
    """True when link is active (ongoing or not yet ended)."""
    if not link:
        return False
    if link.end_date is None:
        return True
    now = now or datetime.datetime.utcnow()
    return link.end_date >= now


def get_active_institution_links(db: Session, user_id: str, now=None):
    """Get institution links where end_date is NULL or end_date >= now."""
    from app.modules.shared import models

    now = now or datetime.datetime.utcnow()
    return (
        db.query(models.IndividualInstitutionLink)
        .filter(
            models.IndividualInstitutionLink.user_id == user_id,
            or_(
                models.IndividualInstitutionLink.end_date.is_(None),
                models.IndividualInstitutionLink.end_date >= now,
            ),
        )
        .order_by(models.IndividualInstitutionLink.start_date.desc())
        .all()
    )


def get_active_organization_links(db: Session, user_id: str, now=None):
    """Get organization links where end_date is NULL or end_date >= now."""
    from app.modules.shared import models

    now = now or datetime.datetime.utcnow()
    return (
        db.query(models.IndividualOrganizationLink)
        .filter(
            models.IndividualOrganizationLink.user_id == user_id,
            or_(
                models.IndividualOrganizationLink.end_date.is_(None),
                models.IndividualOrganizationLink.end_date >= now,
            ),
        )
        .order_by(models.IndividualOrganizationLink.start_date.desc())
        .all()
    )


def get_all_institution_links(db: Session, user_id: str):
    """Get all institution links (active + alumni) for profile display, ordered by start_date DESC."""
    from app.modules.shared import models

    return (
        db.query(models.IndividualInstitutionLink)
        .filter(models.IndividualInstitutionLink.user_id == user_id)
        .order_by(models.IndividualInstitutionLink.start_date.desc())
        .all()
    )


def get_all_organization_links(db: Session, user_id: str):
    """Get all organization links (active + alumni) for profile display, ordered by start_date DESC."""
    from app.modules.shared import models

    return (
        db.query(models.IndividualOrganizationLink)
        .filter(models.IndividualOrganizationLink.user_id == user_id)
        .order_by(models.IndividualOrganizationLink.start_date.desc())
        .all()
    )
