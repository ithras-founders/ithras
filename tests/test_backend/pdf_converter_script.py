#!/usr/bin/env python3
"""
Standalone script to verify PDF converter with mock IIM Calcutta analysis.
Run from ithras/: PYTHONPATH=core/backend:products/cv/backend:. python3 tests/test_backend/run_pdf_converter_test.py
Or from Docker: docker compose exec backend python -c "$(cat tests/... | docker exec ...)" - we use inline.
"""
import sys
import os

ITHRAS_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CORE_BACKEND = os.path.join(ITHRAS_ROOT, 'core', 'backend')
CV_BACKEND = os.path.join(ITHRAS_ROOT, 'products', 'cv', 'backend')
for p in [ITHRAS_ROOT, CORE_BACKEND, CV_BACKEND]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Mock IIM Calcutta-style analysis
IIM_CALCUTTA_MOCK_ANALYSIS = {
    "format": "rich",
    "fixedElements": {
        "header": {
            "layout": "split",
            "logoUrl": "",
            "leftContent": "IIM Calcutta",
            "rightVariables": ["name", "roll_number"],
            "logoPosition": "left",
        },
        "summaryBar": {
            "items": [
                "IIM CALCUTTA TOP 6% (RANK 28/480)",
                "ABG INTERN, KHATABOOK PPO",
                "MMT PPI, NATIONAL LEVEL DEBATER",
            ],
            "backgroundColor": "#333",
            "textColor": "#fff",
        },
        "footer": {},
    },
    "autoVariables": ["name", "roll_number", "email"],
    "repeatable_sections": ["Industry Experience"],
    "sections": [
        {
            "id": "academic_qualifications",
            "title": "ACADEMIC QUALIFICATIONS",
            "layoutStyle": "two_column",
            "sectionHeaderStyle": {"backgroundColor": "#e5e5e5", "titleCaps": True},
            "entryTypes": [{
                "id": "default",
                "name": "Qualification",
                "repeatable": True,
                "fields": [{
                    "id": "qualifications_table",
                    "label": "Academic Qualifications",
                    "type": "table",
                    "columns": [
                        {"id": "degree", "label": "Degree/Exam", "align": "left"},
                        {"id": "institute", "label": "Board/Institute", "align": "left"},
                        {"id": "percentage", "label": "%/CGPA", "align": "left"},
                        {"id": "year", "label": "Year", "align": "right"},
                    ],
                }],
            }],
            "order": 0,
        },
        {
            "id": "academic_distinctions",
            "title": "ACADEMIC DISTINCTIONS",
            "layoutStyle": "label_left_content_right",
            "sectionHeaderStyle": {"backgroundColor": "#e5e5e5", "labelWidth": "1.5in"},
            "subCategories": [
                {"label": "Scholastic", "fieldId": "scholastic", "richText": True, "bulletDateFormat": "trailing_year"},
                {"label": "Marketing", "fieldId": "marketing", "richText": True, "bulletDateFormat": "trailing_year"},
            ],
            "entryTypes": [{"id": "default", "name": "Entry", "repeatable": True, "fields": []}],
            "order": 1,
        },
        {
            "id": "industry_experience",
            "title": "INDUSTRY EXPERIENCE",
            "layoutStyle": "vertical_label_grouped",
            "verticalLabelFieldId": "employment_type",
            "headerFields": ["company", "role", "duration"],
            "entryTypes": [{
                "id": "default",
                "name": "Experience",
                "repeatable": True,
                "fields": [
                    {"id": "company", "label": "Company", "type": "text"},
                    {"id": "role", "label": "Role", "type": "text"},
                    {"id": "achievements", "label": "Achievements", "type": "bullet_list", "bulletDateFormat": "trailing_year"},
                ],
            }],
            "order": 2,
        },
    ],
}


def run():
    # Load app first so product paths and cv_builder are registered
    from app.main import app  # noqa: F401
    from app.modules.cv_builder.routers.cv_templates import _pdf_analysis_to_config_sections_v2
    converter = _pdf_analysis_to_config_sections_v2
    sections, fixed_elements = converter(IIM_CALCUTTA_MOCK_ANALYSIS)

    errors = []
    # 1. summaryBar
    if "summaryBar" not in fixed_elements:
        errors.append("missing fixedElements.summaryBar")
    else:
        bar = fixed_elements["summaryBar"]
        if "items" not in bar or len(bar["items"]) != 3:
            errors.append("summaryBar.items should have 3 items")
        if bar.get("backgroundColor") != "#333":
            errors.append("summaryBar.backgroundColor should be #333")
    # 2. header
    if "header" not in fixed_elements:
        errors.append("missing fixedElements.header")
    else:
        h = fixed_elements["header"]
        if h.get("layout") != "split":
            errors.append("header.layout should be split")
        if h.get("rightVariables") != ["name", "roll_number"]:
            errors.append("header.rightVariables should be [name, roll_number]")
    # 3. table section
    aq = next((s for s in sections if s["id"] == "academic_qualifications"), None)
    if not aq:
        errors.append("missing academic_qualifications section")
    else:
        tf = next((f for f in aq["entryTypes"][0]["fields"] if f["type"] == "table"), None)
        if not tf or "columns" not in tf:
            errors.append("academic_qualifications should have table field with columns")
        else:
            yc = next((c for c in tf["columns"] if c["id"] == "year"), None)
            if not yc or yc.get("align") != "right":
                errors.append("year column should be right-aligned")
    # 4. label_left_content_right
    ad = next((s for s in sections if s["id"] == "academic_distinctions"), None)
    if not ad or ad.get("layoutStyle") != "label_left_content_right":
        errors.append("academic_distinctions should have layoutStyle label_left_content_right")
    elif "subCategories" not in ad or len(ad["subCategories"]) < 2:
        errors.append("academic_distinctions should have subCategories")
    # 5. vertical_label_grouped
    ie = next((s for s in sections if s["id"] == "industry_experience"), None)
    if not ie or ie.get("layoutStyle") != "vertical_label_grouped":
        errors.append("industry_experience should have layoutStyle vertical_label_grouped")
    if not ie or ie.get("verticalLabelFieldId") != "employment_type":
        errors.append("industry_experience should have verticalLabelFieldId")
    # 6. sectionHeaderStyle
    if aq and not aq.get("sectionHeaderStyle", {}).get("backgroundColor"):
        errors.append("sections should have sectionHeaderStyle.backgroundColor")

    if errors:
        print("FAILED:", "; ".join(errors))
        return 1
    print("OK: All converter checks passed (summaryBar, header, table, label_left_content_right, vertical_label_grouped, sectionHeaderStyle)")
    return 0


if __name__ == "__main__":
    sys.exit(run())
