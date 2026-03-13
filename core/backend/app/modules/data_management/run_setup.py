#!/usr/bin/env python3
"""
Standalone entrypoint for DB setup. Invoke from entrypoint.sh when DB_SETUP=TRUE.
Usage: python -m app.modules.data_management.run_setup
"""
import os
import sys

# Ensure backend root is in path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Set cwd so alembic.ini is found
os.chdir(backend_dir)


def main():
    from app.modules.data_management import run_db_setup, is_db_setup_enabled
    from app.config import settings

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
    else:
        print("Schema sync failed", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
