#!/usr/bin/env python3
"""
Verify PDF converter with mock IIM Calcutta analysis.
Run from backend container: cd /app && PYTHONPATH=/app:/products/profiles/cv/backend python -c "
import sys; sys.path.insert(0, '/products/profiles/cv/backend');
exec(open('/products/profiles/cv/backend/scripts/run_converter_test.py').read().split('if __name__')[0]);
from app.main import app;
from app.modules.cv_builder.routers.cv_templates import _pdf_analysis_to_config_sections_v2;
sections, fixed = _pdf_analysis_to_config_sections_v2(MOCK);
assert 'summaryBar' in fixed and 'header' in fixed;
aq = next((s for s in sections if s['id']=='academic_qualifications'), None);
assert aq and next((f for f in aq['entryTypes'][0]['fields'] if f['type']=='table'), None);
print('OK')
"
Or from ithras root: docker compose exec backend python /products/profiles/cv/backend/scripts/run_converter_test.py
"""
import sys
import os

# Ensure product backend is in path when run from /app (core backend)
if "/products/profiles/cv/backend" not in sys.path:
    sys.path.insert(0, "/products/profiles/cv/backend")
if "/app" not in sys.path:
    sys.path.insert(0, "/app")

MOCK = {
    "format": "rich",
    "fixedElements": {
        "header": {"layout": "split", "logoUrl": "", "leftContent": "IIM Calcutta", "rightVariables": ["name", "roll_number"], "logoPosition": "left"},
        "summaryBar": {"items": ["IIM CALCUTTA TOP 6%", "ABG INTERN", "MMT PPI"], "backgroundColor": "#333", "textColor": "#fff"},
        "footer": {},
    },
    "autoVariables": ["name", "roll_number", "email"],
    "repeatable_sections": ["Industry Experience"],
    "sections": [
        {"id": "academic_qualifications", "title": "ACADEMIC QUALIFICATIONS", "layoutStyle": "two_column", "sectionHeaderStyle": {"backgroundColor": "#e5e5e5"},
         "entryTypes": [{"id": "default", "name": "Qualification", "repeatable": True, "fields": [{"id": "qual_table", "label": "Qualifications", "type": "table", "columns": [{"id": "year", "label": "Year", "align": "right"}]}]}], "order": 0},
        {"id": "academic_distinctions", "title": "ACADEMIC DISTINCTIONS", "layoutStyle": "label_left_content_right", "sectionHeaderStyle": {"backgroundColor": "#e5e5e5"},
         "subCategories": [{"label": "Scholastic", "fieldId": "scholastic", "richText": True, "bulletDateFormat": "trailing_year"}],
         "entryTypes": [{"id": "default", "name": "Entry", "repeatable": True, "fields": []}], "order": 1},
        {"id": "industry_experience", "title": "INDUSTRY EXPERIENCE", "layoutStyle": "vertical_label_grouped", "verticalLabelFieldId": "employment_type", "headerFields": ["company", "role"],
         "entryTypes": [{"id": "default", "name": "Experience", "repeatable": True, "fields": [{"id": "achievements", "type": "bullet_list", "bulletDateFormat": "trailing_year"}]}], "order": 2},
    ],
}


def run():
    from app.main import app  # noqa: F401 - loads product paths and cv_builder
    from app.modules.cv_builder.routers.cv_templates import _pdf_analysis_to_config_sections_v2
    sections, fixed = _pdf_analysis_to_config_sections_v2(MOCK)
    errors = []
    if "summaryBar" not in fixed:
        errors.append("missing summaryBar")
    if "header" not in fixed or fixed["header"].get("layout") != "split":
        errors.append("missing/wrong header")
    aq = next((s for s in sections if s["id"] == "academic_qualifications"), None)
    if not aq or not next((f for f in aq["entryTypes"][0]["fields"] if f["type"] == "table"), None):
        errors.append("missing table section")
    ad = next((s for s in sections if s["id"] == "academic_distinctions"), None)
    if not ad or ad.get("layoutStyle") != "label_left_content_right" or "subCategories" not in ad:
        errors.append("missing label_left_content_right")
    ie = next((s for s in sections if s["id"] == "industry_experience"), None)
    if not ie or ie.get("layoutStyle") != "vertical_label_grouped" or ie.get("verticalLabelFieldId") != "employment_type":
        errors.append("missing vertical_label_grouped")
    if errors:
        print("FAIL:", "; ".join(errors))
        return 1
    print("OK: Converter produces summaryBar, header, table, label_left_content_right, vertical_label_grouped")
    return 0


if __name__ == "__main__":
    sys.exit(run())
