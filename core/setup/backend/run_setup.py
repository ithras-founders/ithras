#!/usr/bin/env python3
"""
Standalone entrypoint for DB setup. Invoke from entrypoint when DB_SETUP=TRUE.
Usage: python -m core.setup.backend.run_setup
"""
import os
import sys

# Path setup: run_setup.py is in core/setup/backend/
_this = os.path.abspath(__file__)
_backend = os.path.dirname(_this)
_setup = os.path.dirname(_backend)
_core = os.path.dirname(_setup)
_ws = os.path.dirname(_core)
for p in (_core, _ws):
    if p not in sys.path:
        sys.path.insert(0, p)
if os.path.exists("/shared") and "/" not in sys.path:
    sys.path.insert(0, "/")


def main():
    from core.setup.backend.data_management import run_db_setup, is_db_setup_enabled
    from shared.database.config import settings

    if not is_db_setup_enabled():
        print("DB_SETUP not enabled; skipping schema sync")
        sys.exit(0)
    if not settings.DATABASE_URL.strip():
        print("DATABASE_URL not set; skipping schema sync")
        sys.exit(0)
    print("Running schema sync (Alembic upgrade head)...")
    ok = run_db_setup()
    if ok:
        print("Schema sync completed")
        sys.exit(0)
    print("Schema sync failed", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
