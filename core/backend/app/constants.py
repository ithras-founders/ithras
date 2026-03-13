"""
Shared seed constants used across registry, simulator scenarios, and tests.
Centralizes IDs and emails that were previously hardcoded in multiple places.
"""

DEFAULT_INSTITUTION_ID = "inst1"
DEFAULT_INSTITUTION_NAME = "IIM Calcutta"
DEFAULT_PROGRAM_ID = "inst1_default"
DEFAULT_COMPANY_ID = "comp1"
DEFAULT_COMPANY_NAME = "McKinsey & Company"
DEFAULT_BATCH_ID = "batch1"
DEFAULT_CYCLE_ID = "cycle1"

FOUNDER_EMAIL = "founders@ithras.com"
FOUNDER_USER_ID = "user_founders"

SHASHANK_USER_ID = "user_shashank"
SHASHANK_EMAIL = "shashank.gandham@ithras.com"

DEMO_USERS = {
    "SYSTEM_ADMIN": {
        "id": FOUNDER_USER_ID,
        "email": FOUNDER_EMAIL,
        "name": "Founders",
        "role": "SYSTEM_ADMIN",
        "institution_id": None,
        "company_id": None,
        "program_id": None,
        "batch_id": None,
    },
    "CANDIDATE": {
        "id": "user_demo_student",
        "email": "demo_student@ithras.com",
        "name": "Demo Student",
        "role": "CANDIDATE",
        "institution_id": DEFAULT_INSTITUTION_ID,
        "company_id": None,
        "program_id": DEFAULT_PROGRAM_ID,
        "batch_id": DEFAULT_BATCH_ID,
    },
    "RECRUITER": {
        "id": "user_demo_recruiter",
        "email": "demo_recruiter@ithras.com",
        "name": "Demo Recruiter",
        "role": "RECRUITER",
        "institution_id": None,
        "company_id": DEFAULT_COMPANY_ID,
        "program_id": None,
        "batch_id": None,
    },
    "PLACEMENT_TEAM": {
        "id": "user_demo_placement_team",
        "email": "demo_placement_team@ithras.com",
        "name": "Demo Placement Team",
        "role": "PLACEMENT_TEAM",
        "institution_id": DEFAULT_INSTITUTION_ID,
        "company_id": None,
        "program_id": None,
        "batch_id": None,
    },
    "PLACEMENT_ADMIN": {
        "id": "user_demo_placement_admin",
        "email": "demo_placement_admin@ithras.com",
        "name": "Demo Placement Admin",
        "role": "PLACEMENT_ADMIN",
        "institution_id": DEFAULT_INSTITUTION_ID,
        "company_id": None,
        "program_id": None,
        "batch_id": None,
    },
    "INSTITUTION_ADMIN": {
        "id": "user_demo_institution_admin",
        "email": "demo_institution_admin@ithras.com",
        "name": "Demo Institution Admin",
        "role": "INSTITUTION_ADMIN",
        "institution_id": DEFAULT_INSTITUTION_ID,
        "company_id": None,
        "program_id": None,
        "batch_id": None,
    },
    "FACULTY_OBSERVER": {
        "id": "user_demo_faculty",
        "email": "demo_faculty@ithras.com",
        "name": "Demo Faculty",
        "role": "FACULTY_OBSERVER",
        "institution_id": DEFAULT_INSTITUTION_ID,
        "company_id": None,
        "program_id": None,
        "batch_id": None,
    },
    "PROFESSIONAL": {
        "id": "user_demo_professional",
        "email": "demo_professional@ithras.com",
        "name": "Demo Professional",
        "role": "PROFESSIONAL",
        "institution_id": None,
        "company_id": None,
        "program_id": None,
        "batch_id": None,
    },
    # IIM Calcutta alumnus, current McKinsey employee (visible in System Admin)
    "SHASHANK": {
        "id": SHASHANK_USER_ID,
        "email": SHASHANK_EMAIL,
        "name": "Shashank Gandham",
        "role": "RECRUITER",
        "institution_id": None,
        "company_id": DEFAULT_COMPANY_ID,
        "program_id": None,
        "batch_id": None,
    },
}

DEMO_USER_IDS = [u["id"] for u in DEMO_USERS.values()]
