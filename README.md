# Ithras - Enterprise Placement Intelligence Portal

## Architecture Overview

Ithras follows a **modular product architecture** with:
- **core/**: Shared infrastructure (database, authentication, shared utilities, tutorials)
- **products/**: Domain product implementations (calendar, recruitment, profiles, feed, system-admin, etc.)
- **core/backend/**: Unified backend service that imports and serves product APIs via registry
- **core/frontend/**: Unified frontend shell that lazy-loads product UIs via registry

### Registry is source of truth

Use these files as the canonical module-boundary map:

- `core/backend/app/product_registry.yaml` (backend product key → router module)
- `core/frontend/src/productRegistry.js` (frontend product key → lazy entry module)

When product names differ in older docs or comments, trust the registry keys and paths in these two files.

| Product key | Backend router module (`product_registry.yaml`) | Frontend entry module (`productRegistry.js`) |
|---|---|---|
| `calendar-management` | `app.modules.scheduling.routers` | `/products/calendar-management/frontend/src/modules/scheduling/index.js` |
| `cv` | `app.modules.cv_builder.routers` | — |
| `cv-maker` | — | `/products/profiles/cv/frontend/src/modules/cv-maker/index.js` |
| `cv-templates-viewer` | — | `/products/profiles/cv/frontend/src/modules/cv-templates-viewer/index.js` |
| `cv-verification` | — | `/products/profiles/cv/frontend/src/modules/cv-verification/index.js` |
| `recruitment-university` | `app.modules.governance.routers` | `/products/recruitment-university/frontend/src/modules/governance/index.js` |
| `institution-management` | `app.modules.institution.routers` | `/products/profiles/institution/frontend/src/InstitutionAdminPortal.js` |
| `company-management` | `app.modules.company.routers` | `/products/profiles/company/frontend/src/index.js` |
| `candidates` | `app.modules.candidates.routers` | `/products/profiles/candidate/frontend/src/index.js` |
| `general-feed` | `app.modules.feed.routers` | `/products/general-feed/frontend/src/index.js` |
| `recruitment-lateral` | `app.modules.recruitment.routers` | `/products/recruitment-lateral/frontend/src/index.js` |
| `user-management` | `app.modules.user_management.routers` | — |
| `database` | `app.modules.database.routers` | — |
| `migrations` | `app.modules.migrations.routers` | — |
| `testing` | `app.modules.testing.routers` | — |
| `simulator` | `app.modules.simulator.routers` | — |
| `system-admin` | — | `/products/system-admin/core/frontend/src/index.js` |
| `profiles` | — | `/products/profiles/core/frontend/src/index.js` |
| `preparation` | — | `/products/preparation/frontend/src/index.js` |
| `entity-about` | — | `/core/frontend/src/modules/entity-about/index.js` |

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Ports 3000 (frontend) and 8000 (backend) available

### First Time Setup

1. **Start all services:**
   ```bash
   docker-compose up --build
   ```

   This starts:
   - Database (PostgreSQL) - shared by all products, data persists across restarts (stored in `postgres_data` volume)
   - Unified backend (port 8000) - serves all product APIs
   - Unified frontend (port 3000) - routes to all product UIs

2. **If you see database errors, try restarting without removing data first:**
   ```bash
   docker-compose down
   docker-compose up --build
   ```
   This preserves registered users and all data. Only if the issue persists and you need a **full reset** (⚠️ **deletes all data including user accounts**):
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

## Architecture

### Unified Services
- **Database**: PostgreSQL 15 (shared by all products)
- **Backend**: FastAPI (Python 3.11) - Unified API gateway serving all product endpoints (port 8000)
- **Frontend**: React 18 with ES Modules - Unified UI that routes to all products (port 3000)

### Product Modules
Each product contains:
- **Backend modules**: Product-specific API endpoints (imported by unified backend)
- **Frontend modules**: Product-specific UI components (imported by unified frontend)

### Port Allocation
All services are orchestrated via a single `docker-compose.yml`:
- **Database**: Internal (shared)
- **Backend**: Port 8000 (serves all product APIs)
- **Frontend**: Port 3000 (routes to all product UIs)

## Development

### Start All Services
```bash
docker-compose up --build
```

This starts the unified backend and frontend services, which serve all products through a single API gateway and UI router.

### Hot Reload
All services support hot-reload:
- Frontend: Volume-mounted source files served directly via nginx (ES modules)
- Backend: Uvicorn with --reload flag

## Module Structure

### Core Modules
- `core/backend/app/modules/shared/`: Database models, schemas, utilities
- `core/backend/app/modules/auth/`: Authentication
- `core/backend/app/modules/tutorials/`: Tutorials backend API
- `core/frontend/src/modules/shared/`: Common components, services, types
- `core/frontend/src/modules/auth/`: Login/Auth UI
- `core/frontend/src/modules/tutorials/`: Tutorials UI

### Unified Services
- `core/backend/app/main.py`: Unified backend entry point that imports all product routers
- `core/frontend/src/App.js`: Unified frontend entry point that routes to all product UIs

### Product Modules
Each product contains its own modules:
- `products/{product}/backend/app/modules/`: Product-specific backend modules (imported by unified backend)
- `products/{product}/frontend/src/modules/`: Product-specific frontend modules (imported by unified frontend)

## Import Strategy

### Backend (Python)
Products import core modules using sys.path manipulation:
```python
import sys
import os
_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)
from app.modules.shared import models, database, schemas
```

### Frontend (JavaScript - ES Modules)
Products import core modules using relative paths. All frontends use ES modules (no bundler):
```javascript
import { UserRole } from '../../../core/frontend/src/modules/shared/types.js';
import { Layout } from '../../../core/frontend/src/modules/shared/index.js';
```

Frontend builds use ES modules directly - no webpack or other bundler required. Modern browsers natively support ES modules.

## Database

- **Single shared PostgreSQL database** (in core docker-compose)
- All products connect to the same database
- Core manages database migrations
- Products can have product-specific tables but use core models for shared entities (User, Institution, Company)

## Testing

### Backend (pytest)
From the ithras directory, with Docker Postgres running:
```bash
cd ithras
pip install -r core/backend/requirements.txt
cd tests && python -m pytest test_backend/ -v
```

### Frontend (Vitest)
```bash
cd ithras/core/frontend
npm install && npm test
```

### E2E (Playwright)
```bash
cd ithras/tests/e2e
npm install && npx playwright install
npm test
```

## Troubleshooting

### Database Connection Errors
If products can't connect to the database:
1. Ensure core database is running: `docker-compose ps core-db`
2. Check network connectivity: Products use `core-db` hostname
3. Verify database credentials match in all docker-compose files

### Port Conflicts
If ports are already in use:
- Check what's using the port: `lsof -i :XXXX`
- Stop conflicting services
- Or modify ports in docker-compose.yml files

### Import Errors
If you see import errors:
- Verify core modules exist in `core/backend/app/modules/` and `core/frontend/src/modules/`
- Check relative paths in import statements
- Ensure sys.path manipulation is correct in Python files

## Environment Variables

Key variables (see docker-compose.yml files):
- `DATABASE_URL`: PostgreSQL connection string
- `API_URL`: Backend API URL (for frontends)
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Database credentials
- `GEMINI_API_KEY`: For CV Builder PDF import (AI analysis). Set in `ithras/.env`. If not set, PDF import uses a default template.

**Startup:** The frontend waits for the backend health check before starting, avoiding 502s. The backend runs migrations on first run and may take 20-30 seconds to become healthy.

## Modular Restructure (Vibe Coding)

The codebase is organized for efficient AI-assisted development:

- **Domain-split shared modules**: `core/backend/.../shared/models/` and `schemas/` are split by domain (core, placement, cv, calendar, governance)
- **Domain-split API**: `core/frontend/.../services/api/` has domain modules (core.js, cv.js, placement.js, etc.)
- **Product registry**: Backend uses `product_registry.yaml` for config-driven router loading
- **Lazy product loading**: Frontend lazy-loads product UIs via `productRegistry.js`
- **Product rules**: Each product has a `RULE.md` with entry points and dependencies
- **ARCHITECTURE.md**: High-level architecture and Cursor usage docs

For reduced context when working on one product, create `ithras/.cursorignore` and uncomment product paths to exclude (see ARCHITECTURE.md).

## Cloud Run Deployment (GitLab CI/CD)

Ithras can be deployed to Google Cloud Run via GitLab CI/CD. See [docs/CLOUD_RUN_DEPLOYMENT.md](docs/CLOUD_RUN_DEPLOYMENT.md) for setup instructions.

- **Production Dockerfiles**: `Dockerfile.backend`, `Dockerfile.frontend` (build from ithras root)
- **Pipeline**: `.gitlab-ci.yml` – builds images, pushes to Artifact Registry, deploys to Cloud Run
- **Required**: GCP project, Artifact Registry repo, service account key in GitLab variables

## Benefits of Modular Architecture

1. **Independence**: Each product can be developed, tested, and deployed independently
2. **Scalability**: Products can scale independently based on load
3. **Maintainability**: Clear separation of concerns
4. **Team Collaboration**: Different teams can work on different products
5. **Reusability**: Core modules shared across all products
6. **Modularity**: Easy to add new products or remove existing ones
