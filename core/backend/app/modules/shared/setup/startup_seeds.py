"""Run idempotent setup seeds at startup."""
from __future__ import annotations

import json
import sys

from app.modules.shared.database import engine
from app.modules.shared.setup.registry import build_steps


def run_startup_seeds() -> list[dict]:
    steps = build_steps(engine)
    results: list[dict] = []
    with engine.connect() as conn:
        for step in steps:
            step_id = step["id"]
            step_name = step["name"]
            if step["check"](conn):
                results.append({"id": step_id, "name": step_name, "status": "already_done"})
                continue
            step["apply"](conn)
            results.append({"id": step_id, "name": step_name, "status": "applied"})
    return results


def main() -> int:
    try:
        results = run_startup_seeds()
        print(json.dumps({"seed_status": "ok", "steps": results}))
        return 0
    except Exception as exc:
        print(json.dumps({"seed_status": "error", "error": str(exc)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
