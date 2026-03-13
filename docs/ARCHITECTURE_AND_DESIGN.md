# Ithras / Athena – Architecture & Design Document

> Technical architecture, design principles, implementation patterns, and CSS/design language.

---

## 1. System Overview

Ithras (Athena) is an enterprise placement intelligence platform. It uses a **unified backend and frontend** that serve multiple independent products from a single deployment.

---

## 2. High-Level Architecture

### 2.1 Monorepo Layout

```
ithras/
├── core/                    # Shared infrastructure
│   ├── backend/             # FastAPI app, shared models, schemas, auth, setup
│   └── frontend/            # Shell, Layout, shared UI, API services, routing
├── products/                # Independent product modules
│   ├── calendar-management/
│   ├── general-feed/
│   ├── recruitment-university/
│   ├── recruitment-lateral/
│   ├── profiles/            # institution, company, candidate, cv
│   ├── preparation/
│   └── system-admin/        # user-management, database, migrations, testing, simulator
└── docker-compose.yml      # Single DB, backend, frontend
```

### 2.2 Data Flow

- **Database:** PostgreSQL 15 (shared across all products)
- **Backend:** Single FastAPI app (port 8000) that imports and mounts routers from core + products
- **Frontend:** React 18 (ES modules, no bundler) served via Nginx (port 3000); lazy-loads product UIs
- **Redis:** Optional cache

---

## 3. Design Principles

### 3.1 Modular Product Architecture

- **Core:** Single source for models, schemas, auth, setup. Core does not depend on products.
- **Products:** No product-to-product imports. Products depend on core only.
- **Config-driven loading:** Backend uses `product_registry.yaml`; frontend uses `productRegistry.js` for lazy imports.
- **Route resolution:** `routeConfig.js` maps (view, role flags) → product. First match wins.

### 3.2 Separation of Concerns

| Layer | Backend | Frontend |
|-------|---------|----------|
| Entry | `main.py` | `App.js` |
| Core routers/modules | `core/backend/app/modules/` | `core/frontend/src/modules/` |
| Product modules | `products/{x}/backend/app/modules/` | `products/{x}/frontend/src/` |
| Shared data | `models/`, `schemas/`, `database/` | `types.js`, `services/api/` |

### 3.3 Dependency Direction

- Core provides models, schemas, auth, cycles, notifications, analytics, setup.
- Products add to `sys.path` and import `from app.modules.shared import models, database, schemas`.
- Frontend uses absolute paths: `/core/frontend/...`, `/products/{product}/...`.

---

## 4. Backend Architecture

### 4.1 Router Loading

- `main.py` reads `product_registry.yaml`.
- For each product, `import_product_modules()` dynamically loads router modules from product backends.
- Routers are mounted on the FastAPI app.
- Product backends are listed in `product_backends`; paths resolve differently for Docker vs local.

### 4.2 Product Registry (`product_registry.yaml`)

```yaml
products:
  calendar-management:
    - routers: app.modules.scheduling.routers
      modules: [calendar_slots, timetable_blocks, availability]
  cv:
    - routers: app.modules.cv_builder.routers
      modules: [cv_templates, cvs]
  recruitment-university:
    - routers: app.modules.governance.routers
      modules: [policies, workflows, workflow_approvals, ...]
  recruitment-lateral:
    - routers: app.modules.recruitment.routers
      modules: [ai_shortlist, schedule, job_profiles, discovery, outreach]
  # ... institution-management, company-management, candidates, general-feed
  # system-admin: user-management, database, migrations, testing, simulator
```

### 4.3 Shared Models (Domain-Split)

Models live in `core/backend/app/modules/shared/models/`:

| Module | Entities |
|--------|----------|
| core | Institution, Program, Batch, Company, BusinessUnit, User, IndividualInstitutionLink, IndividualOrganizationLink, AuditLog |
| placement | JobPosting, Shortlist, Cycle, HistoricalHire, Workflow*, Application, Offer |
| cv | CV, CVVersion |
| calendar | CalendarSlot, TimetableBlock, SlotBooking, StudentSlotAvailability |
| governance | Policy, PolicyProposal, WorkflowApproval, ApplicationRequest, Notification, JDSubmission |
| analytics | AnalyticsReport, AnalyticsDashboard, AnalyticsSchedule |
| rbac | Role, Permission, UserRoleAssignment, role_permissions |

