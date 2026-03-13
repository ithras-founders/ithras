#!/bin/bash
set -e

# Run holistic DB setup when DB_SETUP=TRUE (deployment).
# Syncs schema to match ORM models via Alembic migrations.
if [ "${DB_SETUP}" = "TRUE" ] || [ "${DB_SETUP}" = "true" ] || [ "${DB_SETUP}" = "1" ]; then
  if [ -n "${DATABASE_URL}" ]; then
    echo "DB_SETUP=TRUE: Running schema sync..."
    python -m app.modules.data_management.run_setup
  else
    echo "DB_SETUP=TRUE but DATABASE_URL not set; skipping schema sync."
  fi
else
  echo "DB_SETUP not set; skipping schema sync."
fi

exec "$@"
