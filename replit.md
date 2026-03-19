# Ithras - Enterprise Placement Intelligence Portal

## Project Overview
Ithras is a platform for managing student placement processes in educational institutions. It connects students (professionals), institutions, and organisations (companies), replacing manual scheduling with a modular digital portal.

## Architecture
- **Backend**: FastAPI (Python 3.12) running on port 8000 (internal)
- **Frontend**: React 18 via native ES modules (no bundler) served on port 5000
- **Database**: PostgreSQL (Replit-managed), accessed via SQLAlchemy + Alembic migrations
- **Cache/Queue**: Redis (optional, configured via `REDIS_URL`)

## Project Structure
```
/
├── admin/              # Admin backend routers and frontend dashboard
├── core/
│   ├── alembic/        # Database migrations
│   ├── app/
│   │   ├── backend/    # FastAPI app entry point (main.py)
│   │   └── frontend/   # React shell (index.html, src/App.js)
│   ├── auth/           # Authentication (JWT)
│   └── setup/          # Initial data seeding
├── products/           # Domain modules (feed, messaging, network, profiles)
├── shared/             # Shared UI components, services, database config
├── start.py            # Replit dev server launcher
├── frontend_server.py  # Starlette frontend + API proxy on port 5000
└── alembic.ini         # Alembic config pointing to core/alembic
```

## Development Servers
- `start.py` — Launches both servers:
  - Backend (uvicorn) on `localhost:8000`
  - Frontend (starlette static + proxy) on `0.0.0.0:5000`
- The frontend server proxies `/api/*` to the backend
- All JS modules are served directly from the workspace directory tree

## Key Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)
- `JWT_SECRET` — Secret for JWT token signing
- `UPLOAD_DIR` — Directory for user file uploads (default: `./uploads`)
- `REDIS_URL` — Redis connection string (optional)
- `GEMINI_API_KEY` — Google Gemini API key (optional, for AI features)

## Database
- Managed by Replit PostgreSQL
- Migrations in `core/alembic/versions/`
- Run migrations: `python -m alembic upgrade head` from project root

## Deployment
- Configured as autoscale deployment running `python start.py`
- Port 5000 serves the combined frontend + API proxy