### 4.4 Migration Strategy

- Alembic under `core/backend/alembic/`.
- Migrations run at container startup via `entrypoint.sh`.
- All products share one schema; core owns migrations.

---

## 5. Individual-Institution-Organization Model

### 5.1 Rationale

Replace direct `User.role`, `User.institution_id`, `User.company_id` with time-bound links so a user can have multiple institutions/organizations with different roles and validity periods.

### 5.2 Tables

**`individual_institution_links`** (user ↔ institution)
- `user_id`, `institution_id` (nullable for "general" users), `program_id` (degree), `role_id`
- `start_date`, `end_date` (null = ongoing)
- Alumni = `end_date IS NOT NULL AND end_date < now()`

**`individual_organization_links`** (user ↔ company)
- `user_id`, `company_id`, `business_unit_id`, `role_id`
- `start_date`, `end_date` (same semantics)

### 5.3 Design Decisions

1. **Use existing Program as degree:** `program_id` on `IndividualInstitutionLink` represents degree; no separate degree table.
2. **Replace UserRoleAssignment:** Auth prefers links; URA fallback when links tables don't exist (pre-migration 028).
3. **No `batch_id` on links:** Removed from link model.

### 5.4 Helpers (`links.py`)

- `is_alumni(link)` – true when `end_date < now`
- `is_link_active(link)` – true when `end_date` is null or `>= now`
- `get_active_institution_links(db, user_id)`
- `get_active_organization_links(db, user_id)`

---

## 6. Authentication & Authorization

### 6.1 Auth Flow

- Email/password login → JWT or session token.
- `/auth/login` returns `user`, `profiles`, `active_profile`.
- Profiles come from links (or `UserRoleAssignment` when pre-migration 028).
- `switch_profile` updates cached `user.role`, `user.institution_id`, `user.company_id` from selected link.

### 6.2 RBAC

- **Role:** e.g. CANDIDATE, RECRUITER, PROFESSIONAL, SYSTEM_ADMIN, PLACEMENT_TEAM, INSTITUTION_ADMIN.
- **Permission:** e.g. `placement.cycles.view`, `cv.templates.create`, `system.admin`.
- **Role → Permission:** via `role_permissions`.
- **User → Role:** via links or URA.

### 6.3 Auth Dependencies

- `get_current_user` – from Bearer token or `x-auth-token`.
- `require_permission(code)` – checks permission via links/URA.
- `require_role(*roles)` – checks role via links/URA.
- `get_institution_scope()` – `user.institution_id` for scoping (None for system admins).

### 6.4 Pre-Migration Fallback

- If `individual_institution_links` does not exist, auth and setup fall back to `UserRoleAssignment`.
- `_links_table_exists(db)` uses `information_schema` (Postgres) or `sqlite_master` (SQLite).

---

## 7. Frontend Architecture

### 7.1 Routing

- View-based: `view` (e.g. `dashboard`, `workflows`, `hr-discovery`) drives UI.
- `resolveProduct(view, roleFlags)` from `routeConfig.js` picks product.
- `PRODUCT_ROUTES`: entries have `views`, `prefixes`, `flags` (e.g. `isRecruiter`, `isCandidate`), `product`.

### 7.2 Lazy Loading

- `productRegistry.js`: product key → `() => import(...)`.
- Products load on demand when route matches.

### 7.3 Mode Switcher (Context Switching)

- `modeConfig.js`: defines modes and views (e.g. recruiter: `hr-outreach`, `hr-job-profiles`, `hr-discovery`).
- `resolveNavContext(activeView, pathToView, user, activeProfile)` – single source for nav and mode.
- Layout and ModeSwitcher use `resolveNavContext`.

### 7.4 Permissions

- `permissions.js`: `PermissionCode`, `hasPermission()`, `deriveRoleFlags()`.
- `deriveRoleFlags(profile)` → `isCandidate`, `isRecruiter`, `isProfessional`, `isSystemAdmin`, etc. for routing.

### 7.5 Tech Stack (Frontend)

- React 18, ES modules, no Webpack.
- `htm` for tagged-template JSX.
- Nginx serves static files, proxies API to backend.

---

## 8. Setup & Seeding

### 8.1 Lifecycle

1. Container start → Alembic migrations.
2. Setup engine runs seed steps in background thread.
3. `/setup/status` returns progress.
4. Frontend shows SetupScreen until setup complete.

