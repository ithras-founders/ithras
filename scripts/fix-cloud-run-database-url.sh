#!/bin/bash
# Fix Cloud Run DATABASE_URL manually - use when pipeline-deployed env vars are wrong.
# Run from ithras/ directory. Requires gcloud CLI and authentication.
#
# Usage: ./scripts/fix-cloud-run-database-url.sh

set -e

# From .env.cloud-run - adjust if your values differ
DATABASE_URL='postgresql://postgres:%2APassword123@/ithras?host=/cloudsql/cs-poc-tmtsercnpw86a9yi062awl2:europe-west1:ithras-dev'
CLOUDSQL_INSTANCE='cs-poc-tmtsercnpw86a9yi062awl2:europe-west1:ithras-dev'
REGION='europe-west1'
SERVICE_NAME='ithras-backend'

echo "Updating $SERVICE_NAME DATABASE_URL in $REGION..."

cat > /tmp/env-fix.yaml << ENVEOF
DATABASE_URL: "$DATABASE_URL"
REDIS_URL: ""
GEMINI_API_KEY: ""
UPLOAD_DIR: "/app/uploads"
ENVEOF

gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --env-vars-file=/tmp/env-fix.yaml

# Ensure Cloud SQL instance is attached
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --add-cloudsql-instances=$CLOUDSQL_INSTANCE

rm -f /tmp/env-fix.yaml

echo "Done. New revision is deploying. Wait ~30s then refresh the app."
