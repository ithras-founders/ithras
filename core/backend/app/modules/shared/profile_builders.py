"""Profile dict builders from links and URA. Shared by auth and roles APIs."""
import datetime

from . import models


def build_profile_from_institution_link(link: "models.IndividualInstitutionLink") -> dict:
    """Build profile dict from IndividualInstitutionLink (matches legacy shape)."""
    role = link.role
    perm_codes = [p.code for p in role.permissions] if role and role.permissions else []
    inst = link.institution
    inst_features = getattr(inst, "features", None) or []
    inst_status = getattr(inst, "status", "PARTNER") if inst else "PARTNER"
    inst_onboarding = getattr(inst, "onboarding_status", "FULLY_ONBOARDED") if inst else "FULLY_ONBOARDED"
    return {
        "id": link.id,
        "role": {
            "id": role.id,
            "name": role.name,
            "type": role.type,
            "description": role.description,
            "institution_id": role.institution_id,
            "is_system": role.is_system,
            "permissions": [
                {"id": p.id, "code": p.code, "name": p.name, "category": p.category, "description": p.description}
                for p in (role.permissions or [])
            ],
        },
        "institution_id": link.institution_id,
        "institution_name": link.institution.name if link.institution else None,
        "institution_logo_url": link.institution.logo_url if link.institution else None,
        "institution_features": inst_features if isinstance(inst_features, list) else [],
        "institution_onboarding_status": inst_onboarding,
        "institution_status": inst_status,
        "company_id": None,
        "company_name": None,
        "company_logo_url": None,
        "company_onboarding_status": None,
        "company_status": None,
        "program_id": link.program_id,
        "program_name": link.program.name if link.program else None,
        "business_unit_id": None,
        "permissions": perm_codes,
        "granted_at": link.start_date.isoformat() if link.start_date else None,
        "expires_at": link.end_date.isoformat() if link.end_date else None,
        "is_active": link.end_date is None or link.end_date >= datetime.datetime.utcnow(),
    }


def build_profile_from_organization_link(link: "models.IndividualOrganizationLink") -> dict:
    """Build profile dict from IndividualOrganizationLink (matches legacy shape)."""
    role = link.role
    perm_codes = [p.code for p in role.permissions] if role and role.permissions else []
    company = link.company
    company_status = getattr(company, "status", "PARTNER") if company else "PARTNER"
    company_onboarding = "ONBOARDED" if company_status == "PARTNER" else "NOT_ONBOARDED"
    return {
        "id": link.id,
        "role": {
            "id": role.id,
            "name": role.name,
            "type": role.type,
            "description": role.description,
            "institution_id": role.institution_id,
            "is_system": role.is_system,
            "permissions": [
                {"id": p.id, "code": p.code, "name": p.name, "category": p.category, "description": p.description}
                for p in (role.permissions or [])
            ],
        },
        "institution_id": None,
        "institution_name": None,
        "institution_logo_url": None,
        "institution_features": [],
        "institution_onboarding_status": None,
        "company_id": link.company_id,
        "company_name": link.company.name if link.company else None,
        "company_logo_url": link.company.logo_url if link.company else None,
        "company_onboarding_status": company_onboarding,
        "company_status": company_status,
        "business_unit_id": link.business_unit_id,
        "program_id": None,
        "program_name": None,
        "permissions": perm_codes,
        "granted_at": link.start_date.isoformat() if link.start_date else None,
        "expires_at": link.end_date.isoformat() if link.end_date else None,
        "is_active": link.end_date is None or link.end_date >= datetime.datetime.utcnow(),
    }


def build_profile_from_ura(ura: "models.UserRoleAssignment") -> dict:
    """Build profile dict from UserRoleAssignment (matches link shape)."""
    role = ura.role
    perm_codes = [p.code for p in role.permissions] if role and role.permissions else []
    inst = ura.institution
    company = ura.company
    inst_features = getattr(inst, "features", None) or [] if inst else []
    inst_status = getattr(inst, "status", "PARTNER") if inst else "PARTNER"
    inst_onboarding = "FULLY_ONBOARDED" if inst_status == "PARTNER" else "PRESENT_ONLY"
    company_status = getattr(company, "status", "PARTNER") if company else "PARTNER"
    company_onboarding = "ONBOARDED" if company_status == "PARTNER" else "NOT_ONBOARDED"
    return {
        "id": ura.id,
        "role": {
            "id": role.id,
            "name": role.name,
            "type": role.type,
            "description": role.description,
            "institution_id": role.institution_id,
            "is_system": role.is_system,
            "permissions": [
                {"id": p.id, "code": p.code, "name": p.name, "category": p.category, "description": p.description}
                for p in (role.permissions or [])
            ],
        },
        "institution_id": ura.institution_id,
        "institution_name": ura.institution.name if ura.institution else None,
        "institution_logo_url": ura.institution.logo_url if ura.institution else None,
        "institution_features": inst_features if isinstance(inst_features, list) else [],
        "institution_onboarding_status": inst_onboarding if ura.institution_id else None,
        "institution_status": inst_status if ura.institution_id else None,
        "company_id": ura.company_id,
        "company_name": ura.company.name if ura.company else None,
        "company_logo_url": ura.company.logo_url if ura.company else None,
        "company_onboarding_status": company_onboarding if ura.company_id else None,
        "company_status": company_status if ura.company_id else None,
        "program_id": ura.program_id,
        "program_name": ura.program.name if ura.program else None,
        "permissions": perm_codes,
        "granted_at": ura.granted_at.isoformat() if ura.granted_at else None,
        "expires_at": ura.expires_at.isoformat() if ura.expires_at else None,
        "is_active": ura.is_active,
    }