### 8.2 Seed Steps (Registry)

1. Reset users to founders only.
2. Seed institutions, programs, companies.
3. Seed demo users.
4. Sync demo passwords.
5. Seed demo profiles (links or URA depending on migration state).

### 8.3 Idempotency

- Each step has `check()` and `apply()`.
- If `check()` returns true, step is skipped.

---

## 9. Observability & Error Handling

### 9.1 Logging

- `LOG_FORMAT=json` for production JSON logs (Cloud Logging).
- Health check logs filtered out.
- Request ID in logs when available.

### 9.2 Error Responses

- Global handlers for `RequestValidationError`, `HTTPException`, generic `Exception`.
- Sanitized messages; no stack traces in responses.
- Consistent body: `{ detail, error, request_id? }`.

### 9.3 Middleware

- `TelemetryMiddleware` – request tracking.
- `CORSMiddleware` – CORS enabled for development.

---

## 10. Deployment

### 10.1 Docker Compose (Local)

- `db` (Postgres 15), `redis`, `backend` (FastAPI), `frontend` (Nginx + static).
- Volumes: `./core/backend`, `./products`, `./assets` mounted into containers.
- Backend hot-reload via `--reload`.

### 10.2 Cloud Run (GitLab CI/CD)

- `.gitlab-ci.yml` builds images and deploys.
- Uses `Dockerfile.backend`, `Dockerfile.frontend`.

---

## 11. AI/Vibe-Coding Optimizations

- **Domain-split models/schemas** for smaller, focused context.
- **Product rules:** per-product `.cursor/rules/product.mdc` with entry points and dependencies.
- **`.cursorignore`:** exclude products not being worked on.
- **ARCHITECTURE.md:** reference for architecture and Cursor usage.

---

## 12. Planned Features (HR Mode – Lateral Recruitment)

From `HR_MODE_RECRUITMENT_LATERAL.plan.md`:

- **Job profiles:** Criteria/search config separate from placement jobs.
- **Candidate discovery:** Search/filter before applications.
- **AI shortlist:** From discovered pool, not just applicants.
- **Outreach:** In-platform messaging and connection requests.
- **Personas:** RECRUITER, PROFESSIONAL, CANDIDATE, SYSTEM_ADMIN.

---

## 13. API Design Conventions

### 13.1 URL Structure

- **Prefix:** `/api/v1/` for all REST endpoints.
- **Pattern:** `/api/v1/{resource}/` for list, `/api/v1/{resource}/{id}` for item.
- **Examples:** Auth (`/api/v1/auth/login`, `/api/v1/auth/me`), Core (`/api/v1/institutions`, `/api/v1/users`), Analytics (`/api/v1/analytics/reports`), Setup (`/api/v1/setup/status`), Upload (`/api/v1/upload/logo`).

### 13.2 Request/Response

- **Content-Type:** `application/json`.
- **Auth headers:** `Authorization: Bearer <token>` or `x-session-id` (or `x-auth-token`).
- **List endpoints:** Often use trailing slash for GET (e.g. `/api/v1/users/`).

### 13.3 Frontend API Layer

- **Base:** `apiBase.js` – `getApiBaseUrl()`, `apiRequest(endpoint, options)`, `uploadFile()`.
- **Domain modules:** `api/core.js`, `api/placement.js`, `api/cv.js`, etc.
- **Auth storage:** `sessionStorage.ithras_session_id`, `localStorage.ithras_session` (user, profiles, access_token).
- **Error handling:** 401 clears auth and emits `ithras:auth:expired`.
- **Telemetry:** Best-effort `recordApiEvent()` per request.

---

## 14. Session & Token Handling

### 14.1 Backend

- **Session store:** DB-backed (`auth_sessions` table).
- **Session TTL:** 7 days.
- **Token:** `secrets.token_urlsafe(32)` for session IDs.
- **JWT:** Used for `access_token`; `create_access_token(user_id)` / `decode_access_token()`.
- **Validation:** `get_session(db, session_id)` checks `expires_at > now`; `is_jwt_token()` routes JWT vs session.

### 14.2 Frontend

