#!/bin/bash
set -e

# Production entrypoint for Cloud Run
# When DB_SETUP=TRUE:
#   1. Wait for Cloud SQL socket (if using Unix socket)
#   2. Run Alembic migrations (schema sync)
#   3. Verify schema is at Alembic head
#   4. Run idempotent startup seeds
# 5. Start uvicorn

export PORT=${PORT:-8080}

echo "=== Ithras Backend Startup ==="
echo "PORT: $PORT"

is_db_setup() {
  case "${DB_SETUP}" in
    TRUE|true|1|YES|yes) return 0 ;;
    *) return 1 ;;
  esac
}

run_schema_sync() {
  cd /app
  for i in 1 2 3 4 5 6 7 8 9 10; do
    echo "Running schema sync (attempt $i/10)..."
    if python -m app.modules.data_management.run_setup; then
      echo "Schema sync complete"
      return 0
    fi
    echo "Schema sync failed, retrying in 5s..."
    sleep 5
  done
  echo "ERROR: Schema sync failed after 10 attempts"
  return 1
}

verify_schema() {
  cd /app
  echo "Verifying Alembic schema state..."
  python -m app.modules.shared.setup.verify_schema
}

run_startup_seeds() {
  cd /app
  echo "Running idempotent startup seeds..."
  python -m app.modules.shared.setup.startup_seeds
}

if is_db_setup && [ -n "$DATABASE_URL" ]; then
  echo "=== DB_SETUP=TRUE: Running holistic data management ==="
  if echo "$DATABASE_URL" | grep -q '/cloudsql/'; then
    echo "Waiting 15s for Cloud SQL sidecar to establish connection..."
    sleep 15
  fi
  run_schema_sync || exit 1
  verify_schema || exit 1
  run_startup_seeds || exit 1
elif [ -n "$DATABASE_URL" ]; then
  echo "DB_SETUP not set; skipping schema sync and seeds."
else
  echo "DATABASE_URL not set; skipping data management."
fi

WORKERS=${UVICORN_WORKERS:-4}
echo "=== Starting Uvicorn Server ==="
echo "Listening on 0.0.0.0:$PORT with $WORKERS worker(s)"

exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers $WORKERS
