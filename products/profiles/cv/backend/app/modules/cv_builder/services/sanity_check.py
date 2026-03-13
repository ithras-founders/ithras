"""
Sanity check module for CV template import.
Compares Gemini-extracted config to PDF to detect missed sections or structural elements.
"""

from typing import Dict, Any, List, Optional


def sanity_check_template(
    extracted_config: Dict[str, Any],
    pdf_bytes: Optional[bytes] = None,
) -> Dict[str, Any]:
    """
    Validate extracted template config. Optionally compare to PDF.
    
    Returns:
        passed: bool - True if no critical issues
        missed_sections: List[str] - section titles potentially missing from config
        warnings: List[str] - non-critical warnings
    """
    result: Dict[str, Any] = {
        "passed": True,
        "missed_sections": [],
        "warnings": [],
    }
    
    sections = extracted_config.get("sections", [])
    if not sections:
        result["passed"] = False
        result["warnings"].append("No sections extracted")
        return result
    
    # Heuristic: if config has format "rich" and sections are objects, count unique section titles
    section_titles = []
    for s in sections:
        if isinstance(s, dict):
            title = s.get("title") or s.get("id", "")
            if title:
                section_titles.append(str(title).strip())
        elif isinstance(s, str):
            section_titles.append(s.strip())
    
    # Basic structural checks
    if len(section_titles) < 2:
        result["warnings"].append("Very few sections extracted (expected 3+ for typical CV)")
    
    # Check for required common sections (soft check)
    titles_lower = [t.lower() for t in section_titles]
    common = ["education", "experience", "work", "skills", "personal", "qualification"]
    found = sum(1 for c in common if any(c in t for t in titles_lower))
    if found < 2:
        result["warnings"].append(
            f"Few common CV section types found (education, experience, skills, etc.). Found: {section_titles}"
        )
    
    # If PDF provided, could run a second Gemini call for comparison (future)
    # Or use PyPDF2/pdfplumber for simple text block count heuristic
    if pdf_bytes:
        try:
            import re
            # Simple heuristic: count lines that look like section headers (ALL CAPS, short)
            text = pdf_bytes.decode("utf-8", errors="ignore")
            # Rough: lines 20-80 chars, mostly letters
            lines = text.split("\n")
            potential_headers = [
                l.strip() for l in lines
                if 10 <= len(l.strip()) <= 80
                and re.match(r"^[A-Z\s\-\&]+$", l.strip())
                and len(l.strip()) > 5
            ]
            if potential_headers and len(section_titles) < len(potential_headers) - 2:
                result["missed_sections"] = potential_headers[:5]  # Sample
                result["warnings"].append(
                    f"PDF may have more section-like blocks ({len(potential_headers)}) than extracted ({len(section_titles)})"
                )
        except Exception:
            pass
    
    if result["missed_sections"]:
        result["passed"] = False
    
    return result