- **Session restore:** `validateSession()` → `GET /api/v1/auth/me` before restoring from localStorage.
- **Auth flow:** Login returns `session_id`, `access_token`, `user`, `profiles`, `active_profile`.
- **Profile switch:** `POST /api/v1/auth/switch-profile` with `profile_id`; response updates user and active profile.

---

## 15. Schema Conventions (Backend)

### 15.1 Pydantic / Domain Split

- Schemas in `core/backend/app/modules/shared/schemas/` split by domain: core, placement, cv, calendar, governance.
- **Naming:** `*Schema` (read), `*CreateSchema` (create payload), `*UpdateSchema` (update payload), `ResponseSchema` (generic wrapper).

---

## 16. Audit Logging

- **Utility:** `log_audit(db, user_id, action, entity_type, entity_id, institution_id, company_id, details, metadata, ip_address)`.
- **Model:** `AuditLog` with `user_id`, `action`, `entity_type`, `entity_id`, `institution_id`, `company_id`, `details` (JSON), `metadata_` (JSON).
- **Usage:** Login, logout, register, profile changes; `db.flush()` with rollback on failure.

---

## 17. Configuration

### 17.1 Environment Variables

- **Config:** `app/config.py` – `Settings` class, all vars via `os.getenv()`.
- **Key vars:** `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `GEMINI_*`, `DEMO_PASSWORD`, `LOG_FORMAT`, `SQL_ECHO`, `DB_SETUP`, `REQUIRE_DATABASE`, `IS_CLOUD_RUN`, `SKIP_PDF_AI`.

### 17.2 Usage

- All modules import `settings` from `app.config`; no direct `os.getenv()` in business logic.

---

## 18. Frontend State & Navigation

### 18.1 Hooks

- **`useAuth(navigate, setView)`** – user, profiles, activeProfile, login, logout, switchProfile, demo mode.
- **`useSetup()`** – setup status, showSetup, setupError.
- **`useViewRouter()`** – view, setView, navigate(view).
- **`useEffectiveMode()`** – mode resolution from `modeConfig.resolveNavContext`.

### 18.2 View ↔ URL

- **`pathToView(pathname)`** – maps pathname to view id.
- **URLs:** `/` → dashboard, `/feed` → feed, `/{view}` → product-specific.
- **History:** `window.history.replaceState` for view changes.

### 18.3 AppContext

- **Provider:** `AppProvider` – user, profiles, activeProfile, navigate, onSwitchProfile, onLogout, onUserUpdate.
- **Usage:** Layout, product UIs, mode switcher.

---

## 19. Telemetry

### 19.1 Middleware

- **TelemetryMiddleware** – request tracking; strips UUIDs for grouping (e.g. `/api/v1/users/abc123` → `/api/v1/users/:id`).
- **Endpoint:** `/api/v1/telemetry` for client telemetry.

### 19.2 Frontend

- **`recordApiEvent({ path, method, duration_ms, status })`**
- **`recordPageView()`**, **`flushTelemetry()`**
- **`setTelemetryUser(userId)`** for user correlation.

---

## 20. Testing Strategy

- **Backend:** pytest under `tests/test_backend/` – `pip install -r core/backend/requirements.txt` with Docker DB.
- **Frontend:** Vitest under `core/frontend`.
- **E2E:** Playwright under `tests/e2e`.

---

## 21. Database Conventions

- **IDs:** String UUIDs (e.g. `user_founders`, `general_xxx`, `iil_xxx`, `migrated_xxx`).
- **Timestamps:** `created_at`, `updated_at` – `datetime.datetime.utcnow`.
- **Soft state:** `is_active` on URA; `end_date` on links for alumni.
- **FKs:** `ondelete="CASCADE"` where appropriate (links, sessions).

---

## 22. Dependency Injection

- **DB:** `Depends(database.get_db)` – session per request.
- **Auth:** `Depends(get_current_user)`, `Depends(require_permission(code))`, `Depends(require_role(*roles))`.
- **Scoping:** `get_institution_scope(user)` – `user.institution_id` (None for system admins).

---

## 23. Graceful Degradation

- **Links vs URA:** Auth and setup check for `individual_institution_links`; fall back to URA when absent.
- **Redis:** Optional; `is_available()` before use.
- **Setup:** Non-blocking background; frontend polls `/setup/status`.
- **Gemini:** PDF import works without `GEMINI_API_KEY` (default template).

---

## 24. File & Module Layout

### 24.1 Backend (per product)

```
products/{product}/backend/
  app/
    modules/
      {domain}/
        routers/     # API route modules
        __init__.py
