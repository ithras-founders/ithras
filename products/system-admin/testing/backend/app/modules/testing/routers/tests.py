"""
Tests API for System Admin.
List test suites, run tests (backend, frontend, e2e), and fetch run results.
"""
import os
import re
import shutil
import subprocess
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


def _node_available() -> bool:
    """Check if Node.js (node/npm) is available."""
    return shutil.which("node") is not None and shutil.which("npm") is not None


def _npx_available() -> bool:
    """Check if npx is available (for Playwright)."""
    return shutil.which("npx") is not None


def _python_cmd() -> str:
    """Return python or python3 for subprocess."""
    return "python3" if shutil.which("python3") else "python"

router = APIRouter(prefix="/api/v1/admin/tests", tags=["tests"])

# In-memory store for test run results (persists for process lifetime only)
_test_runs: Dict[str, dict] = {}

# Project root (ithras repo). Set ITHRAS_ROOT env if running in Docker.
def _get_project_root() -> Path:
    env_root = os.getenv("ITHRAS_ROOT")
    if env_root:
        return Path(env_root)
    # routers -> backend -> testing -> modules -> system-admin -> products -> athena
    p = Path(__file__).resolve().parent
    for _ in range(6):
        p = p.parent
    return p


class TestSuiteInfo(BaseModel):
    id: str
    label: str
    command: str
    category: str  # "business" | "technology"
    last_run_id: Optional[str] = None
    last_status: Optional[str] = None
    last_at: Optional[str] = None


class TestEnvironmentResponse(BaseModel):
    project_root: str
    node_available: bool
    npm_available: bool
    npx_available: bool
    pytest_available: bool


class TestRunSummary(BaseModel):
    id: str
    suite: str
    status: str  # running | passed | failed
    passed: Optional[int] = None
    failed: Optional[int] = None
    total: Optional[int] = None
    duration_seconds: Optional[float] = None
    started_at: str
    output: Optional[str] = None


class RunTestsRequest(BaseModel):
    suite: str  # backend | frontend | e2e | simulator


def _run_backend_tests(project_root: Path, run_id: str) -> dict:
    """Run pytest for backend tests."""
    env = os.environ.copy()
    core_backend = str(project_root / "core" / "backend")
    env["PYTHONPATH"] = core_backend + (os.pathsep + env.get("PYTHONPATH", ""))
    cmd = [
        _python_cmd(), "-m", "pytest",
        str(project_root / "tests" / "test_backend"),
        "-v", "--tb=short", "-q",
        "--no-header",
    ]
    try:
        result = subprocess.run(
            cmd,
            cwd=str(project_root),
            capture_output=True,
            text=True,
            timeout=300,
            env=env,
        )
        out = (result.stdout or "") + (result.stderr or "")
        # Parse pytest output for passed/failed counts
        passed = failed = 0
        for line in out.splitlines():
            if " passed" in line and " failed" not in line:
                try:
                    passed = int(line.split()[0])
                except (ValueError, IndexError):
                    pass
            if " failed" in line:
                parts = line.replace(",", "").split()
                for i, p in enumerate(parts):
                    if p == "passed" and i > 0:
                        try:
                            passed = int(parts[i - 1])
                        except (ValueError, IndexError):
                            pass
                    if p == "failed" and i > 0:
                        try:
                            failed = int(parts[i - 1])
                        except (ValueError, IndexError):
                            pass
        status = "passed" if result.returncode == 0 else "failed"
        return {
            "status": status,
            "passed": passed,
            "failed": failed,
            "total": passed + failed or None,
            "output": out[:10000],
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"status": "failed", "output": "Tests timed out after 300 seconds", "passed": 0, "failed": 0}
    except Exception as e:
        return {"status": "failed", "output": str(e), "passed": 0, "failed": 0}


