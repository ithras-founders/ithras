# Local development — API base URL

If search or other API calls fail with **“Could not complete the request”**, **“Network error”**, or search shows **“Search is unavailable right now”** / **“Can’t reach the search service”** (under Developer setup), the browser is probably not reaching the API.

Resolution is always: **UI origin** + **how `/api` is routed** must match a running backend (commonly **`http://127.0.0.1:8000`**).

| UI URL | Default API base (see [`shared/services/apiBase.js`](../shared/services/apiBase.js)) |
|--------|----------------------------------------------------------------------------------------|
| `http://localhost:3000`, `:5173`, `:4173`, `:8080` | `http://127.0.0.1:8000/api` (direct to backend; CORS must allow the UI origin) |
| `http://localhost:5000` (or port printed by `frontend_server.py`) | Same-origin **`/api`** (proxied to the backend by the script) |
| Any other localhost port | Same-origin **`/api`** — you need a **proxy** or an **absolute** override (Option 3) |

`window.API_URL = '/api'` in [`core/app/frontend/index.html`](../core/app/frontend/index.html) is a **relative** URL; it does **not** override the base. Use **`http://127.0.0.1:8000/api`** in `sessionStorage` / `window.__ITHRAS_API_BASE__` / `<meta name="api-url">` when you need an explicit absolute API origin.

When the app is opened on **localhost** with a typical dev-server port (**3000**, **5173**, **4173**, **8080**), the client **defaults the API to `http://127.0.0.1:8000/api`** so you do not need `sessionStorage` if the API runs on port 8000. **Port 5000** (integrated `frontend_server.py`) still uses same-origin **`/api`**.

## Option 1 — Frontend server (recommended)

```bash
# Terminal 1: API (example port 8000)
uvicorn core.app.backend.main:app --reload --port 8000

# Terminal 2: static + /api proxy
python frontend_server.py
```

Open **http://localhost:5000** (or the port `frontend_server.py` prints). Requests go to `/api`, which is proxied to the backend.

## Option 2 — Proxy `/api` in your own dev server

Point `/api` at `http://127.0.0.1:8000` (or your API origin) so the browser stays same-origin.

## Option 3 — Absolute API base in the browser

```js
sessionStorage.setItem('ithras_api_base', 'http://127.0.0.1:8000/api');
location.reload();
```

The app reads this in [`shared/services/apiBase.js`](../shared/services/apiBase.js). CORS must allow your UI origin (the API enables this for local dev).

## Docker Compose (`docker-compose.yml`)

The **frontend** container serves the UI on **http://localhost:3000** and proxies **`/api`** to the **backend** service (see [`core/app/frontend/nginx.conf.template`](../core/app/frontend/nginx.conf.template)).

- **`USE_SAME_ORIGIN_API=1`** (default in compose): on startup, [`entrypoint.sh`](../core/app/frontend/entrypoint.sh) writes [`docker-api-base.js`](../core/app/frontend/docker-api-base.js) so `window.__ITHRAS_API_BASE__` is **`http://localhost:3000/api`** (same-origin). Search and other calls go through nginx instead of cross-origin `127.0.0.1:8000`, avoiding redirect/CORS edge cases.
- Set **`USE_SAME_ORIGIN_API=0`** on the frontend service if you need the old behavior (browser talks directly to `:8000` from port 3000).
- The client also **fixes** relative **`Location`** headers on API redirects: joining them to `baseUrl` used to duplicate `/api` (`/api/api/v1/...`); that is corrected in `apiBase.js`. Unified search URLs avoid an unnecessary trailing slash before `?` so the backend does not return **307** for `/api/v1/search/`.
- The **backend** service bind-mounts `./core` to `/core`, which replaces image content under `/core`. Alembic **022** therefore mounts [`data/seeds/directory/`](../data/seeds/directory/) at **`/core/data/seeds/directory`** so directory seeds are visible inside the container.

## Database migrations

`alembic upgrade head` runs revision **022_directory_entities_seed**, which **idempotently** loads the public directory (Fortune 500, India companies, engineering and B-school institutions) from [`data/seeds/directory/`](../data/seeds/directory/). Production images must include that tree (see [`Dockerfile.backend`](../Dockerfile.backend)).

## Verify

1. **Browser:** DevTools → Network. A request to **`/v1/search?q=test&...`** (full URL = your API origin + that path + query) should return **200** JSON, not HTML from the dev server, **(failed)**, or CORS errors.
2. **CLI (backend running on 8000):**
   ```bash
   curl -sS -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/search?q=test&limit=1"
   ```
   Expect **`200`** (or **`307`** then **`200`** if your server redirects; use `curl -L` to follow). If **`000`** or connection refused, start the API (e.g. `uvicorn core.app.backend.main:app --reload --port 8000`).

## LongForm: **`404`** on `/api/v1/longform/...`

A **404** (not 401/503) means **no route was registered** for LongForm. The API starts without that router if `from longform.routers import router` fails at startup (see backend logs: *“LongForm router not loaded”* with a traceback).

Typical causes:

1. **Missing dependency** — install/rebuild so **`nh3`** is present: `pip install -r core/app/backend/requirements.txt` or rebuild the Docker **backend** image after `requirements.txt` changed.
2. **`products/` not available to the API** — the LongForm package lives under [`products/longform/backend`](../products/longform/backend). Docker Compose mounts `./products:/products`; running **uvicorn** from a copy of **only** `core/app/backend` without the monorepo layout will skip LongForm.

After fixing, **`GET http://127.0.0.1:8000/openapi.json`** should list paths under `/api/v1/longform/`.