```

### 24.2 Frontend (per product)

```
products/{product}/frontend/
  src/
    modules/
      {feature}/
        index.js     # entry export
        *.js
```

### 24.3 Core Shared

```
core/backend/app/modules/shared/
  models/        # domain-split ORM
  schemas/       # domain-split Pydantic
  routers/       # auth, cycles, notifications, setup, audit, batches
  links.py       # Individual-Institution-Org helpers
  auth.py        # dependencies
  audit.py
  database.py
  session_store.py
  setup/         # registry, engine, schema_state
```

---

## 25. Summary for LLM Prompting

When asking for suggestions, specify:

1. **Monorepo** with core + product modules; single shared DB and backend.
2. **Config-driven** router and frontend product loading.
3. **Individual-Institution-Organization** link model with time bounds and alumni semantics.
4. **RBAC** via Role/Permission and links (or URA fallback).
5. **View + role-based routing** with lazy-loaded product UIs.
6. **Mode switcher** for context (e.g. recruiter mode).
7. **Setup engine** with idempotent seed steps and migration 028 fallback.
8. **FastAPI + React (ES modules)** as main tech stack.
9. **API:** REST under `/api/v1/`; JSON; Bearer token or `x-session-id`.
10. **Schemas:** Pydantic, domain-split, `*Schema` / `*CreateSchema` / `*UpdateSchema`.
11. **Session:** DB-backed sessions, JWT access tokens, 7-day TTL.
12. **Frontend:** React hooks (`useAuth`, `useSetup`, `useViewRouter`), `apiRequest()` for all API calls.
13. **Audit:** `log_audit()` for important actions.
14. **Config:** Centralized in `app.config.settings`; env vars only there.
15. **Graceful fallback:** Links vs URA, Redis, setup, Gemini.
16. **Telemetry:** Middleware + frontend `recordApiEvent` for API calls.
17. **Navigation:** View-based; `pathToView` + `resolveProduct(view, roleFlags)` for routing.

---

## 26. CSS and Design Language

The project uses a **unified design language** implemented as a **single importable library**. All design lives in that library; product and core files import from it and contain **no design elements** (no inline styles, no local Tailwind design, no custom card/button markup).

**Design library location:**
- **Tokens + utilities:** `core/frontend/index.html` (global CSS)
- **Primitives:** `core/frontend/src/modules/shared/primitives/`
- **Shared components:** `core/frontend/src/modules/shared/components/`
- **UI layer:** `core/frontend/src/modules/shared/ui/` (icons, charts)

**Import pattern:** Products import from shared:
```js
import { Button, SectionCard, PageHeader, StatusBadge, EmptyState, StatCard, FilterPill, PageHeaderCard } from '/core/frontend/src/modules/shared/index.js';
```

**Rule – no design in product files:** Product files must NOT contain `rounded-[...]`, `bg-[...]`, `text-[...]`, `border-[...]`, `shadow-[...]` with hardcoded values, or custom card/button markup. Use design primitives and utility classes only.

### 26.1 Design Tokens

All design tokens are defined in `:root` in `core/frontend/index.html`:

**Colors:**
| Token | Value | Usage |
|-------|-------|-------|
| `--app-bg` | `#f5f5f7` | App background |
| `--app-bg-elevated` | `#ffffff` | Elevated surfaces (e.g. progress bars) |
| `--app-surface` | `#ffffff` | Cards, inputs, sidebar |
| `--app-surface-muted` | `#fafafa` | Muted surfaces, empty states |
| `--app-surface-subtle` | `#fcfcfd` | Table headers, inner surfaces |
| `--app-surface-hover` | `rgba(0, 0, 0, 0.03)` | Hover overlay |
| `--app-text-primary` | `#1d1d1f` | Primary text |
| `--app-text-secondary` | `#6e6e73` | Secondary text |
| `--app-text-muted` | `#86868b` | Muted text |
| `--app-text-faint` | `#a1a1a6` | Uppercase labels, table headers |
| `--app-border-soft` | `rgba(0, 0, 0, 0.06)` | Subtle borders |
| `--app-border-strong` | `rgba(0, 0, 0, 0.1)` | Stronger borders |
| `--app-accent` | `#0071e3` | Primary accent (blue) |
| `--app-accent-hover` | `#0077ed` | Accent hover state |
| `--app-accent-soft` | `rgba(0, 113, 227, 0.08)` | Soft accent background |
| `--app-danger` | `#ff3b30` | Error/ destructive |
| `--app-success` | `#34c759` | Success |

