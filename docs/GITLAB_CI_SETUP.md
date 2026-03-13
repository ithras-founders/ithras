# Ithras CI/CD Setup Guide - GitLab to Cloud Run (Main Branch)

This guide walks you through completing the CI/CD setup for deploying Ithras to Google Cloud Run.

## Prerequisites

- Google Cloud Project with billing enabled
- GitLab repository with admin access
- `gcloud` CLI installed locally (for initial setup)
- Service account with appropriate permissions

## Stage 1: GCP Setup (One-time)

### 1.1 Enable Required APIs

```bash
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sql.googleapis.com \
  container.googleapis.com
```

### 1.2 Create Artifact Registry Repository

```bash
gcloud artifacts repositories create ithras \
  --repository-format=docker \
  --location=us-central1 \
  --description="Ithras images for Cloud Run"
```

### 1.3 Create Service Account for CI/CD

```bash
# Create service account
gcloud iam service-accounts create gitlab-deploy \
  --display-name="GitLab CI/CD Deploy Account"

# Get the email
SERVICE_ACCOUNT_EMAIL=$(gcloud iam service-accounts list --filter="displayName:gitlab-deploy" --format='value(email)')
echo $SERVICE_ACCOUNT_EMAIL

# Grant necessary roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:$SERVICE_ACCOUNT_EMAIL \
  --role=roles/run.admin

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:$SERVICE_ACCOUNT_EMAIL \
  --role=roles/artifactregistry.writer

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:$SERVICE_ACCOUNT_EMAIL \
  --role=roles/artifactregistry.reader

# Create and download JSON key
gcloud iam service-accounts keys create /tmp/gitlab-key.json \
  --iam-account=$SERVICE_ACCOUNT_EMAIL

echo "Service account key created at /tmp/gitlab-key.json"
```

### 1.4 Set Up Cloud SQL Database (if not exists)

```bash
# Create PostgreSQL instance
gcloud sql instances create ithras-db \
  --database-version=POSTGRES_15 \
  --region=us-central1 \
  --tier=db-f1-micro \
  --no-backup

# Create database
gcloud sql databases create ithras \
  --instance=ithras-db

# Create user and get connection string
gcloud sql users create ithras \
  --instance=ithras-db \
  --password

# Get connection info
gcloud sql instances describe ithras-db --format='value(connectionName)'
# Format: PROJECT:REGION:INSTANCE
```

## Stage 2: GitLab CI/CD Variables Setup

### 2.1 Configure GitLab CI/CD Variables

1. Go to your GitLab repository
2. Navigate to **Settings > CI/CD > Variables**
3. Click **Add Variable** and add the following:

| Variable Name | Value | Protected | Masked |
|---|---|---|---|
| `GCP_PROJECT_ID` | Your GCP project ID | ✓ | ✓ |
| `GCP_REGION` | `us-central1` (or your region) | ✓ | ✓ |
| `GCP_SERVICE_ACCOUNT_KEY` | Contents of `/tmp/gitlab-key.json` | ✓ | ✓ |
| `GAR_REPOSITORY` | `ithras` | - | - |
| `BACKEND_SERVICE_NAME` | `ithras-backend` | - | - |
| `FRONTEND_SERVICE_NAME` | `ithras-frontend` | - | - |

**Important**: Make sure `GCP_SERVICE_ACCOUNT_KEY` is marked as both **Protected** and **Masked** for security.

### 2.2 Verify Variables

Go to **Settings > CI/CD > Variables** and confirm all 6 variables are listed (secrets shown as ●●●●●).

## Stage 3: Cloud Run Service Setup - DATABASE_URL Configuration

**CRITICAL**: The backend service REQUIRES `DATABASE_URL` to be set in its Cloud Run environment. Without it, startup fails fast.

### 3.1 Set Backend Environment Variables (BEFORE First Deployment)

Run this command to set the backend environment variables:

```bash
# Replace YOUR_CONNECTION_STRING with your Cloud SQL connection
gcloud run services create ithras-backend \
  --image=gcr.io/gke-release/gke-metrics-agent:1.0.0 \
  --region=europe-west1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --set-env-vars="DATABASE_URL=YOUR_CONNECTION_STRING,REDIS_URL=,GEMINI_API_KEY=,UPLOAD_DIR=/app/uploads"
```

