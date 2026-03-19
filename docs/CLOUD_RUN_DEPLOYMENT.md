# Cloud Run + Cloud SQL Deployment Guide

Ithras runs as two separate Cloud Run services:

| Service | Description | Image |
|---|---|---|
| `ithras-backend` | FastAPI API + migrations | `Dockerfile.backend` |
| `ithras-frontend` | Nginx static files + API proxy | `Dockerfile.frontend` |

Both are deployed via `cloudbuild.yaml` at the repo root using Cloud Build.

---

## Prerequisites

| Tool | Purpose |
|---|---|
| `gcloud` CLI (authenticated) | Provisioning and deploying |
| Cloud Build API enabled | CI/CD |
| Artifact Registry API enabled | Container images |
| Cloud SQL Admin API enabled | Managed Postgres |
| Secret Manager API enabled | Credential storage |

---

## One-Time Infrastructure Setup

Run `deploy/setup.sh` once to provision all GCP resources. If `PROJECT_ID` is not exported, the script will fall back to your active `gcloud` project configuration. When `REGION` or `CLOUD_SQL_INSTANCE` are not exported and the script is running interactively, it will ask you to confirm or override the defaults before provisioning:

```bash
export PROJECT_ID=my-gcp-project  # optional if `gcloud config set project` is already set
export REGION=europe-west1
export DB_PASSWORD=$(openssl rand -hex 16)

bash deploy/setup.sh
```

This creates:
- Artifact Registry repository
- Cloud SQL Postgres 15 instance (defaults to `ithras-db`, but the script now prompts so you can choose the correct name)
- Database `placement_db` + user `ithras`
- Service account `ithras-backend-sa` with `cloudsql.client` + `secretmanager.secretAccessor` roles
- Cloud Build IAM bindings for both the legacy Cloud Build service account and the Compute Engine default service account (`cloudbuild.builds.builder`, `run.admin`, `iam.serviceAccountUser`, `artifactregistry.writer`)
- `ithras-database-url` secret in Secret Manager

---

## Cloud SQL Connection

Cloud Run connects to Cloud SQL via the **built-in Cloud SQL Auth Proxy sidecar** — no manual proxy required.

The `--add-cloudsql-instances` flag in `cloudbuild.yaml` attaches the Unix socket to the container at:

```
/cloudsql/PROJECT:REGION:INSTANCE/.s.PGSQL.5432
```

**DATABASE_URL format** (socket — recommended for Cloud Run):
```
postgresql://ithras:PASSWORD@/placement_db?host=/cloudsql/my-project:europe-west1:ithras-db
```

**DATABASE_URL format** (TCP — for testing or external access):
```
postgresql://ithras:PASSWORD@10.x.x.x:5432/placement_db
```

> The `entrypoint.prod.sh` detects which mode is in use and waits for the socket file / TCP port to be reachable before running migrations.

---

## Environment Variables

All sensitive values are passed to Cloud Run via `--set-env-vars` in `cloudbuild.yaml`.  
For production, consider switching to Secret Manager references (`--set-secrets`).

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (see above) |
| `JWT_SECRET` | Yes | HS256 signing key — `openssl rand -hex 32` |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `REDIS_URL` | No | Redis connection string (sessions / cache) |
| `DEMO_PASSWORD` | No | Password for seeded demo accounts |
| `LOG_FORMAT` | No | `json` (recommended on Cloud Run) or `text` |
| `DB_SETUP` | No | Set `TRUE` to run Alembic migrations on startup |
| `REQUIRE_DATABASE` | No | Set `true` to fail hard if DB is unreachable |
| `UPLOAD_DIR` | No | Path for uploaded files (default `/app/uploads`) |
| `GEMINI_MODEL` | No | Model name (default `gemini-2.0-flash`) |

---

## First Deployment

### Option A — Cloud Build submit (manual / CI-less)

```bash
gcloud builds submit . \
  --config=cloudbuild.yaml \
  --project=my-gcp-project \
  --substitutions=_CLOUD_SQL_INSTANCE=my-project:europe-west1:ithras-db,\
_DATABASE_URL="postgresql://ithras:PASSWORD@/placement_db?host=/cloudsql/my-project:europe-west1:ithras-db",\
_JWT_SECRET=$(openssl rand -hex 32),\
_GEMINI_API_KEY=AIza...,\
_SERVICE_ACCOUNT=ithras-backend-sa@my-project.iam.gserviceaccount.com
```

For manual `gcloud builds submit` runs, `cloudbuild.yaml` now enables Cloud Build's `automapSubstitutions`, which makes built-in substitutions like `BUILD_ID` available inside the shell steps. That allows the config to fall back to `BUILD_ID` when `COMMIT_SHA` is unavailable, so you do not need to pass a custom image-tag substitution just to avoid an empty tag.

> **Important:** In newer Google Cloud projects, manual `gcloud builds submit` runs often execute as the Compute Engine default service account (`PROJECT_NUMBER-compute@developer.gserviceaccount.com`) instead of the legacy Cloud Build account. If you see `storage.objects.get` or similar Cloud Storage permission errors during source upload/build startup, rerun `deploy/setup.sh` or grant the same Cloud Build IAM roles to whichever account `gcloud builds get-default-service-account` returns.

### Option B — Cloud Build trigger (recommended for CI/CD)

1. Go to Cloud Build → Triggers → Create Trigger
2. Connect your repository (GitHub / GitLab)
3. Set **configuration**: Cloud Build configuration file (`cloudbuild.yaml`)
4. Add **substitution variables** from `deploy/env.example`
5. Push to your main branch to trigger a deployment

