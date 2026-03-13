"""
PDF Analysis Service using Google Gemini Public API (REST).
Analyzes CV/Resume PDF templates and extracts sections, fields, and structure for the builder.
Uses direct REST API for reliability.
"""
import os
import json
import re
import base64
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Default when API fails or returns empty
DEFAULT_TEMPLATE = {
    "format": "legacy",
    "sections": ["Personal Information", "Education", "Work Experience", "Skills"],
    "fields": {
        "Personal Information": ["Name", "Email", "Phone", "Address"],
        "Education": ["Degree", "Institution", "Year", "GPA/Grades"],
        "Work Experience": ["Company", "Role", "Duration", "Description"],
        "Skills": ["Technical Skills", "Soft Skills"],
    },
    "repeatable_sections": ["Education", "Work Experience"],
    "structure": {"layout": "two_column", "formatting": "Professional CV layout"},
}

PROMPT = """You are a Layout Architect. Analyze this CV/Resume PDF template. Extract the structure to recreate it EXACTLY as shown. Do NOT return the candidate's personal data; use placeholder tokens instead.

VARIABLE REPLACEMENT: Replace personal text with placeholders: candidate name -> {{name}}, roll/ID (e.g. MBA/0188/61) -> {{roll_number}}, email -> {{email}}, institution -> {{college_name}}, program -> {{program}}. Use these in rightVariables, summaryBar items, and footer content where personal data appears.

CRITICAL: You MUST return format: "rich" (not legacy) with fixedElements.summaryBar if you see a dark bar of highlight items. Use fixedElements.header with rightVariables for split header (logo left, name/roll right). Use sectionHeaderStyle.backgroundColor for grey section title bars. Use type: "table" with columns for tabular data. Use layoutStyle: "label_left_content_right" with subCategories for label-left content-right layouts. Use layoutStyle: "vertical_label_grouped" with verticalLabelFieldId for vertically grouped sections (e.g. Full Time / Intern). Use bulletDateFormat: "trailing_year" for bullet items with years at the end.

TYPOGRAPHY: For each section, if you can detect styling: add typographyOverrides: {fontSize (pt), fontWeight: "bold"|"normal", textAlign: "left"|"center"|"right"} to sectionHeaderStyle or at section level. Section titles are often 11-12pt, bold, uppercase.

COMPONENT TYPE: Add componentType per section: "table" (tabular like Academic Qualifications), "list" (bulleted), "header_block" (title only), "text_block" (plain text).

Identify ALL of the following:

1. HEADER (top area): If there is a logo (institution/org) on left and name/roll/ID on right, set fixedElements.header:
   - layout: "split"
   - logoUrl: "" (empty - user uploads later)
   - leftContent: institution/org name text under logo (exact text)
   - rightVariables: ["name","roll_number"] or ["name"] etc - map each top-right item to variable id (name, roll_number, email, program, college_name, phone, linkedin_url, portfolio_url)
   - logoPosition: "left" or "right" or "center"

2. SUMMARY BAR: Dark bar with highlight items (e.g. "IIM TOP 6% | ABG INTERN"). fixedElements.summaryBar: {items: ["Item1","Item2"], backgroundColor: "#333", textColor: "#fff"}

3. FOOTER: If present, fixedElements.footer: {content: "...", variables: ["email"]}

4. AUTO VARIABLES: List ALL variable ids used in the document: name, roll_number, email, program, college_name, phone, etc. Put in autoVariables array.

5. SECTIONS: For each section:
   - sectionHeaderStyle: {backgroundColor: "#e5e5e5" if grey bar, titleAlign: "left"|"center"|"right", titleCaps: true, titleDivider: true}
   - layoutStyle: two_column | label_left_content_right | vertical_label_grouped
   - subCategories for label_left_content_right: [{label, fieldId, richText: true, bulletDateFormat: "trailing_year"}]
   - verticalLabelFieldId for vertical_label_grouped
   - headerFields for entry headers
   - entryTypes with fields. For achievement/bullet fields with years at end: bulletDateFormat: "trailing_year"
   - For tabular sections (Degree|Institute|%|Year): type: "table", columns: [{id: "degree", label: "Degree/Exam", align: "left"}, {id: "institute", label: "Board/Institute", align: "left"}, {id: "percentage", label: "%/CGPA", align: "left"}, {id: "year", label: "Rank Year", align: "right"}]

6. Field types: bullet_list (achievements, responsibilities), table (tabular), text (simple). Table needs columns array.

Return ONLY valid JSON (no markdown). RICH FORMAT (preferred):
{"format":"rich","fixedElements":{"header":{"layout":"split","logoUrl":"","leftContent":"Institution Name","rightVariables":["name","roll_number"],"logoPosition":"left"},"summaryBar":{"items":["{{name}} - Top 6%","Item2"],"backgroundColor":"#333","textColor":"#fff"},"footer":{}},"autoVariables":["name","roll_number"],"sections":[{"id":"section_slug","title":"SECTION TITLE","componentType":"table|list|header_block|text_block","typographyOverrides":{"fontSize":12,"fontWeight":"bold","textAlign":"left"},"sectionHeaderStyle":{"backgroundColor":"#e5e5e5","titleCaps":true,"titleAlign":"left","titleDivider":true},"layoutStyle":"two_column|label_left_content_right|vertical_label_grouped","subCategories":[{"label":"Sub-head","fieldId":"field_slug","richText":true,"bulletDateFormat":"trailing_year"}],"verticalLabelFieldId":"field_slug","headerFields":["company","role","duration"],"entryTypes":[{"id":"default","name":"Entry","repeatable":true,"fields":[{"id":"field_slug","label":"Label","type":"text|bullet_list|table","placeholder":"{{name}}","bulletDateFormat":"trailing_year","columns":[{"id":"c1","label":"Col1","align":"left"}]}]}],"order":0}],"repeatable_sections":["Education","Work Experience"]}

LEGACY FORMAT (fallback if structure is simple):
{"format":"legacy","sections":["Section1","Section2"],"fields":{"Section1":["field1","field2"],"Section2":[...]},"repeatable_sections":["Education","Work Experience"],"structure":{"layout":"two_column","formatting":"Brief description"}}"""


