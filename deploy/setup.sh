#!/usr/bin/env bash
# deploy/setup.sh
#
# One-time infrastructure provisioning for Ithras on GCP.
# Run this once before your first deployment.
# Prerequisites: gcloud CLI installed and authenticated, project selected.
#
# Usage:
#   export PROJECT_ID=my-gcp-project   # optional if `gcloud config set project ...` is already set
#   export REGION=europe-west1
#   export DB_PASSWORD=<strong-password>
#   bash deploy/setup.sh

set -euo pipefail

resolve_project_id() {
  if [[ -n "${PROJECT_ID:-}" ]]; then
    printf '%s\n' "$PROJECT_ID"
    return 0
  fi

  if [[ -n "${GOOGLE_CLOUD_PROJECT:-}" ]]; then
    printf '%s\n' "$GOOGLE_CLOUD_PROJECT"
    return 0
  fi

  if [[ -n "${GCLOUD_PROJECT:-}" ]]; then
    printf '%s\n' "$GCLOUD_PROJECT"
    return 0
  fi

  if [[ -n "${DEVSHELL_PROJECT_ID:-}" ]]; then
    printf '%s\n' "$DEVSHELL_PROJECT_ID"
    return 0
  fi

  gcloud config get-value project --quiet 2>/dev/null || true
}

prompt_with_default() {
  local prompt="$1"
  local default_value="$2"
  local user_value=""

  if [[ ! -t 0 ]]; then
    printf '%s\n' "$default_value"
    return 0
  fi

  read -r -p "$prompt [$default_value]: " user_value
  if [[ -n "$user_value" ]]; then
    printf '%s\n' "$user_value"
    return 0
  fi

  printf '%s\n' "$default_value"
}

PROJECT_ID="$(resolve_project_id | tr -d '[:space:]')"
if [[ -z "$PROJECT_ID" || "$PROJECT_ID" == "(unset)" ]]; then
  echo "ERROR: Set PROJECT_ID or run 'gcloud config set project YOUR_PROJECT_ID'" >&2
  exit 1
fi
DEFAULT_REGION="${REGION:-europe-west1}"
DEFAULT_INSTANCE_NAME="${CLOUD_SQL_INSTANCE:-ithras-db}"

REGION="$(prompt_with_default "GCP region" "$DEFAULT_REGION")"
INSTANCE_NAME="$(prompt_with_default "Cloud SQL instance name" "$DEFAULT_INSTANCE_NAME")"
DB_NAME="${DB_NAME:-placement_db}"
DB_USER="${DB_USER:-ithras}"
DB_PASSWORD="${DB_PASSWORD:?Set DB_PASSWORD}"
REGISTRY_REPO="${REGISTRY_REPO:-cloud-run-source-deploy/ithras}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-ithras-backend-sa}"
SECRET_PREFIX="${SECRET_PREFIX:-ithras}"

echo "=== Ithras GCP Setup ==="
echo "Project:  $PROJECT_ID"
echo "Region:   $REGION"
echo "Instance: $INSTANCE_NAME"
echo ""

# ── Enable required APIs ──────────────────────────────────────────────────────
echo "Enabling GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  sql-component.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  --project="$PROJECT_ID"

# ── Artifact Registry repository ─────────────────────────────────────────────
echo "Creating Artifact Registry repository..."
gcloud artifacts repositories create "${REGISTRY_REPO##*/}" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Ithras container images" \
  --project="$PROJECT_ID" \
  2>/dev/null || echo "  Repository already exists — skipping"

# ── Cloud SQL instance ────────────────────────────────────────────────────────
echo "Creating Cloud SQL Postgres 15 instance (this takes 3–5 minutes)..."
gcloud sql instances create "$INSTANCE_NAME" \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region="$REGION" \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=02:00 \
  --retained-backups-count=7 \
  --availability-type=zonal \
  --no-assign-ip \
  --project="$PROJECT_ID" \
  2>/dev/null || echo "  Instance already exists — skipping"

echo "Creating database '$DB_NAME'..."
gcloud sql databases create "$DB_NAME" \
  --instance="$INSTANCE_NAME" \
  --project="$PROJECT_ID" \
  2>/dev/null || echo "  Database already exists — skipping"

echo "Creating database user '$DB_USER'..."
gcloud sql users create "$DB_USER" \
  --instance="$INSTANCE_NAME" \
  --password="$DB_PASSWORD" \
  --project="$PROJECT_ID" \
  2>/dev/null || echo "  User already exists — updating password"
gcloud sql users set-password "$DB_USER" \
  --instance="$INSTANCE_NAME" \
  --password="$DB_PASSWORD" \
  --project="$PROJECT_ID" 2>/dev/null || true

INSTANCE_CONNECTION_NAME="${PROJECT_ID}:${REGION}:${INSTANCE_NAME}"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${INSTANCE_CONNECTION_NAME}"
echo ""
echo "Cloud SQL instance connection name: $INSTANCE_CONNECTION_NAME"
echo "DATABASE_URL (socket form):         $DATABASE_URL"
echo ""

# ── Service account ───────────────────────────────────────────────────────────
SA_EMAIL="${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"
echo "Creating service account $SA_EMAIL..."
gcloud iam service-accounts create "$SERVICE_ACCOUNT" \
  --display-name="Ithras Backend Cloud Run SA" \
  --project="$PROJECT_ID" \
  2>/dev/null || echo "  Service account already exists — skipping"

for ROLE in \
  roles/cloudsql.client \
  roles/secretmanager.secretAccessor \
  roles/artifactregistry.reader; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$ROLE" \
    --quiet 2>/dev/null || true
done

# Grant Cloud Build the ability to run builds and deploy to Cloud Run.
# Newer projects often use the Compute Engine default service account for
# gcloud/cloudbuild-triggered builds instead of the legacy Cloud Build account.
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
CB_SAS=(
  "${PROJECT_ID}@cloudbuild.gserviceaccount.com"
  "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
)
for CB_SA in "${CB_SAS[@]}"; do
  for ROLE in \
    roles/cloudbuild.builds.builder \
    roles/run.admin \
    roles/iam.serviceAccountUser \
    roles/artifactregistry.writer; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
      --member="serviceAccount:${CB_SA}" \
      --role="$ROLE" \
      --quiet 2>/dev/null || true
  done
done

# ── Store secrets in Secret Manager ──────────────────────────────────────────
echo "Storing DATABASE_URL in Secret Manager..."
echo -n "$DATABASE_URL" | gcloud secrets create "${SECRET_PREFIX}-database-url" \
  --data-file=- --project="$PROJECT_ID" 2>/dev/null || \
  echo -n "$DATABASE_URL" | gcloud secrets versions add "${SECRET_PREFIX}-database-url" \
    --data-file=- --project="$PROJECT_ID"

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Generate a JWT secret:  openssl rand -hex 32"
echo "  2. Set up a Cloud Build trigger pointing to your repo"
echo "  3. Configure the trigger substitutions (see deploy/env.example)"
echo "  4. Run your first deployment:"
echo ""
echo "     gcloud builds submit . \\"
echo "       --config=cloudbuild.yaml \\"
echo "       --project=$PROJECT_ID \\"
echo "       --substitutions=_CLOUD_SQL_INSTANCE=${INSTANCE_CONNECTION_NAME},\\"
echo "_DATABASE_URL=${DATABASE_URL},\\"
echo "_JWT_SECRET=<your-jwt-secret>,\\"
echo "_GEMINI_API_KEY=<your-key>,\\"
echo "_SERVICE_ACCOUNT=${SA_EMAIL}"
echo ""
