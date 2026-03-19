#!/bin/bash
set -e

# Run Alembic migrations from core/
if [ "${DB_SETUP}" = "TRUE" ] || [ "${DB_SETUP}" = "true" ] || [ "${DB_SETUP}" = "1" ]; then
  if [ -n "${DATABASE_URL}" ]; then
    echo "Running Alembic migrations..."
    if [ -f /core/alembic.ini ]; then
      (cd /core && alembic upgrade head)
    else
      alembic -c ../core/alembic.ini upgrade head 2>/dev/null || alembic upgrade head
    fi
  else
    echo "DB_SETUP=TRUE but DATABASE_URL not set; skipping migrations."
  fi
elif [ -n "${DATABASE_URL}" ]; then
  echo "Running Alembic migrations (DATABASE_URL set)..."
  if [ -f /core/alembic.ini ]; then
    (cd /core && alembic upgrade head)
  else
    alembic -c ../core/alembic.ini upgrade head 2>/dev/null || alembic upgrade head
  fi
else
  echo "DATABASE_URL not set; skipping migrations."
fi

exec "$@"