---

## Schema Migrations

Migrations run automatically on deploy when `DB_SETUP=TRUE` is set.

The entrypoint (`entrypoint.prod.sh`) will:
1. Wait for the Cloud SQL socket / TCP port to be ready
2. Run `python -m core.setup.backend.run_setup` (Alembic `upgrade head` + seeds)
3. Start `uvicorn`

To run migrations manually (e.g. from a Cloud Shell with Cloud SQL Auth Proxy):

```bash
# Start proxy
cloud-sql-proxy --port 5432 my-project:europe-west1:ithras-db &

DATABASE_URL=postgresql://ithras:PASSWORD@localhost:5432/placement_db \
  DB_SETUP=TRUE \
  python -m core.setup.backend.run_setup
```

---

## Connection Pool Sizing

Cloud Run can run many instances simultaneously. Each instance maintains its own connection pool.

The database engine is configured to use a small pool when running on Cloud Run (`K_SERVICE` env is set):

| Environment | `pool_size` | `max_overflow` | Effective connections / instance |
|---|---|---|---|
| Cloud Run | 5 | 2 | 7 |
| docker-compose / local | 20 | 10 | 30 |

With `_MAX_INSTANCES=10`, the worst case is **70 simultaneous connections** to Cloud SQL.  
The default Cloud SQL `max_connections` for `db-g1-small` is 25 — **increase it**:

```bash
gcloud sql instances patch ithras-db \
  --database-flags=max_connections=200 \
  --project=my-gcp-project
```

---

## Updating an Existing Deployment

Every push to the connected branch triggers a full build-push-deploy cycle.  
Cloud Run performs a zero-downtime rolling update by default.

To deploy only the backend (skip frontend rebuild):

```bash
gcloud run deploy ithras-backend \
  --image REGION-docker.pkg.dev/PROJECT/REGISTRY/ithras-backend:latest \
  --region REGION
```

---

## Architecture Diagram

```
Browser
  │
  ▼
Cloud Run: ithras-frontend  (nginx)
  │  serves static JS / HTML
  │  proxies /api → ithras-backend
  ▼
Cloud Run: ithras-backend   (FastAPI / uvicorn)
  │  Cloud SQL Auth Proxy sidecar (unix socket)
  ▼
Cloud SQL: ithras-db        (Postgres 15)
```

---

## Troubleshooting

### Cloud Audit Log shows `CloudBuild.CreateBuild` with `status.code: 9`

`status.code: 9` is the canonical gRPC `FAILED_PRECONDITION` status. In practice, that means Cloud Build rejected the trigger request **before** the build really started, so the audit log entry by itself is not enough to identify the root cause. Google's Cloud Build troubleshooting guide calls out several common `FAILED_PRECONDITION` cases, including quota restrictions in a region, deleted or mismatched trigger branches (for example `Couldn't read commit`), repository connection issues, or other trigger configuration problems.

Start with the trigger execution details and the Cloud Build logs for the exact build IDs from the audit entry:

```bash
gcloud builds describe 7fe2c230-5341-4353-b9b2-c885e987eadd --project=my-gcp-project
gcloud builds describe ed3e1327-2466-4ba9-a83c-7bea9ced6091 --project=my-gcp-project
```

If those commands return little or no detail, inspect the trigger definitions that generated the failed requests:

```bash
gcloud builds triggers describe bb9bc841-f075-4fce-bd2f-8c4e4e4e96ce --project=my-gcp-project
gcloud builds triggers describe db64417f-94b6-4af0-a34f-9137964cc932 --project=my-gcp-project
```

For this repository specifically, also verify the following trigger inputs because `cloudbuild.yaml` expects them at runtime:

- `_CLOUD_SQL_INSTANCE`
- `_DATABASE_URL`
- `_JWT_SECRET`
- `_GEMINI_API_KEY`

If the trigger uses a non-default service account or a private worker pool, verify those resources still exist and that the trigger branch/tag filters still match a live ref. If the error text mentions regional quota restrictions, contact Google Cloud support for that region.

### `storage.objects.get` denied for `PROJECT_NUMBER-compute@developer.gserviceaccount.com`

Your project is using the **Compute Engine default service account** as the default Cloud Build service account. Grant that service account the same Cloud Build/deploy roles as the legacy Cloud Build account, or rerun `deploy/setup.sh` from this repository, which now configures both. You can verify the active default with:

```bash
gcloud builds get-default-service-account --project=my-gcp-project
```

### Backend won't start — "Cloud SQL socket not available"

The Cloud SQL Auth Proxy sidecar hasn't started yet, or `--add-cloudsql-instances` is missing.  
Check the Cloud Run service configuration: the instance connection name must match `_CLOUD_SQL_INSTANCE`.

### "DATABASE_URL uses host 'db' which does not resolve on Cloud Run"

The docker-compose `DATABASE_URL` was deployed by mistake. Set `_DATABASE_URL` to the Cloud SQL socket URL (see above).

### 502 / CORS errors from frontend

Check that `BACKEND_URL` in the frontend Cloud Run service points to the correct backend URL.  
Verify with: `gcloud run services describe ithras-frontend --region REGION --format "env_vars"`.

### Migrations fail on first deploy

On a brand-new database, `DB_SETUP=TRUE` must be set. After the first successful deploy, you can leave it enabled — Alembic is idempotent.