def _run_frontend_tests(project_root: Path, run_id: str) -> dict:
    """Run Vitest for frontend tests."""
    if not _node_available():
        return {"status": "failed", "output": "Node.js and npm are required for frontend tests. Install Node or run from a dev environment with Node.", "passed": 0, "failed": 0}
    frontend_dir = project_root / "core" / "frontend"
    if not (frontend_dir / "package.json").exists():
        return {"status": "failed", "output": f"Frontend package.json not found at {frontend_dir}", "passed": 0, "failed": 0}
    try:
        result = subprocess.run(
            ["npm", "test", "--", "--run"],
            cwd=str(frontend_dir),
            capture_output=True,
            text=True,
            timeout=120,
        )
        out = (result.stdout or "") + (result.stderr or "")
        passed = failed = 0
        for line in out.splitlines():
            if "Tests" in line or "passed" in line:
                try:
                    m = re.search(r"(\d+)\s+passed", out)
                    if m:
                        passed = int(m.group(1))
                    m = re.search(r"(\d+)\s+failed", out)
                    if m:
                        failed = int(m.group(1))
                except (ValueError, IndexError):
                    pass
        status = "passed" if result.returncode == 0 else "failed"
        return {
            "status": status,
            "passed": passed,
            "failed": failed,
            "total": passed + failed or None,
            "output": out[:10000],
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"status": "failed", "output": "Tests timed out after 120 seconds", "passed": 0, "failed": 0}
    except Exception as e:
        return {"status": "failed", "output": str(e), "passed": 0, "failed": 0}


def _run_e2e_tests(project_root: Path, run_id: str) -> dict:
    """Run Playwright E2E tests."""
    if not _npx_available():
        return {"status": "failed", "output": "Node.js and npx are required for E2E tests. Install Node or run from a dev environment with Node.", "passed": 0, "failed": 0}
    e2e_dir = project_root / "tests" / "e2e"
    if not (e2e_dir / "package.json").exists():
        return {"status": "failed", "output": f"E2E package.json not found at {e2e_dir}", "passed": 0, "failed": 0}
    try:
        result = subprocess.run(
            ["npx", "playwright", "test", "--reporter=line"],
            cwd=str(e2e_dir),
            capture_output=True,
            text=True,
            timeout=600,
        )
        out = (result.stdout or "") + (result.stderr or "")
        passed = failed = 0
        for line in out.splitlines():
            if "passed" in line:
                try:
                    m = re.search(r"(\d+)\s+passed", out)
                    if m:
                        passed = int(m.group(1))
                    m = re.search(r"(\d+)\s+failed", out)
                    if m:
                        failed = int(m.group(1))
                except (ValueError, IndexError):
                    pass
        status = "passed" if result.returncode == 0 else "failed"
        return {
            "status": status,
            "passed": passed,
            "failed": failed,
            "total": passed + failed or None,
            "output": out[:10000],
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"status": "failed", "output": "E2E tests timed out after 600 seconds", "passed": 0, "failed": 0}
    except Exception as e:
        return {"status": "failed", "output": str(e), "passed": 0, "failed": 0}


def _run_simulator_scenarios(project_root: Path, run_id: str) -> dict:
    """Run all simulator scenarios via the scenario runner."""
    try:
        import sys
        core_backend = str(project_root / "core" / "backend")
        if core_backend not in sys.path:
            sys.path.insert(0, core_backend)
        sim_pkg = str(project_root / "products" / "system-admin" / "backend")
        if sim_pkg not in sys.path:
            sys.path.insert(0, sim_pkg)

        from app.modules.shared.database import SessionLocal
        from app.modules.simulator.scenarios import SCENARIOS, ScenarioRunner

        runner = ScenarioRunner(SCENARIOS)
        db = SessionLocal()
        passed = 0
        failed = 0
        lines = []
        try:
            for sid in SCENARIOS:
                result = runner.run(sid, db)
                db.commit()
                ok = result.status == "completed"
                if ok:
                    passed += 1
                else:
                    failed += 1
                icon = "PASS" if ok else "FAIL"
                lines.append(f"[{icon}] {result.label} ({result.total_duration_ms}ms)")
                for step in result.steps:
                    s_icon = "+" if step["status"] == "passed" else "-" if step["status"] == "failed" else "~"
                    lines.append(f"  {s_icon} {step['name']} [{step['status']}]")
                    if step.get("error"):
                        lines.append(f"    ERROR: {step['error'][:200]}")
        finally:
            db.close()

        status = "passed" if failed == 0 else "failed"
        out = "\n".join(lines)
        return {
            "status": status, "passed": passed, "failed": failed,
            "total": passed + failed, "output": out[:10000],
        }
    except Exception as e:
        import traceback
        return {
            "status": "failed", "passed": 0, "failed": 1,
            "output": f"Scenario runner error: {e}\n{traceback.format_exc()[:3000]}",
        }


