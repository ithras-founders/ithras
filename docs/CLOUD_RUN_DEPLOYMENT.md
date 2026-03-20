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
| `DB_SETUP` | No | Set `TRUE` to run Alembic migrations on startup (Cloud Build substitution `_DB_SETUP`, default `TRUE`) |
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

Use **one** trigger that runs the **root** [`cloudbuild.yaml`](../cloudbuild.yaml) and passes the **same substitutions** you use for a successful `gcloud builds submit`. Nothing else should deploy to Cloud Run for this app.

#### 1. Connect GitHub to Google Cloud

1. In Google Cloud Console: **Cloud Build** → **Triggers** → **Connect repository** (or **Repositories** / **2nd gen** / **Developer Connect**, depending on console version).
2. Choose **GitHub** (or GitHub Enterprise), complete OAuth / app install, and select the **organization or user** and **repository** that contains Ithras.
3. Finish so Cloud Build can clone that repo on each push.

#### 2. Create the deploy trigger

| Setting | Recommended value |
|--------|-------------------|
| **Name** | e.g. `ithras-deploy-main` |
| **Event** | Push to a branch |
| **Source** | Your connected GitHub repo |
| **Branch** | Regex for your default branch, e.g. `^main$` or `^master$` (must match how you actually push) |
| **Configuration** | **Cloud Build configuration file (yaml or yml)** |
| **Location** | **Repository** |
| **Cloud Build configuration file location** | `cloudbuild.yaml` |

Important:

- The path must be **`cloudbuild.yaml` at the repository root**. The build uses `docker build … .` with context **`.`** (repo root); a monorepo subfolder path will break `Dockerfile.backend` / `Dockerfile.frontend` unless you change the build.
- **Do not** use “Dockerfile” autodetection as the only step for this project — you need the full pipeline in `cloudbuild.yaml`.

#### 3. Substitution variables (match your working `gcloud builds submit`)

Open [`deploy/env.example`](../deploy/env.example) and copy each line into the trigger’s **Substitution variables** (Console) or `--substitutions` (CLI).

Minimum set (same semantics as a working manual submit):

| Substitution | Maps to your CLI example | Notes |
|--------------|---------------------------|--------|
| `_CLOUD_SQL_INSTANCE` | `ithrad-dev:asia-south1:ithras-dev` | `PROJECT:REGION:INSTANCE` |
| `_DATABASE_URL` | Full `postgresql://…?host=/cloudsql/…` URL | No trailing spaces; quote in CLI if needed |
| `_JWT_SECRET` | Hex secret | Prefer **Secret Manager** for production (see below) |
| `_GEMINI_API_KEY` | API key | Prefer **Secret Manager** for production |
| `_SERVICE_ACCOUNT` | `ithras-backend-sa@ithrad-dev.iam.gserviceaccount.com` | Backend + frontend deploy use this when set |
| `_REGION` | `asia-south1` | Cloud Run + Artifact Registry region |

Optional (defaults exist in `cloudbuild.yaml` but you can override): `_REDIS_URL`, `_DEMO_PASSWORD`, `_BACKEND_URL`, `_MIN_INSTANCES`, `_MAX_INSTANCES`, `_BACKEND_SERVICE`, `_FRONTEND_SERVICE`, `_REGISTRY`, `_DB_SETUP`.

