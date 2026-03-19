#!/bin/bash
set -e

# Production entrypoint for Cloud Run
# When DB_SETUP=TRUE:
#   1. Wait for Cloud SQL socket (if using Unix socket) or TCP port
#   2. Run schema sync (Alembic migrations + seeds)
# 3. Start uvicorn

export PORT=${PORT:-8080}

# Guarantee '/' is on PYTHONPATH so shared/, core/, products/, admin/ are
# importable regardless of which directory the interpreter starts from.
export PYTHONPATH="/:${PYTHONPATH:-}"

echo "=== Ithras Backend Startup ==="
echo "PORT: $PORT"

is_db_setup() {
  case "${DB_SETUP}" in
    TRUE|true|1|YES|yes) return 0 ;;
    *) return 1 ;;
  esac
}

# Wait for Cloud SQL to be reachable before running migrations.
# Supports two modes:
#   Unix socket (Cloud Run sidecar): DATABASE_URL contains host=/cloudsql/
#   TCP (docker-compose / external):  standard host:port URL
wait_for_db() {
  if echo "$DATABASE_URL" | grep -q 'host=/cloudsql/'; then
    # Extract the Cloud SQL instance from host=/cloudsql/PROJECT:REGION:INSTANCE
    INSTANCE=$(echo "$DATABASE_URL" | grep -oE 'host=/cloudsql/[^&]+' | sed 's|host=/cloudsql/||')
    SOCKET_DIR="/cloudsql/${INSTANCE}"
    SOCKET_FILE="${SOCKET_DIR}/.s.PGSQL.5432"
    echo "Waiting for Cloud SQL socket: $SOCKET_FILE"
    for i in $(seq 1 60); do
      if [ -S "$SOCKET_FILE" ]; then
        echo "Cloud SQL socket ready (${i}s elapsed)"
        return 0
      fi
      sleep 1
    done
    echo "ERROR: Cloud SQL socket not available after 60s: $SOCKET_FILE"
    return 1
  else
    # TCP mode: extract host and port for pg_isready check
    DB_HOST=$(echo "$DATABASE_URL" | grep -oE '@[^:/]+' | tr -d '@')
    DB_PORT=$(echo "$DATABASE_URL" | grep -oE ':[0-9]+/' | tr -d ':/')
    DB_PORT="${DB_PORT:-5432}"
    if [ -n "$DB_HOST" ]; then
      echo "Waiting for PostgreSQL at $DB_HOST:$DB_PORT"
      for i in $(seq 1 30); do
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" -q 2>/dev/null; then
          echo "PostgreSQL ready (${i}s elapsed)"
          return 0
        fi
        sleep 2
      done
      echo "WARNING: pg_isready timed out after 60s; proceeding anyway"
    fi
  fi
}

run_schema_sync() {
  cd /app
  export PYTHONPATH="${PYTHONPATH:-}:/"
  for i in 1 2 3 4 5 6 7 8 9 10; do
    echo "Running schema sync (attempt $i/10)..."
    if python -m core.setup.backend.run_setup; then
      echo "Schema sync complete"
      return 0
    fi
    echo "Schema sync failed, retrying in 5s..."
    sleep 5
  done
  echo "ERROR: Schema sync failed after 10 attempts"
  return 1
}

if [ -n "$DATABASE_URL" ]; then
  if is_db_setup; then
    echo "=== DB_SETUP=TRUE: Running schema sync ==="
    wait_for_db || exit 1
    run_schema_sync || exit 1
  else
    echo "DB_SETUP not set; skipping schema sync and seeds."
  fi
else
  echo "DATABASE_URL not set; skipping data management."
fi

WORKERS=${UVICORN_WORKERS:-1}
echo "=== Starting Uvicorn Server ==="
echo "Listening on 0.0.0.0:$PORT with $WORKERS worker(s)"

exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --workers "$WORKERS"
