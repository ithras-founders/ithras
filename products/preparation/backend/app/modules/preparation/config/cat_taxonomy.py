"""CAT section and topic taxonomy."""

CAT_SECTIONS = ["VARC", "DILR", "QA"]

CAT_TOPICS = {
    "VARC": [
        "Reading_Comprehension",
        "Para_Jumbles",
        "Para_Summary",
        "Odd_One_Out",
        "Vocab_Fill",
        "Vocab_Usage",
    ],
    "DILR": [
        "DI_Tables",
        "DI_Graphs",
        "DI_Caselets",
        "LR_Arrangements",
        "LR_Puzzles",
        "LR_Games",
        "Binary_Logic",
    ],
    "QA": [
        "Number_System",
        "Arithmetic",
        "Algebra",
        "Geometry",
        "Mensuration",
        "Modern_Math",
        "PnC_Probability",
    ],
}

MOCK_TYPES = [
    {"id": "SECTIONAL_VARC", "label": "VARC Sectional", "sections": ["VARC"], "questions_per_section": 15, "time_sec": 1800},
    {"id": "SECTIONAL_DILR", "label": "DILR Sectional", "sections": ["DILR"], "questions_per_section": 15, "time_sec": 1800},
    {"id": "SECTIONAL_QA", "label": "QA Sectional", "sections": ["QA"], "questions_per_section": 15, "time_sec": 1800},
    {"id": "FULL_MOCK", "label": "Full Mock", "sections": ["VARC", "DILR", "QA"], "questions_per_section": 10, "time_sec": 2400},
]

DIFFICULTY_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "MIXED"]
