"""
Unit tests for PDF analysis to config converter.
Uses mock IIM Calcutta-style analysis to verify the converter produces
correct config (summaryBar, header, tables, sectionHeaderStyle, etc.)
without calling Gemini.
"""
import pytest


@pytest.fixture(autouse=True)
def _ensure_app_loaded():
    """Load app so product paths and cv_builder module are available."""
    from app.main import app  # noqa: F401
    return app


@pytest.fixture
def converter():
    from app.modules.cv_builder.routers.cv_templates import _pdf_analysis_to_config_sections_v2
    return _pdf_analysis_to_config_sections_v2


# Mock IIM Calcutta-style rich analysis (what we want Gemini to return)
IIM_CALCUTTA_MOCK_ANALYSIS = {
    "format": "rich",
    "fixedElements": {
        "header": {
            "layout": "split",
            "logoUrl": "",
            "leftContent": "भारतीय प्रबंध संस्थान कलकत्ता",
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
        "footer": {
            "content": "Indian Institute of Management Calcutta",
            "variables": ["email"],
        },
    },
    "autoVariables": ["name", "roll_number", "email"],
    "repeatable_sections": ["Industry Experience"],
    "sections": [
        {
            "id": "academic_qualifications",
            "title": "ACADEMIC QUALIFICATIONS",
            "layoutStyle": "two_column",
            "sectionHeaderStyle": {
                "backgroundColor": "#e5e5e5",
                "titleCaps": True,
                "titleAlign": "left",
                "titleDivider": True,
            },
            "entryTypes": [
                {
                    "id": "default",
                    "name": "Qualification",
                    "repeatable": True,
                    "fields": [
                        {
                            "id": "qualifications_table",
                            "label": "Academic Qualifications",
                            "type": "table",
                            "columns": [
                                {"id": "degree", "label": "Degree/Exam", "align": "left"},
                                {"id": "institute", "label": "Board/Institute", "align": "left"},
                                {"id": "percentage", "label": "%/CGPA", "align": "left"},
                                {"id": "year", "label": "Rank Year", "align": "right"},
                            ],
                        }
                    ],
                }
            ],
            "order": 0,
        },
        {
            "id": "academic_distinctions",
            "title": "ACADEMIC DISTINCTIONS & CO-CURRICULAR ACHIEVEMENTS",
            "layoutStyle": "label_left_content_right",
            "sectionHeaderStyle": {
                "backgroundColor": "#e5e5e5",
                "titleCaps": True,
                "labelWidth": "1.5in",
            },
            "subCategories": [
                {"label": "Scholastic & Academic Honours", "fieldId": "scholastic", "richText": True, "bulletDateFormat": "trailing_year"},
                {"label": "Marketing Pursuits", "fieldId": "marketing", "richText": True, "bulletDateFormat": "trailing_year"},
                {"label": "Competitive Examination Accolades", "fieldId": "competitive", "richText": True, "bulletDateFormat": "trailing_year"},
            ],
            "entryTypes": [
                {
                    "id": "default",
                    "name": "Entry",
                    "repeatable": True,
                    "fields": [],
                }
            ],
            "order": 1,
        },
        {
            "id": "industry_experience",
            "title": "INDUSTRY EXPERIENCE",
            "layoutStyle": "vertical_label_grouped",
            "verticalLabelFieldId": "employment_type",
            "sectionHeaderStyle": {"backgroundColor": "#e5e5e5", "titleCaps": True},
            "headerFields": ["company", "role", "duration"],
            "entryTypes": [
                {
                    "id": "default",
                    "name": "Experience",
                    "repeatable": True,
                    "fields": [
                        {"id": "company", "label": "Company", "type": "text"},
                        {"id": "role", "label": "Role", "type": "text"},
                        {"id": "achievements", "label": "Achievements", "type": "bullet_list", "bulletDateFormat": "trailing_year"},
                    ],
                }
            ],
            "order": 2,
        },
    ],
}


def test_converter_produces_summary_bar(converter):
    """Converter must pass through summaryBar from fixedElements."""
    sections, fixed_elements = converter(IIM_CALCUTTA_MOCK_ANALYSIS)
    assert "summaryBar" in fixed_elements
    bar = fixed_elements["summaryBar"]
    assert "items" in bar and len(bar["items"]) == 3
    assert bar["items"][0] == "IIM CALCUTTA TOP 6% (RANK 28/480)"
    assert bar.get("backgroundColor") == "#333"
    assert bar.get("textColor") == "#fff"


def test_converter_produces_header(converter):
    """Converter must pass through header with split layout and rightVariables."""
    sections, fixed_elements = converter(IIM_CALCUTTA_MOCK_ANALYSIS)
    assert "header" in fixed_elements
    header = fixed_elements["header"]
    assert header.get("layout") == "split"
    assert header.get("rightVariables") == ["name", "roll_number"]
    assert "leftContent" in header


def test_converter_produces_auto_variables(converter):
    """Analysis has autoVariables; converter preserves them via fixed_elements flow."""
    sections, fixed_elements = converter(IIM_CALCUTTA_MOCK_ANALYSIS)
    assert "header" in fixed_elements
    assert fixed_elements["header"].get("rightVariables") == ["name", "roll_number"]


def test_converter_produces_table_section(converter):
    """Academic Qualifications section must have table field with columns."""
    sections, fixed_elements = converter(IIM_CALCUTTA_MOCK_ANALYSIS)
    aq = next((s for s in sections if s["id"] == "academic_qualifications"), None)
    assert aq is not None
    et = aq["entryTypes"][0]
    table_field = next((f for f in et["fields"] if f["type"] == "table"), None)
    assert table_field is not None
    assert "columns" in table_field
    assert len(table_field["columns"]) == 4
    year_col = next((c for c in table_field["columns"] if c["id"] == "year"), None)
    assert year_col is not None and year_col.get("align") == "right"


def test_converter_produces_label_left_content_right(converter):
    """Academic Distinctions must have label_left_content_right and subCategories."""
    sections, fixed_elements = converter(IIM_CALCUTTA_MOCK_ANALYSIS)
    ad = next((s for s in sections if s["id"] == "academic_distinctions"), None)
    assert ad is not None
    assert ad.get("layoutStyle") == "label_left_content_right"
    assert "subCategories" in ad
    assert len(ad["subCategories"]) == 3
    assert ad["subCategories"][0].get("bulletDateFormat") == "trailing_year"


def test_converter_produces_vertical_label_grouped(converter):
    """Industry Experience must have vertical_label_grouped and verticalLabelFieldId."""
    sections, fixed_elements = converter(IIM_CALCUTTA_MOCK_ANALYSIS)
    ie = next((s for s in sections if s["id"] == "industry_experience"), None)
    assert ie is not None
    assert ie.get("layoutStyle") == "vertical_label_grouped"
    assert ie.get("verticalLabelFieldId") == "employment_type"
    assert ie.get("headerFields") == ["company", "role", "duration"]


def test_converter_produces_section_header_style(converter):
    """Sections must have sectionHeaderStyle with backgroundColor."""
    sections, fixed_elements = converter(IIM_CALCUTTA_MOCK_ANALYSIS)
    for sec in sections:
        if sec.get("sectionHeaderStyle"):
            assert "backgroundColor" in sec["sectionHeaderStyle"] or "titleCaps" in sec["sectionHeaderStyle"]
    aq = next((s for s in sections if s["id"] == "academic_qualifications"), None)
    assert aq and aq.get("sectionHeaderStyle", {}).get("backgroundColor") == "#e5e5e5"


def test_converter_fallback_header_when_missing(converter):
    """When header is missing but autoVariables present, construct minimal header."""
    analysis = {"format": "rich", "sections": [], "fixedElements": {}, "autoVariables": ["name", "roll_number"]}
    sections, fixed_elements = converter(analysis)
    assert "header" in fixed_elements
    assert fixed_elements["header"]["rightVariables"] == ["name", "roll_number"]
    assert fixed_elements["header"]["layout"] == "split"


# --- _parse_json tests (pdf_analyzer) ---
@pytest.fixture
def parse_json_fn():
    from app.modules.cv_builder.services.pdf_analyzer import _parse_json
    return _parse_json


def test_parse_json_plain(parse_json_fn):
    """Plain JSON parses correctly."""
    result = parse_json_fn('{"format":"rich","sections":[{"id":"x","title":"Y"}]}')
    assert result["format"] == "rich"
    assert len(result["sections"]) == 1
    assert result["sections"][0]["id"] == "x"


def test_parse_json_markdown_wrapped(parse_json_fn):
    """Markdown-wrapped JSON parses correctly."""
    text = '```json\n{"format":"rich","sections":[{"id":"a"}]}\n```'
    result = parse_json_fn(text)
    assert result["format"] == "rich"
    assert result["sections"][0]["id"] == "a"


def test_parse_json_trailing_comma(parse_json_fn):
    """Trailing comma before ] or } is fixed."""
    text = '{"format":"rich","sections":[{"id":"x"},]}'
    result = parse_json_fn(text)
    assert result["format"] == "rich"
    assert result["sections"][0]["id"] == "x"


def test_parse_json_unclosed_brace(parse_json_fn):
    """Unclosed outer brace is fixed."""
    text = '{"format":"rich","sections":[{"id":"x"}]'
    result = parse_json_fn(text)
    assert result["format"] == "rich"
    assert result["sections"][0]["id"] == "x"


def test_parse_json_invalid_returns_default(parse_json_fn):
    """Invalid JSON returns DEFAULT_TEMPLATE."""
    result = parse_json_fn("not json at all {")
    assert result["format"] == "legacy"
    assert "sections" in result


def test_skip_pdf_ai_returns_fixture():
    """With SKIP_PDF_AI=1 and fixture present, analyze_pdf returns rich format with summaryBar."""
    import os

    os.environ["SKIP_PDF_AI"] = "1"
    try:
        from app.modules.cv_builder.services.pdf_analyzer import analyze_pdf
        r = analyze_pdf(b"dummy", "Test")
        assert r.get("format") == "rich", "expected format=rich from fixture"
        assert "summaryBar" in r.get("fixedElements", {}), "expected fixedElements.summaryBar"
        assert r.get("fixedElements", {}).get("summaryBar", {}).get("items"), "expected summaryBar items"
        assert r.get("sections") and isinstance(r["sections"][0], dict), "expected rich sections"
    finally:
        os.environ.pop("SKIP_PDF_AI", None)
