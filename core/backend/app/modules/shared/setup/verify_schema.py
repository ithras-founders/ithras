"""CLI check that exits non-zero when schema is not at Alembic head."""
from __future__ import annotations

import json
import sys

from app.modules.shared.setup.schema_state import get_schema_state


def main() -> int:
    state = get_schema_state()
    if state.get("ready"):
        print(json.dumps({"schema": "ready", **state}))
        return 0
    print(json.dumps({"schema": "not_ready", **state}))
    return 1


if __name__ == "__main__":
    sys.exit(main())
