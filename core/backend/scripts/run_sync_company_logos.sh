#!/usr/bin/env bash
# Run sync_company_logos.py or migrate_logos_to_webp.py with the correct environment.
# Requires: docker-compose with db and backend running.
# Use --force to re-download and replace existing (placeholder) logos.
# Use 'migrate' to convert PNG logos to WebP.
set -e
cd "$(dirname "$0")/../../.."
if [ "$1" = "migrate" ]; then
  docker-compose exec -e ASSETS_COMPANIES_DIR=/app_assets/companies backend python scripts/migrate_logos_to_webp.py
else
  docker-compose exec -e ASSETS_COMPANIES_DIR=/app_assets/companies backend python scripts/sync_company_logos.py "$@"
fi