**Spacing & Radius:**
| Token | Value | Usage |
|-------|-------|-------|
| `--app-radius-sm` | `8px` | Small controls |
| `--app-radius-md` | `12px` | Buttons, inputs, nav items |
| `--app-radius-lg` | `16px` | Inner elements |
| `--app-radius-xl` | `20px` | Stat cards, empty state |
| `--app-radius-2xl` | `18px` | Table containers |
| `--app-radius-3xl` | `20px` | Stat cards, empty state |
| `--app-radius-card` | `24px` | Section cards, page header |

**Shadows:**
| Token | Value | Usage |
|-------|-------|-------|
| `--app-shadow-subtle` | `0 1px 3px rgba(0, 0, 0, 0.04)` | Subtle elevation |
| `--app-shadow-card` | `0 2px 12px rgba(0, 0, 0, 0.04)` | Cards |
| `--app-shadow-primary` | `0 2px 12px rgba(0, 113, 227, 0.22)` | Primary button |
| `--app-shadow-floating` | `0 8px 32px rgba(0, 0, 0, 0.08)` | Modals, dropdowns |

**Transitions:**
| Token | Value |
|-------|-------|
| `--app-transition-fast` | `160ms cubic-bezier(0.25, 0.1, 0.25, 1)` |
| `--app-transition-base` | `220ms cubic-bezier(0.25, 0.1, 0.25, 1)` |

**Semantic aliases:** `--bg-app`, `--bg-surface`, `--text-primary`, `--accent`, `--status-success-bg`, `--status-warning-bg`, `--status-danger-bg`, `--status-info-bg` map to the raw palette. Prefer semantic tokens in components.

**Icons:** Lucide only. Import `Icon` from shared and use names: `dashboard`, `home`, `workflows`, `search`, `settings`, etc.

**Charts:** Use `CHART_COLORS_HEX` or `rechartsConfig` from `shared/ui/charts/` for consistent chart styling.

### 26.2 Typography

- **Font family:** Inter (Google Fonts), fallback `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Base size:** 15px
- **Line height:** 1.47
- **Letter spacing:** -0.01em
- **Weights:** 400, 500, 600, 700
- **Antialiasing:** `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`
- **Body:** Applied to `body` in index.html

### 26.3 Utility Classes

Defined in `core/frontend/index.html` inline `<style>`:

| Class | Purpose |
|-------|---------|
| `app-card` | Surface bg, soft border, 24px radius, card shadow |
| `app-input` | Surface bg, strong border, 12px radius, focus ring |
| `app-button-primary` | Accent bg, white text, 12px radius, primary shadow |
| `app-button-secondary` | Surface bg, strong border, 12px radius, subtle shadow |
| `app-button-ghost` | Transparent bg, accent text, 12px radius |
| `app-focus-ring` | 2px accent outline on `focus-visible`, 2px offset |
| `app-sidebar-glass` | `white/95`, backdrop-blur, right border |
| `app-nav-item` | 12px radius, padding for nav items |
| `app-sidebar-footer-card` | Rounded card for sidebar footer |
| `app-page-container` | max-w-1440px, mx-auto, responsive padding |
| `app-mode-card` | Gradient "Active mode" card for ModeSwitcher |
| `glass-panel` | `rgba(255,255,255,0.92)` + `backdrop-filter: blur(20px)` |
| `sidebar-item-active` | Accent-soft bg, accent text, 12px radius |
| `app-shell-bg` | App bg |
| `app-sidebar-surface` | Surface bg, right border |
| `app-shell-main` | Transparent, min-height 100% |
| `app-divider` | 1px border-soft |
| `custom-scrollbar` | 8px webkit scrollbar, rounded thumb, hover darker |
| `animate-in` | `fadeIn` 0.3s ease-out (opacity 0→1, translateY 4px→0) |

**Radius hierarchy:** Buttons/inputs 12px, stat/empty 20px, tables 18px, section cards 24px.

**Glass surfaces:** Sidebar `white/95 backdrop-blur-xl`, page header `white/88 backdrop-blur-xl`.

### 26.4 Tailwind Usage

- **CDN:** `https://cdn.tailwindcss.com` in index.html
- **Token usage:** `bg-[var(--app-bg)]`, `text-[var(--app-text-primary)]`, `rounded-[var(--app-radius-sm)]`
- **Layout:** `flex`, `grid`, `min-h-screen`, `max-w-*`, `space-y-*`, `gap-*`
- **Responsive:** `lg:flex`, `lg:w-1/2`, `md:p-16`, `hidden lg:block`, `lg:hidden`
- **Semantic colors:** `bg-[rgba(255,59,48,0.06)]` for error, `bg-[rgba(52,199,89,0.06)]` for success
- **Opacity:** `text-white/55`, `text-white/90`, `bg-white/10`

