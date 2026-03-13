#!/usr/bin/env python3
"""
Seed Canva-style and institutional CV templates for global enterprise CV builder.
Run from ithras/core/backend: python -m scripts.seed_canva_templates
"""

import sys
import os
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.modules.shared.database import SessionLocal
from app.modules.shared.models import CVTemplate


def make_config(category, design_tokens, sections=None):
    base = {
        "page": {"size": "A4", "margins": {"top": 20, "bottom": 20, "left": 20, "right": 20}},
        "typography": {
            "baseFont": {"family": "sans-serif", "size": 10.5, "lineHeight": 1.2},
            "headerFont": {"sizes": {"h1": 14, "h2": 12, "h3": 10}, "weights": {"h1": 700, "h2": 600, "h3": 600}},
            "bulletStyle": "disc",
            "bulletIndentation": 4.0,
        },
        "spacing": {"lineSpacing": 1.2, "bulletSpacing": 0.5, "sectionTitleBefore": 6, "sectionTitleAfter": 3, "sectionSpacing": 8, "rowSpacing": 4},
        "overflowPolicy": {"allowOverflow": True, "restrictOverflow": False},
        "sections": sections or [],
        "fixedElements": {},
        "autoVariables": [],
        "template_category": category,
        "designTokens": design_tokens,
    }
    return base


DEFAULT_SECTIONS = [
    {
        "id": "education",
        "title": "Education",
        "mandatory": False,
        "visibilityRule": "if_has_entries",
        "layoutStyle": "two_column",
        "order": 0,
        "entryTypes": [{
            "id": "edu_entry",
            "name": "Degree",
            "repeatable": True,
            "layout": "two_column",
            "leftBucketContentSource": "field_derived",
            "leftBucketFieldId": "degree",
            "fields": [
                {"id": "degree", "label": "Degree", "type": "text", "pdfMapping": {"location": "left_bucket", "format": "bold"}},
                {"id": "institution", "label": "Institution", "type": "text", "pdfMapping": {"location": "right_content"}},
                {"id": "year", "label": "Year", "type": "text", "pdfMapping": {"location": "right_content"}},
            ],
        }],
    },
    {
        "id": "experience",
        "title": "Experience",
        "mandatory": False,
        "visibilityRule": "if_has_entries",
        "layoutStyle": "two_column",
        "order": 1,
        "entryTypes": [{
            "id": "exp_entry",
            "name": "Position",
            "repeatable": True,
            "layout": "two_column",
            "leftBucketContentSource": "field_derived",
            "leftBucketFieldId": "company",
            "fields": [
                {"id": "company", "label": "Company", "type": "text", "pdfMapping": {"location": "left_bucket", "format": "bold"}},
                {"id": "role", "label": "Role", "type": "text", "pdfMapping": {"location": "right_content"}},
                {"id": "description", "label": "Description", "type": "bullet_list", "pdfMapping": {"location": "right_content"}},
            ],
        }],
    },
]


def seed_templates(db):
    templates = [
        {
            "id": f"canva-modern-{uuid.uuid4().hex[:8]}",
            "name": "Modern Minimal",
            "institution_id": None,
            "status": "DRAFT",
            "config": make_config(
                "canva_modern",
                {"primary": "#2563eb", "accent": "#64748b", "background": "#ffffff", "borderRadius": "8px"},
                DEFAULT_SECTIONS,
            ),
        },
        {
            "id": f"canva-minimal-{uuid.uuid4().hex[:8]}",
            "name": "Clean Professional",
            "institution_id": None,
            "status": "DRAFT",
            "config": make_config(
                "canva_minimal",
                {"primary": "#1e293b", "accent": "#94a3b8", "background": "#f8fafc", "borderRadius": "4px"},
                DEFAULT_SECTIONS,
            ),
        },
        {
            "id": f"canva-creative-{uuid.uuid4().hex[:8]}",
            "name": "Creative Accent",
            "institution_id": None,
            "status": "DRAFT",
            "config": make_config(
                "canva_creative",
                {"primary": "#7c3aed", "accent": "#f59e0b", "background": "#ffffff", "borderRadius": "12px", "shadow": "0 4px 6px -1px rgba(0,0,0,0.1)"},
                DEFAULT_SECTIONS,
            ),
        },
        {
            "id": f"institutional-{uuid.uuid4().hex[:8]}",
            "name": "Academic / Institutional",
            "institution_id": None,
            "status": "DRAFT",
            "config": make_config(
                "institutional",
                {"primary": "#000000", "accent": "#374151", "background": "#ffffff", "borderRadius": "0px"},
                DEFAULT_SECTIONS,
            ),
        },
    ]

    for t in templates:
        existing = db.query(CVTemplate).filter(CVTemplate.id == t["id"]).first()
        if not existing:
            db.add(CVTemplate(**t))
            print(f"Created template: {t['name']} ({t['config']['template_category']})")
        else:
            print(f"Template already exists: {t['name']}")

    db.commit()


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_templates(db)
    finally:
        db.close()
