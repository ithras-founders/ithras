# Ithras – Google Cloud Run Deployment via GitLab CI/CD

This guide covers deploying Ithras to Google Cloud Run using GitLab CI/CD integration.

## Architecture

- **Backend**: Single Cloud Run service (FastAPI, port 8080)
- **Frontend**: Single Cloud Run service (Nginx, port 8080, proxies `/api` to backend)
- **Database**: Cloud SQL PostgreSQL (or any PostgreSQL reachable from Cloud Run)
- **Redis**: Cloud Memorystore (or Redis reachable from Cloud Run)

## Prerequisites

1. **Google Cloud project** with billing enabled
2. **GitLab** project with CI/CD enabled
3. **Artifact Registry** repository for container images
4. **Service account** with Cloud Run and Artifact Registry permissions

## Before first deploy (required)

**You must configure `DATABASE_URL`** before deploying. The application defaults to `postgresql://...@db:5432/...` for local Docker Compose—the hostname `db` only resolves inside the compose network. On Cloud Run, there is no `db` host; the service will fail with "could not translate host name db to address" until you set `DATABASE_URL`.

### First deploy checklist

1. **Migrations require** `DB_SETUP=TRUE` and `DATABASE_URL`. Set both in Cloud Run backend env vars. Without them, schema sync and seeds are skipped.
2. **Cloud SQL (Unix socket):** If using the Cloud SQL Auth Proxy sidecar, set `CLOUDSQL_INSTANCE` (e.g. `PROJECT:REGION:INSTANCE`). The entrypoint waits 15s for the sidecar before running migrations.
3. **Health checks:** On first deploy, migrations run automatically. Allow ~30–60s for schema sync before health checks pass. Adjust Cloud Run startup probe if needed.

Checklist:
- [ ] PostgreSQL instance created (Cloud SQL or external)
- [ ] `DATABASE_URL` set in Cloud Run service env vars before or during first deploy
- [ ] `DB_SETUP=TRUE` set for migrations to run
- [ ] `CLOUDSQL_INSTANCE` set if using Cloud SQL Unix socket
- [ ] Database reachable from Cloud Run (VPC connector for private IP, or authorized networks for public IP)

## 1. Google Cloud Setup

### Enable APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com   # if using Cloud SQL
```

### Create Artifact Registry repository

```bash
gcloud artifacts repositories create ithras \
  --repository-format=docker \
  --location=us-central1 \
  --description="Ithras container images"
```

### Create service account for CI/CD

```bash
# Create service account
gcloud iam service-accounts create ithras-gitlab-ci \
  --display-name="Ithras GitLab CI"

# Grant roles (adjust project-id and region)
PROJECT_ID=your-project-id
REGION=us-central1
SA_EMAIL=ithras-gitlab-ci@${PROJECT_ID}.iam.gserviceaccount.com

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

# Create and download key (store securely; add to GitLab variables)
gcloud iam service-accounts keys create key.json \
  --iam-account=${SA_EMAIL}
```

**Security note:** Prefer [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation) over keys when possible.

### Database and Redis

Use Cloud SQL for PostgreSQL and Cloud Memorystore for Redis, or any other compatible services. Ensure Cloud Run can reach them (VPC connector if using private IPs, or public IP with authorized networks).

#### Cloud SQL PostgreSQL setup

1. Create a Cloud SQL instance:
   ```bash
   gcloud sql instances create ithras-db \
     --database-version=POSTGRES_15 \
     --tier=db-f1-micro \
     --region=us-central1
   ```

2. Create database and user:
   ```bash
   gcloud sql databases create placement_db --instance=ithras-db
   gcloud sql users create ithras_user --instance=ithras-db --password=YOUR_SECURE_PASSWORD
   ```

3. Get connection details:
   - **Public IP**: `gcloud sql instances describe ithras-db --format='value(ipAddresses[0].ipAddress)'`
   - Add Cloud Run egress IPs to authorized networks, or use 0.0.0.0/0 for testing only
   - `DATABASE_URL=postgresql://ithras_user:YOUR_PASSWORD@PUBLIC_IP:5432/placement_db`
   - **Private IP**: Use a VPC connector and the instance's private IP
   - **Unix socket** (Cloud SQL Auth Proxy): `postgresql://user:pass@/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME/placement_db`