def _default_result() -> Dict[str, Any]:
    return {
        "format": DEFAULT_TEMPLATE.get("format", "legacy"),
        "template_structure": DEFAULT_TEMPLATE["structure"],
        "sections": DEFAULT_TEMPLATE["sections"],
        "fields": DEFAULT_TEMPLATE["fields"].copy(),
        "repeatable_sections": list(DEFAULT_TEMPLATE["repeatable_sections"]),
    }


def analyze_pdf(pdf_bytes: bytes, institution_name: str) -> Dict[str, Any]:
    """Analyze PDF via Gemini REST API. Returns structure or default on failure."""
    from app.config import settings as _app_settings
    api_key = _app_settings.GEMINI_API_KEY
    skip_ai = _app_settings.SKIP_PDF_AI

    if not api_key:
        logger.warning("GEMINI_API_KEY not set; using default template (set in ithras/.env and run docker-compose from ithras/)")
        return _default_result()

    if skip_ai:
        # Try loading IIM Calcutta fixture for full-pipeline testing without Gemini
        # pdf_analyzer.py is at .../cv_builder/services/; go up 4 levels to backend/
        fixture_path = os.path.join(
            os.path.dirname(__file__),
            "..", "..", "..", "..", "fixtures", "iim_calcutta_analysis.json",
        )
        fixture_path = os.path.normpath(fixture_path)
        if os.path.isfile(fixture_path):
            try:
                with open(fixture_path, encoding="utf-8") as f:
                    fixture = json.load(f)
                if fixture.get("format") == "rich" and fixture.get("sections"):
                    logger.info("SKIP_PDF_AI=1; using fixture %s", fixture_path)
                    return {
                        "format": "rich",
                        "template_structure": fixture.get("structure", {}),
                        "sections": fixture.get("sections", []),
                        "fixedElements": fixture.get("fixedElements", {}),
                        "autoVariables": list(fixture.get("autoVariables", [])),
                        "repeatable_sections": list(fixture.get("repeatable_sections", [])),
                    }
            except (json.JSONDecodeError, OSError) as e:
                logger.warning("Could not load fixture %s: %s", fixture_path, e)
        logger.info("SKIP_PDF_AI=1; using default template")
        return _default_result()

    logger.warning("Calling Gemini API for PDF analysis (model=%s)", _app_settings.GEMINI_MODEL)

    _MAX_PDF_BYTES = 20 * 1024 * 1024  # 20MB
    if len(pdf_bytes) > _MAX_PDF_BYTES:
        logger.warning("PDF too large (%d bytes > %d); using default template", len(pdf_bytes), _MAX_PDF_BYTES)
        return _default_result()

    raw_model = _app_settings.GEMINI_MODEL
    model = (raw_model or "gemini-2.0-flash").replace("-001", "").replace("-002", "").strip()
    # v1beta has broader model support; responseMimeType is not supported in v1/v1beta for all models
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "contents": [{
            "parts": [
                {"inlineData": {"mimeType": "application/pdf", "data": base64.b64encode(pdf_bytes).decode("utf-8")}},
                {"text": PROMPT}
            ]
        }],
        "generationConfig": {"temperature": 0}
    }

    def _log_http_error(exc) -> str:
        """Read and log HTTP error body; return truncated body for re-raise context."""
        try:
            err_body = ""
            if getattr(exc, "fp", None) and exc.fp:
                err_body = exc.fp.read().decode("utf-8", errors="replace")
            truncated = err_body[:500] + "..." if len(err_body) > 500 else err_body
            logger.warning("Gemini API HTTP %s: %s", exc.code, truncated)
            return err_body
        except Exception:
            logger.warning("Gemini API HTTP %s (could not read body)", exc.code)
            return ""

    try:
        import urllib.request
        import urllib.error

        def _do_request(u, p):
            req = urllib.request.Request(
                u,
                data=json.dumps(p).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                return json.loads(resp.read().decode())

        try:
            body = _do_request(url, payload)
        except urllib.error.HTTPError as e:
            _log_http_error(e)
            if e.code == 404:
                fallback_models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"]
                last_err = e
                for fm in fallback_models:
                    if fm == model:
                        continue
                    logger.warning("Model %s returned 404, retrying with %s", model, fm)
                    fallback_url = f"https://generativelanguage.googleapis.com/v1beta/models/{fm}:generateContent?key={api_key}"
                    try:
                        body = _do_request(fallback_url, payload)
                        break
                    except urllib.error.HTTPError as e2:
                        _log_http_error(e2)
                        last_err = e2
                else:
                    raise last_err
            else:
                raise

        text = _extract_text_from_response(body)
        if not text:
            logger.warning("Empty response from Gemini")
            return _default_result()

        result = _parse_json(text)
        sections = result.get("sections", [])
        fields = result.get("fields", {})
        fmt = result.get("format", "")
        # Diagnostic logging for pipeline debugging
        logger.info(
            "PDF analysis parse result: format=%s, fixedElements=%s, sections_count=%d, sections_are_objects=%s",
            fmt,
            "present" if result.get("fixedElements") else "missing",
            len(sections),
            isinstance(sections[0], dict) if sections else "n/a",
        )

        if not sections:
            logger.warning("Gemini returned empty sections")
            return _default_result()

        # Detect rich format: explicit format=rich or sections as array of objects with id/title
        is_rich = fmt == "rich" or (
            sections
            and isinstance(sections[0], dict)
            and ("id" in sections[0] or "title" in sections[0])
        )
        if is_rich:
            return {
                "format": "rich",
                "template_structure": result.get("structure", {}),
                "sections": sections,
                "fixedElements": result.get("fixedElements", {}),
                "autoVariables": list(result.get("autoVariables", [])),
                "repeatable_sections": list(result.get("repeatable_sections", [])),
            }

        # Legacy format: sections are strings, fields is dict of section_name -> field list
        norm_fields = {}
        for sec in sections:
            found = False
            for k, v in fields.items():
                if (k or "").strip().lower() == (sec or "").strip().lower():
                    norm_fields[sec] = v if isinstance(v, list) else [str(v)]
                    found = True
                    break
            if not found:
                raw = fields.get(sec, fields.get((sec or "").strip(), []))
                norm_fields[sec] = raw if isinstance(raw, list) else ([str(raw)] if raw else [])

        return {
            "format": "legacy",
            "template_structure": result.get("structure", {}),
            "sections": sections,
            "fields": norm_fields,
            "repeatable_sections": list(result.get("repeatable_sections", [])),
        }
    except Exception as e:
        logger.exception("PDF analysis failed: %s", e)
        return _default_result()


def _extract_text_from_response(body: dict) -> str:
    """Extract text from Gemini generateContent response."""
    try:
        candidates = body.get("candidates", [])
        if not candidates:
            return ""
        parts = candidates[0].get("content", {}).get("parts", [])
        for p in parts:
            if "text" in p:
                return p.get("text", "")
        return ""
    except Exception:
        return ""


def _parse_json(text: str) -> Dict[str, Any]:
    """Parse JSON from model output. Handles markdown-wrapped, truncated, and malformed JSON."""
    raw_text = (text or "").strip()
    text = raw_text

    # Strip markdown code blocks
    for pat in [r"```json\s*(.*?)\s*```", r"```\s*(.*?)\s*```"]:
        m = re.search(pat, text, re.DOTALL | re.I)
        if m:
            text = m.group(1).strip()
            break

    # Try extracting from first { to matching }
    start = text.find("{")
    if start >= 0:
        depth = 0
        for i, c in enumerate(text[start:], start):
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    chunk = text[start : i + 1]
                    try:
                        return json.loads(chunk)
                    except json.JSONDecodeError:
                        # Fallback: try fixing common truncation issues
                        fixed = _try_fix_truncated_json(chunk)
                        if fixed:
                            return fixed
                        break

    # Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        fixed = _try_fix_truncated_json(text)
        if fixed:
            return fixed

    # Fallback: search for "format":"rich" and try to extract a valid JSON object
    if '"format":"rich"' in text or '"format": "rich"' in text:
        extracted = _try_extract_rich_json(text)
        if extracted:
            return extracted

    logger.debug(
        "JSON parse failed: text length=%d, first 200 chars: %s",
        len(raw_text),
        repr(raw_text[:200]) if raw_text else "(empty)",
    )
    return DEFAULT_TEMPLATE.copy()


def _try_fix_truncated_json(chunk: str) -> Dict[str, Any] | None:
    """Try to fix common JSON truncation (trailing comma, unclosed brackets)."""
    s = chunk.strip()
    # Remove trailing comma before ] or }
    s = re.sub(r",\s*([}\]])", r"\1", s)
    # Try closing unclosed structures
    open_braces = s.count("{") - s.count("}")
    open_brackets = s.count("[") - s.count("]")
    for _ in range(open_braces):
        s = s.rstrip()
        if not s.endswith("}"):
            s += "}"
    for _ in range(open_brackets):
        s = s.rstrip()
        if not s.endswith("]"):
            s += "]"
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        return None


def _try_extract_rich_json(text: str) -> Dict[str, Any] | None:
    """If parse failed but text contains format:rich, try to extract a valid object."""
    start = text.find("{")
    if start < 0:
        return None
    depth = 0
    for i, c in enumerate(text[start:], start):
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                chunk = text[start : i + 1]
                try:
                    result = json.loads(chunk)
                    if isinstance(result, dict) and result.get("sections"):
                        return result
                except json.JSONDecodeError:
                    pass
                result = _try_fix_truncated_json(chunk)
                if isinstance(result, dict) and result.get("sections"):
                    return result
                break
    return None


# Alias so PDFAnalyzer.analyze_pdf can delegate to the module-level function (avoids recursion)
_analyze_pdf_fn = analyze_pdf


class PDFAnalyzer:
    """Wrapper for backward compatibility - delegates to module-level analyze_pdf."""

    def __init__(self):
        pass

    def analyze_pdf(self, pdf_bytes: bytes, institution_name: str) -> Dict[str, Any]:
        return _analyze_pdf_fn(pdf_bytes, institution_name)
