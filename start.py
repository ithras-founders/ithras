"""
Ithras development server for Replit.
- Serves the FastAPI backend on port 8000 (internal)
- Serves the frontend + reverse proxy on port 5000 (user-facing)
"""
import subprocess
import sys
import os
import time
import signal
import threading

WORKSPACE = os.path.dirname(os.path.abspath(__file__))

def run_backend():
    """Run the FastAPI backend on port 8000."""
    backend_dir = os.path.join(WORKSPACE, "core", "app", "backend")
    env = os.environ.copy()
    env["PYTHONPATH"] = WORKSPACE
    proc = subprocess.Popen(
        [
            sys.executable, "-m", "uvicorn", "main:app",
            "--host", "localhost",
            "--port", "8000",
            "--reload",
            "--reload-dir", WORKSPACE,
        ],
        cwd=backend_dir,
        env=env,
    )
    return proc

def run_frontend():
    """Run the frontend proxy server on port 5000."""
    env = os.environ.copy()
    env["PYTHONPATH"] = WORKSPACE
    proc = subprocess.Popen(
        [sys.executable, os.path.join(WORKSPACE, "frontend_server.py")],
        cwd=WORKSPACE,
        env=env,
    )
    return proc

if __name__ == "__main__":
    backend = run_backend()
    # Give backend a moment to start
    time.sleep(2)
    frontend = run_frontend()

    def shutdown(sig, frame):
        backend.terminate()
        frontend.terminate()
        sys.exit(0)

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    # Wait for either to exit
    try:
        backend.wait()
    except KeyboardInterrupt:
        pass
    finally:
        backend.terminate()
        frontend.terminate()