## 2. GitLab CI/CD Variables

Add these in **Settings > CI/CD > Variables** (mask and protect sensitive ones):

| Variable | Type | Protected | Description |
|----------|------|-----------|-------------|
| `GCP_PROJECT_ID` | Variable | ✓ | Google Cloud project ID |
| `GCP_REGION` | Variable | ✓ | e.g. `us-central1` |
| `GCP_SERVICE_ACCOUNT_KEY` | File | ✓ | Contents of `key.json` (create above) |
| `GAR_REPOSITORY` | Variable | | Artifact Registry repo name (default: `ithras`) |
| `BACKEND_SERVICE_NAME` | Variable | | Cloud Run backend service (default: `ithras-backend`) |
| `FRONTEND_SERVICE_NAME` | Variable | | Cloud Run frontend service (default: `ithras-frontend`) |

## 3. Cloud Run environment variables

### Backend service

Configure these for the **backend** service in Cloud Run (Console or `gcloud`):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✓ | `postgresql://user:pass@host:5432/dbname` |
| `REDIS_URL` | | `redis://host:6379/0` (optional if no Redis) |
| `GEMINI_API_KEY` | | For CV Builder PDF import |
| `ASSETS_COMPANIES_DIR` | | `/app_assets/companies` (default) |
| `UPLOAD_DIR` | | `/app/uploads` (default) |

### Frontend service

The pipeline sets `BACKEND_URL` and `PORT` automatically. `BACKEND_URL` is the backend Cloud Run URL so the frontend can proxy `/api` requests.

### First-time setup example

```bash
gcloud run services update ithras-backend \
  --region=us-central1 \
  --set-env-vars="DATABASE_URL=postgresql://...,REDIS_URL=redis://...,GEMINI_API_KEY=..."
```

## 4. Pipeline behavior

On push to `main` or `develop`:

1. **build-backend**: Builds `Dockerfile.backend`, pushes to Artifact Registry
2. **build-frontend**: Builds `Dockerfile.frontend`, pushes to Artifact Registry
3. **deploy-backend**: Deploys backend to Cloud Run
4. **deploy-frontend**: Deploys frontend with `BACKEND_URL` pointing at the backend service

## Schema and startup policy

- Schema is Alembic-only. Do not use ad-hoc schema mutation scripts.
- Backend startup now enforces this order:
  1. `alembic upgrade head`
  2. schema verification against Alembic head revisions
  3. idempotent startup seeds
  4. start API server
- If `DATABASE_URL` is missing, backend startup fails fast.
- `/health` includes schema readiness and seed completeness signals.

## 5. Local production builds

To build images locally:

```bash
cd ithras

# Backend
docker build -t ithras-backend:local -f Dockerfile.backend .

# Frontend (BACKEND_URL set at deploy time)
docker build -t ithras-frontend:local -f Dockerfile.frontend .
```

## 6. Troubleshooting

### `Permission denied` on Artifact Registry

Check that the service account has `roles/artifactregistry.writer` and that the repository exists.

### Health check failures

Cloud Run uses `/health` by default. Ithras exposes `/health` on the backend; frontend is static and should serve `index.html`.

### Frontend cannot reach backend

- Confirm `BACKEND_URL` is set on the frontend Cloud Run service
- Ensure both services are in the same region and allow unauthenticated access if needed

### Database connection errors

**"could not translate host name db to address"**: You are using the Docker Compose default. Set `DATABASE_URL` in Cloud Run to your actual database connection string (Cloud SQL or external PostgreSQL). The hostname `db` only works locally with docker-compose.

- Verify `DATABASE_URL` is set and correct in Cloud Run (Variables & Secrets)
- If using Cloud SQL, configure a VPC connector or ensure Cloud Run can reach the instance
- Check Cloud SQL authorized networks if using public IP
- Ensure `DATABASE_URL` uses a host that resolves from Cloud Run (not `db`)
