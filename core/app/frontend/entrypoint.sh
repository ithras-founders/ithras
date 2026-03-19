#!/bin/sh
set -e

# Unified entrypoint for local (docker-compose) and Cloud Run.
# Defaults are for local dev; Cloud Run overrides PORT and BACKEND_URL via env.
LISTEN_PORT="${PORT:-80}"
BACKEND_ORIGIN="${BACKEND_URL:-http://backend:8000}"

echo "=== Ithras Frontend ==="
echo "LISTEN_PORT:    $LISTEN_PORT"
echo "BACKEND_ORIGIN: $BACKEND_ORIGIN"

# Verify template exists
if [ ! -f /etc/nginx/conf.d/default.conf.template ]; then
  echo "ERROR: nginx template not found at /etc/nginx/conf.d/default.conf.template"
  ls -la /etc/nginx/conf.d/
  exit 1
fi

# Extract backend hostname from URL for proxy Host header
BACKEND_HOST=$(echo "$BACKEND_ORIGIN" | sed -e 's|https\?://||' -e 's|/.*||')
echo "BACKEND_HOST:   $BACKEND_HOST"

# Substitute custom placeholders (no conflict with nginx $variables)
sed \
  -e "s|__LISTEN_PORT__|$LISTEN_PORT|g" \
  -e "s|__BACKEND_ORIGIN__|$BACKEND_ORIGIN|g" \
  -e "s|__BACKEND_HOST__|$BACKEND_HOST|g" \
  /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "=== Generated nginx config ==="
cat /etc/nginx/conf.d/default.conf
echo "=== End nginx config ==="

# Validate before starting
echo "Validating nginx config..."
if ! nginx -t; then
  echo "ERROR: nginx config validation failed"
  exit 1
fi

echo "=== Starting nginx ==="
exec nginx -g "daemon off;"