SUITE_RUNNERS = {
    "backend": _run_backend_tests,
    "frontend": _run_frontend_tests,
    "e2e": _run_e2e_tests,
    "simulator": _run_simulator_scenarios,
}


@router.get("/environment", response_model=TestEnvironmentResponse)
def get_test_environment():
    """Return environment status for test execution (project root, Node, pytest availability)."""
    root = _get_project_root()
    return TestEnvironmentResponse(
        project_root=str(root),
        node_available=shutil.which("node") is not None,
        npm_available=shutil.which("npm") is not None,
        npx_available=_npx_available(),
        pytest_available=shutil.which("pytest") is not None or shutil.which("python") is not None,
    )


@router.get("/suites", response_model=List[TestSuiteInfo])
def get_test_suites():
    """List available test suites with last run info, grouped by Business and Technology."""
    base_suites = [
        {"id": "backend", "label": "Backend (pytest)", "command": "pytest tests/test_backend", "category": "business"},
        {"id": "simulator", "label": "Simulator Scenarios", "command": "run all simulator scenarios", "category": "business"},
        {"id": "frontend", "label": "Frontend (Vitest)", "command": "npm test -- --run", "category": "technology"},
        {"id": "e2e", "label": "E2E (Playwright)", "command": "npx playwright test", "category": "technology"},
    ]
    # Enrich with last run from store
    last_by_suite = {}
    for r in sorted(_test_runs.values(), key=lambda x: x.get("started_at", ""), reverse=True):
        s = r.get("suite")
        if s and s not in last_by_suite:
            last_by_suite[s] = r
    result = []
    for b in base_suites:
        last = last_by_suite.get(b["id"])
        result.append(TestSuiteInfo(
            id=b["id"],
            label=b["label"],
            command=b["command"],
            category=b["category"],
            last_run_id=last.get("id") if last else None,
            last_status=last.get("status") if last else None,
            last_at=last.get("started_at") if last else None,
        ))
    return result


@router.get("/runs", response_model=List[TestRunSummary])
def get_test_runs(limit: int = 20):
    """List recent test runs."""
    runs = sorted(_test_runs.values(), key=lambda x: x.get("started_at", ""), reverse=True)
    return [TestRunSummary(**r) for r in runs[:limit]]


@router.get("/runs/{run_id}", response_model=TestRunSummary)
def get_test_run(run_id: str):
    """Get a specific test run."""
    if run_id not in _test_runs:
        raise HTTPException(status_code=404, detail="Test run not found")
    return TestRunSummary(**_test_runs[run_id])


@router.post("/run", response_model=TestRunSummary)
def run_tests(req: RunTestsRequest):
    """Run a test suite (backend, frontend, e2e, or simulator). Blocks until complete."""
    if req.suite not in SUITE_RUNNERS:
        raise HTTPException(status_code=400, detail=f"Unknown suite: {req.suite}. Use backend, frontend, e2e, or simulator.")
    run_id = str(uuid.uuid4())[:8]
    started_at = datetime.utcnow().isoformat() + "Z"
    _test_runs[run_id] = {
        "id": run_id,
        "suite": req.suite,
        "status": "running",
        "passed": None,
        "failed": None,
        "total": None,
        "duration_seconds": None,
        "started_at": started_at,
        "output": None,
    }
    project_root = _get_project_root()
    runner = SUITE_RUNNERS[req.suite]
    start = datetime.utcnow()
    result = runner(project_root, run_id)
    duration = (datetime.utcnow() - start).total_seconds()
    _test_runs[run_id].update({
        "status": result.get("status", "failed"),
        "passed": result.get("passed"),
        "failed": result.get("failed"),
        "total": result.get("total"),
        "duration_seconds": duration,
        "output": result.get("output"),
    })
    return TestRunSummary(**_test_runs[run_id])
