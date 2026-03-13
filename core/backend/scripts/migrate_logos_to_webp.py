#!/usr/bin/env python3
"""
Migrate company logos from PNG to WebP.
Converts existing PNG files to WebP, updates DB logo_url, and removes PNG files.
"""

import sys
import os
import io
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.modules.shared.database import SessionLocal
from app.modules.shared.models import Company

try:
    from PIL import Image
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False

from app.config import settings

_scripts_dir = Path(__file__).resolve().parent
_ithras_root = _scripts_dir.parent.parent.parent
_assets_dir = _ithras_root / "assets" / "companies"
ASSETS_COMPANIES_DIR = settings.ASSETS_COMPANIES_DIR or str(_assets_dir)


def to_webp(png_path: str) -> bool:
    """Convert PNG to WebP. Returns True on success."""
    if not HAS_PILLOW:
        return False
    try:
        with Image.open(png_path) as img:
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGBA")
            elif img.mode != "RGB":
                img = img.convert("RGB")
            webp_path = png_path.rsplit(".", 1)[0] + ".webp"
            img.save(webp_path, "WEBP", quality=85)
        return True
    except Exception:
        return False


def main():
    if not HAS_PILLOW:
        print("Error: Pillow is required. Run: pip install Pillow")
        return 1

    print("=" * 60)
    print("Migrate Company Logos: PNG -> WebP")
    print("=" * 60)
    print(f"\nAssets dir: {ASSETS_COMPANIES_DIR}\n")

    db = SessionLocal()
    updated = 0
    deleted = 0

    try:
        companies = db.query(Company).filter(Company.logo_url.isnot(None)).all()
        for company in companies:
            url = company.logo_url
            if not url or not url.startswith("/assets/companies/"):
                continue
            filename = url.split("/")[-1]
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
            if ext not in ("png", "jpg", "jpeg"):
                continue
            base = filename.rsplit(".", 1)[0]
            png_path = os.path.join(ASSETS_COMPANIES_DIR, filename)
            webp_path = os.path.join(ASSETS_COMPANIES_DIR, f"{base}.webp")

            if os.path.exists(webp_path):
                company.logo_url = f"/assets/companies/{base}.webp"
                db.add(company)
                if os.path.exists(png_path):
                    os.remove(png_path)
                    deleted += 1
                updated += 1
                print(f"  ✓ {company.name}: .png -> .webp (webp existed)")
            elif os.path.exists(png_path) and to_webp(png_path):
                company.logo_url = f"/assets/companies/{base}.webp"
                db.add(company)
                os.remove(png_path)
                updated += 1
                deleted += 1
                print(f"  ✓ {company.name}: converted .png -> .webp")
            else:
                print(f"  ✗ {company.name}: cannot convert (file missing or conversion failed)")

        # Delete any remaining PNG/JPG files (orphans)
        for f in os.listdir(ASSETS_COMPANIES_DIR):
            if f.startswith("."):
                continue
            if f.lower().endswith((".png", ".jpg", ".jpeg")):
                p = os.path.join(ASSETS_COMPANIES_DIR, f)
                try:
                    os.remove(p)
                    deleted += 1
                    print(f"  ⊘ Removed orphan: {f}")
                except OSError:
                    pass

        db.commit()
        print("\n" + "=" * 60)
        print(f"Done: {updated} DB updates, {deleted} PNG files removed")
        print("=" * 60)
        return 0
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