### 26.5 Primitives (Design Library)

| Primitive | Purpose |
|-----------|---------|
| `Button` | Variants: primary, secondary, ghost, danger. Sizes: sm, md, lg |
| `Input`, `Select`, `Textarea` | Form controls, 12px radius, app-input styling |
| `SectionCard` | Card with optional title, 24px radius, card shadow |
| `StatusBadge` | Pill badges, rounded-full, semantic colors |
| `PageHeader` | Page title + subtitle + actions |
| `PageHeaderCard` | PageHeader in glass card, optional contextBadge |
| `StatCard` | Label, value, delta; colors: accent, success, warning, default |
| `FilterPill` | Segmented control, options + value + onChange |
| `DataTable` | Table with surface-subtle header, 18px wrapper radius |
| `EmptyState` | Dashed border, accent icon circle, 20px radius |
| `Modal` | Overlay + card, used by ConfirmDialog, AlertDialog |

### 26.6 Component Patterns

**Empty states:** (`EmptyState.js`)
- Centered flex, `p-12`, `rounded-[20px]`, dashed border, `bg-[var(--app-surface-muted)]`
- Icon in accent-soft circle; title: `text-[15px] font-semibold`
- Action: Button primitive

**Toasts:** (`Toast.js`)
- `rounded-[var(--app-radius-md)]`, border, `transition-all duration-200`
- Success: `bg-[rgba(52,199,89,0.06)] border-[rgba(52,199,89,0.2)] text-[var(--app-success)]`
- Error: `bg-[rgba(255,59,48,0.06)] border-[rgba(255,59,48,0.2)] text-[var(--app-danger)]`
- Animate: opacity and `translate-y` on show/hide

**Modals:** (`ConfirmDialog.js`)
- Overlay: `fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[100] flex items-center justify-center p-4`
- Card: `app-card`, `shadow-[var(--app-shadow-floating)]`, `max-w-md`
- Buttons: `app-button-primary`, `app-button-secondary`, `app-focus-ring`

**Forms:**
- Labels: `block text-sm font-medium text-[var(--app-text-primary)] mb-1.5`
- Inputs: `app-input` class
- Error message: `p-3 bg-[rgba(255,59,48,0.06)] rounded-[var(--app-radius-sm)] text-sm text-[var(--app-danger)]`

**Login split layout:**
- Left panel (hidden on mobile): gradient `linear-gradient(145deg, #0071e3 0%, #0058b0 50%, #003d7a 100%)`
- Decorative: radial white gradients at low opacity, grid overlay
- Form right: `max-w-sm`, centered

### 26.7 CV Builder Design Tokens

From `core/frontend/src/modules/shared/cv/cvPreview/configToStyles.js`:

- **Page:** `page.size` (Letter / 210mm), `page.margins`, `typography.baseFont`, `page.backgroundColor`
- **Section:** `sectionHeaderStyle.backgroundColor` (default charcoal `#3A3838`), `sectionHeaderStyle.textColor` (default white), `titleCaps` (uppercase)
- **Tokens:** `charcoalBar`, `labelFill`, `gridLineColor`, `instituteBrown` (#7A4B2A)
- **Border:** `1px solid` with `gridLineColor`

### 26.8 Design Philosophy

- **Apple-inspired:** Clean, minimal, restrained color palette
- **Light mode only:** No dark mode tokens defined
- **Accent:** #0071e3 (blue) for primary actions and focus states
- **Shadows:** Subtle; avoid heavy borders
- **Transitions:** Fast (180ms) for interactions; cubic-bezier for smooth easing