**Connection String Formats**:

**Option 1: Direct PostgreSQL connection (recommended for development)**
```
postgresql://username:password@cloud_sql_public_ip:5432/ithras
```

**Option 2: Cloud SQL Unix Socket (recommended for production)**
```
postgresql://username:password@/ithras?host=/cloudsql/YOUR_PROJECT:europe-west1:ithras-db
```

### 3.2 Alternative: Set Variables After Service Creation (if already deployed)

If your backend service already exists without variables, update it:

```bash
gcloud run services update ithras-backend \
  --region=europe-west1 \
  --set-env-vars="DATABASE_URL=YOUR_CONNECTION_STRING,REDIS_URL=,GEMINI_API_KEY=,UPLOAD_DIR=/app/uploads"
```

### 3.3 Verify Environment Variables

```bash
gcloud run services describe ithras-backend \
  --region=europe-west1 \
  --format='value(spec.template.spec.containers[0].env[*].name)'
```

Should output: `UPLOAD_DIR DATABASE_URL GEMINI_API_KEY REDIS_URL`

## Stage 4: Trigger Pipeline

### 4.1 ⚠️ PREREQUISITE: Set DATABASE_URL First

**IMPORTANT**: Before pushing to `main` and triggering the pipeline, you MUST set `DATABASE_URL` in the backend Cloud Run service. Otherwise, the backend container will fail to start.

If you haven't done this yet, run:

```bash
gcloud run services update ithras-backend \
  --region=europe-west1 \
  --set-env-vars="DATABASE_URL=postgresql://username:password@cloud_sql_public_ip:5432/ithras"
```

Or create the service with environment variables if it doesn't exist:

```bash
gcloud run services create ithras-backend \
  --image=gcr.io/gke-release/gke-metrics-agent:1.0.0 \
  --region=europe-west1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --set-env-vars="DATABASE_URL=postgresql://username:password@cloud_sql_public_ip:5432/ithras,UPLOAD_DIR=/app/uploads"
```

### 4.2 Configure Git and Push to `main` Branch

```bash
# Ensure you're working on the main branch
git checkout main

# Push to main branch to trigger the pipeline
git push origin main
```

This will trigger the GitLab CI/CD pipeline to build and deploy both backend and frontend services.

### 4.3 Monitor Pipeline Execution

1. Go to your GitLab repository
2. Click **Build > Pipelines**
3. Click on the latest pipeline to view execution
4. Pipeline stages:
   - **build-backend** - Build and push backend image
   - **build-frontend** - Build and push frontend image
   - **deploy-backend** - Deploy backend to Cloud Run (updates with latest image)
   - **deploy-frontend** - Deploy frontend to Cloud Run (waits for backend URL)

Expected timeline: **5-10 minutes** depending on image sizes and build cache.

### 4.4 Monitor Cloud Run Services

```bash
# Watch backend service  (note: region is europe-west1)
gcloud run services describe ithras-backend \
  --region=europe-west1 \
  --format='table(status.url,status.conditions[0].status)'

# Watch frontend service
gcloud run services describe ithras-frontend \
  --region=europe-west1 \
  --format='table(status.url,status.conditions[0].status)'
```

Or view in Cloud Console: **Cloud Run > Services**

## Stage 5: Verification

### 5.1 Verify Frontend Deployment

