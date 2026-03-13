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
}

DEMO_USER_IDS = [u["id"] for u in DEMO_USERS.values()]
