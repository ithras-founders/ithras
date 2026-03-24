"""
Frontend server for Ithras on Replit.
Serves the frontend ES modules at the right paths and proxies /api to the FastAPI backend.
"""
import os
import sys
import mimetypes
import httpx
from pathlib import Path
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import Response, FileResponse, HTMLResponse
from starlette.routing import Route, Mount
from starlette.staticfiles import StaticFiles
import uvicorn

WORKSPACE = Path(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = WORKSPACE / "core" / "app" / "frontend"

# Ensure JS files are served with the correct MIME type
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".mjs")

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000").rstrip("/")

async def proxy_to_backend(request: Request) -> Response:
    """Proxy /api/* requests to the FastAPI backend."""
    path = request.url.path
    query = str(request.url.query)
    url = f"{BACKEND_URL}{path}"
    if query:
        url += f"?{query}"
    
    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
            )
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=dict(resp.headers),
            )
    except httpx.ConnectError:
        return Response(
            content=b'{"error": "Backend not available"}',
            status_code=503,
            media_type="application/json",
        )


def serve_js_file(file_path: Path) -> Response:
    """Serve a JS file with correct headers and caching."""
    if not file_path.exists():
        return Response(status_code=404)
    # FileResponse handles ETag + Last-Modified automatically so the browser
    # can do conditional GETs (304 Not Modified) after the cache expires.
    return FileResponse(
        str(file_path),
        media_type="application/javascript",
        headers={
            "Cache-Control": "no-cache, must-revalidate",
            "Access-Control-Allow-Origin": "*",
        },
    )


async def serve_file_from_root(request: Request) -> Response:
    """Serve any file relative to workspace root (for /core/, /admin/, /products/, /shared/ etc.)."""
    path = request.path_params.get("path", "")
    prefix = request.url.path.split("/")[1]  # e.g. "core", "admin"
    
    file_path = WORKSPACE / prefix / path

    # If file doesn't exist and the path has no extension, it's a SPA route — serve index.html
    if not file_path.exists():
        if not file_path.suffix:
            return await serve_index(request)
        return Response(status_code=404)
    
    if file_path.suffix in (".js", ".mjs"):
        return serve_js_file(file_path)
    
    mime, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(str(file_path), media_type=mime or "application/octet-stream")


async def serve_src(request: Request) -> Response:
    """Serve /src/* from the frontend src directory."""
    path = request.path_params.get("path", "")
    file_path = FRONTEND_DIR / "src" / path
    if not file_path.exists():
        return Response(status_code=404)
    if file_path.suffix in (".js", ".mjs"):
        return serve_js_file(file_path)
    mime, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(str(file_path), media_type=mime or "application/octet-stream")


async def serve_index(request: Request) -> Response:
    """Serve the frontend index.html for all unmatched routes (SPA fallback)."""
    index_path = FRONTEND_DIR / "index.html"
    return FileResponse(str(index_path), media_type="text/html")


async def serve_shared_styles(request: Request) -> Response:
    """Serve /shared/styles/* files."""
    path = request.path_params.get("path", "")
    file_path = WORKSPACE / "shared" / "styles" / path
    if not file_path.exists():
        return Response(status_code=404)
    mime, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(
        str(file_path),
        media_type=mime or "text/plain",
        headers={"Cache-Control": "no-cache, must-revalidate"},
    )


ALL_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]

routes = [
    # API proxy — must allow all HTTP methods
    Route("/api", proxy_to_backend, methods=ALL_METHODS),
    Route("/api/{path:path}", proxy_to_backend, methods=ALL_METHODS),
    # LongForm images (backend serves /media/longform)
    Route("/media", proxy_to_backend, methods=ALL_METHODS),
    Route("/media/{path:path}", proxy_to_backend, methods=ALL_METHODS),

    # Source files from workspace root directories
    Route("/core/{path:path}", serve_file_from_root),
    Route("/admin/{path:path}", serve_file_from_root),
    Route("/products/{path:path}", serve_file_from_root),
    Route("/shared/styles/{path:path}", serve_shared_styles),
    Route("/shared/{path:path}", serve_file_from_root),

    # Frontend src
    Route("/src/{path:path}", serve_src),

    # Public assets
    Mount("/public", app=StaticFiles(directory=str(FRONTEND_DIR / "public")), name="public"),

    # SPA fallback
    Route("/{path:path}", serve_index),
    Route("/", serve_index),
]

app = Starlette(routes=routes)

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
        log_level="info",
    )