1. Open frontend service URL in browser (from Cloud Console)
2. Expected: Ithras UI with navigation menu loads
3. NOT expected: `{"message":"Ithras Placement API",...}` (this means it's routing to backend)

### 5.2 Verify API Connectivity

1. Open DevTools (F12)
2. Go to **Network** tab
3. Navigate to any CV builder or placement feature
4. Check that `/api/*` requests go to backend service and return 2xx/3xx status
5. Not 502/503 errors

### 5.3 Verify Backend Database Connectivity

1. Check Cloud Run backend logs:
```bash
gcloud run logs read ithras-backend --region=us-central1 --limit=50
```
2. Look for "Running migrations..." messages (should see migration outputs)
3. No `Error connecting to database` messages

### 5.4 Test End-to-End

1. Log in to the frontend
2. Create/edit a CV or placement record
3. Verify data persists in database

## Troubleshooting

### Backend Container Fails to Start

**Error**: "The user-provided container failed to start and listen on the port defined by the PORT=8080 environment variable"

**Cause**: `DATABASE_URL` environment variable not set in Cloud Run service

**Solution**:
1. The backend now fails startup if `DATABASE_URL` is not set
2. If it's still failing, check logs:
```bash
gcloud run logs read ithras-backend --region=europe-west1 --limit=100
```
3. Set `DATABASE_URL` in the backend Cloud Run service:
```bash
gcloud run services update ithras-backend \
  --region=europe-west1 \
  --set-env-vars="DATABASE_URL=postgresql://username:password@cloud_sql_public_ip:5432/ithras"
```
4. Trigger a new deployment by pushing to main again

### Backend Starts But Migrations Don't Run

**Symptom**: Backend fails startup because schema verification is not at Alembic head

**Cause**: `DATABASE_URL` was not set, so migrations were skipped on startup

**Solution**: 
1. Set `DATABASE_URL` in Cloud Run:
```bash
gcloud run services update ithras-backend \
  --region=europe-west1 \
  --set-env-vars="DATABASE_URL=postgresql://username:password@cloud_sql_public_ip:5432/ithras"
```
2. Restart the service:
```bash
gcloud run services update ithras-backend --region=europe-west1
```
3. Check logs to confirm migrations ran:
```bash
gcloud run logs read ithras-backend --region=europe-west1 --limit=50 | grep "Running\|Migration"
```

### Pipeline Fails at `build-backend` or `build-frontend`

**Error**: `unauthorized: authentication required`

**Solution**:
```bash
# Verify service account has Artifact Registry Writer role
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --format='table(bindings.role)' \
  --filter="bindings.members:gitlab-deploy"
```

### Pipeline Fails at `deploy-frontend`

**Error**: `BACKEND_URL is empty`

**Cause**: Backend service didn't deploy successfully

**Solution**: Check backend deployment logs:
```bash
gcloud run logs read ithras-backend --region=europe-west1 --limit=100
```

### Frontend Shows API Response Instead of UI

**Error**: Page displays `{"message":"Ithras Placement API",...}`

**Causes**:
1. Frontend environment variables not set correctly
2. Nginx configuration template not substituted properly

**Solution**:
```bash
# Check frontend environment variables
gcloud run services describe ithras-frontend \
  --region=us-central1 \
  --format='value(spec.template.spec.containers[0].env)'

# Check logs for envsubst errors
gcloud run logs read ithras-frontend --region=us-central1 --limit=50
```

### Database Migrations Fail

**Error**: In backend logs: `Error running migrations`

**Solution**:
1. Verify `DATABASE_URL` is correctly set:
```bash
gcloud run services describe ithras-backend \
  --region=us-central1 \
  --format='value(spec.template.spec.containers[0].env)'
```
2. Verify database exists:
```bash
gcloud sql databases list --instance=ithras-db
```
3. Verify user credentials:
```bash
gcloud sql users list --instance=ithras-db
```

## Next Steps

### Scale Up to Multiple Environments (Later)

Once dev is working, replicate the setup for staging and production:

1. Add stages to `.gitlab-ci.yml`:
   - `develop` branch → staging
   - `release/*` branches → production

2. Create separate Cloud SQL instances for staging/prod

3. Use separate service accounts or workload identity

### Enable Cloud SQL Connector (Recommended for Production)

Replace direct IP connections with Cloud SQL Connector for better security:

```bash
gcloud run services update ithras-backend \
  --region us-central1 \
  --set-cloudsql-instances=YOUR_PROJECT:us-central1:ithras-db
```

Update `DATABASE_URL` to use Unix socket:
```
postgresql://user:pass@/ithras?host=/cloudsql/YOUR_PROJECT:us-central1:ithras-db
```

### Add Monitoring and Alerts

Set up Cloud Monitoring to alert on:
- High error rates (500+)
- High latency (>2s)
- OOM crashes
- Database connection failures

## Support

For issues:
1. Check GitLab pipeline logs: **Pipelines > Job logs**
2. Check Cloud Run logs: `gcloud run logs read SERVICE_NAME --region REGION`
3. Review [docs/CLOUD_RUN_DEPLOYMENT.md](../docs/CLOUD_RUN_DEPLOYMENT.md) for detailed architecture

---

**Last Updated**: 2026-02-25
**Git Branch**: main
**Region**: us-central1