**Comma in substitutions:** Cloud Build uses commas to separate substitution pairs. If a value itself contains a comma, use the [documented escaping](https://cloud.google.com/build/docs/configuring-builds/substitute-variable-values) or store the value in Secret Manager.

#### 4. Build service account and IAM

The build runs as your project’s **Cloud Build service account** (often `PROJECT_NUMBER-compute@developer.gserviceaccount.com` in newer projects). It must be able to:

- Build and push images (Artifact Registry)
- Deploy Cloud Run (`run.services.update`, etc.)
- Act as the runtime service account when deploying (`iam.serviceAccounts.actAs`) if you set `_SERVICE_ACCOUNT`

If manual `gcloud builds submit` works but the trigger fails with permission errors, align the trigger’s **service account** with the account that succeeded, or rerun [`deploy/setup.sh`](../deploy/setup.sh) so both legacy and Compute default build accounts get the needed roles.

#### 5. Do not add a second “Deploy to Cloud Run” on this trigger

`cloudbuild.yaml` already runs **`gcloud run deploy`** for **both** `ithras-backend` and `ithras-frontend` inside the build steps.

- **Turn off** any extra **“Deploy to Cloud Run”** (or similar) action on the same trigger that deploys a **single** container image from the build. Those UIs often attach **one** image to **one** service; if that image is the **backend** artifact but the target service is **ithras-frontend**, the frontend service will run **Uvicorn** and errors like `ModuleNotFoundError: No module named 'shared'` (wrong image on the wrong service).

- If you previously enabled that integration, **disable** it and rely only on the `deploy-backend` / `deploy-frontend` steps in `cloudbuild.yaml`.

- This repo intentionally **does not** use a top-level `images:` block in `cloudbuild.yaml`, so Cloud Build does not advertise two “primary” artifacts that a naive auto-deploy might confuse.

#### 6. Optional: create the trigger with `gcloud`

After the repo is connected, you can create a trigger from the CLI (adjust names, branch, and connection resource to match your project):

```bash
# List GitHub / Developer Connect connections and repos to get connection/repo resource names
gcloud builds connections list --region=global --project=ithrad-dev
gcloud builds repositories list --connection=YOUR_CONNECTION --region=global --project=ithrad-dev

gcloud builds triggers create github \
  --project=ithrad-dev \
  --name=ithras-deploy-main \
  --repository=projects/ithrad-dev/locations/global/connections/CONNECTION_NAME/repositories/REPO_NAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --substitutions=_REGION=asia-south1,_CLOUD_SQL_INSTANCE=ithrad-dev:asia-south1:ithras-dev,_DATABASE_URL="postgresql://ithras:PASSWORD@/placement_db?host=/cloudsql/ithrad-dev:asia-south1:ithras-dev",_JWT_SECRET=YOUR_JWT,_GEMINI_API_KEY=YOUR_KEY,_SERVICE_ACCOUNT=ithras-backend-sa@ithrad-dev.iam.gserviceaccount.com
```

Resource names for `--repository` differ between 1st/2nd gen GitHub connections; use the values from `gcloud builds repositories list` output.

#### 7. Production secrets (recommended)

Storing `_JWT_SECRET`, `_GEMINI_API_KEY`, and DB password inside the trigger UI works but exposes them to anyone who can edit triggers. Prefer:

- Storing values in **Secret Manager**
- Using Cloud Build **available secrets** (`availableSecrets` + `secretEnv`) in `cloudbuild.yaml`, or
- Using **`--set-secrets`** on `gcloud run deploy` for runtime only

That requires small pipeline changes beyond plain `_SUBSTITUTION` env passthrough; plan a follow-up if you need it.

#### 8. Verify after the first triggered build

1. **Cloud Build** → **History** → open the build → confirm all steps green (`build-backend`, `build-frontend`, `deploy-backend`, `deploy-frontend`).
2. **Cloud Run** → `ithras-backend` and `ithras-frontend` → latest revision should show images ending in `…/ithras-backend@sha256:…` and `…/ithras-frontend@sha256:…` (digest-pinned deploys).
3. Open the frontend URL; static `/shared/...` module requests should return **200** (see Dockerfile.frontend `COPY shared/`).

---

#### Frontend revision runs Uvicorn / `ModuleNotFoundError: No module named 'shared'`

That means **ithras-frontend** is running the **backend** container. Common causes:

1. **Trigger “Deploy to Cloud Run”** still deploys the **backend** image to **ithras-frontend** after this pipeline runs — **disable** that integration (see above). Your build logs may show a **different** `gcb-trigger-id` for the bad revision than for the successful root `cloudbuild.yaml` run.
2. **Docker cache-from poisoning**: If `ithras-frontend:latest` in Artifact Registry was ever the backend image, `docker build --cache-from …/ithras-frontend:latest` reused backend layers. The pipeline **no longer** uses remote cache for the frontend build and runs a **sanity check** (must have `nginx`, must not have `/app/main.py` or `uvicorn`).
3. **One-time cleanup** (optional): In Artifact Registry, delete old `ithras-frontend` digests/tags, then rerun the build.

The `deploy-backend` / `deploy-frontend` steps resolve each image to a **digest** in Artifact Registry (`image@sha256:…`) before `gcloud run deploy`, and refuse to deploy the frontend if the image path matches the backend repository name. That guarantees **this pipeline** never pushes the wrong artifact reference—but a **second** auto-deploy can still run afterward and replace the revision; remove that trigger or restrict it to a single correct image.

If the build step **fails** with “this is the backend image”, the Dockerfile or build context is wrong; if the step **passes** but Cloud Run still shows Uvicorn, a **second** deploy is overwriting the service — fix the trigger.

---

## Schema Migrations

Migrations run automatically on deploy when `DB_SETUP=TRUE` is set (or when the Cloud Build substitution `_DB_SETUP` is `TRUE`, which is the default in `cloudbuild.yaml`).

The entrypoint (`entrypoint.prod.sh`) will:
1. Wait for the Cloud SQL socket / TCP port to be ready
2. Run `python -m core.setup.backend.run_setup` (Alembic `upgrade head` + seeds)
3. Start `uvicorn`

**Startup probe vs migrations:** Until step 3 completes, **nothing listens on port 8080**. Cloud Run’s TCP startup probe must allow **many** failures over several minutes — not `failureThreshold: 1`, which fails the revision on the first refused connection while migrations still run. This repo’s `deploy-backend` step sets:

- `--startup-probe=initialDelaySeconds=10,timeoutSeconds=5,periodSeconds=10,failureThreshold=24,tcpSocket.port=8080` (~4 minutes of probe retries after the initial delay)
- `--no-cpu-throttling` so the container keeps full CPU during socket wait and Alembic (default throttling can slow startup before the first HTTP request)

After the database is fully migrated, you can set trigger substitution **`_DB_SETUP=FALSE`** to skip schema sync on every cold start (faster boots; run migrations via CI or manual job when schema changes).

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

### Container failed to start and listen on PORT=8080

Cloud Run only waits a few minutes for the process to bind to `0.0.0.0:$PORT`. Common causes:

1. **Startup probe too strict (revisions from manual `gcloud` or old deploys)** — If the revision spec shows `failureThreshold: 1` on the TCP startup probe, a single failure while migrations run will mark the revision unhealthy. Redeploy using this repo’s `cloudbuild.yaml` (or add the same `--startup-probe=...` and `--no-cpu-throttling` flags to your manual deploy). See **Schema Migrations** above.
2. **Cloud SQL socket not ready** — The entrypoint waits up to **180s** for `/cloudsql/INSTANCE/.s.PGSQL.5432`. Ensure `_CLOUD_SQL_INSTANCE` matches your instance connection name exactly and the Cloud Run service account has **Cloud SQL Client**.
3. **Migrations too slow or failing** — With `DB_SETUP=TRUE`, Alembic runs before Uvicorn. Check **application** logs (stdout/stderr from your container), not only `run.googleapis.com/varlog/system`:
   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="ithras-backend"' \
     --project=YOUR_PROJECT_ID --limit=50 --format=json
   ```
   Filter in Logs Explorer for text like `Schema sync`, `ERROR`, `Traceback`, or `Starting Uvicorn Server`. Or: **Cloud Console → Cloud Run → ithras-backend → Logs**.
4. **Test without migrations** — Deploy once with `_DB_SETUP=FALSE` on the trigger (or `DB_SETUP=FALSE` via manual `gcloud run deploy`). If the service becomes healthy, fix DB URL / permissions / migrations.
5. **IAM warning on deploy** — If public access is blocked by org policy, run:
   ```bash
   gcloud run services add-iam-policy-binding ithras-backend \
     --region=REGION --member=allUsers --role=roles/run.invoker --project=PROJECT_ID
   ```
   (Or use a domain-restricted identity.) A failed IAM binding does not always prevent the revision from starting; check logs for the real error.

`cloudbuild.yaml` sets **`--cpu-boost`**, **`--no-cpu-throttling`**, **`--memory 1Gi`**, **`--cpu 1`**, and a **tolerant TCP startup probe** on the backend to reduce startup failures during migrations.

### Migrations fail on first deploy

On a brand-new database, `DB_SETUP=TRUE` must be set. After the first successful deploy, you can leave it enabled — Alembic is idempotent.
