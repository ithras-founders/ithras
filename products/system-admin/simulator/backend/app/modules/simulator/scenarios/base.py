"""
Base classes for simulator scenarios.

A scenario is an ordered list of steps that exercise a real business flow
against the database.  The runner executes each step, captures timing and
entity IDs, and stops on failure (unless the step is marked optional).
"""

import time
import traceback
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

from sqlalchemy.orm import Session


@dataclass
class ScenarioStep:
    name: str
    status: str = "pending"       # pending | passed | failed | skipped
    entity_id: Optional[str] = None
    duration_ms: float = 0
    error: Optional[str] = None
    detail: Optional[str] = None  # human-readable note


@dataclass
class ScenarioResult:
    scenario_id: str
    label: str
    status: str = "pending"       # completed | failed
    steps: List[Dict[str, Any]] = field(default_factory=list)
    created_entities: Dict[str, list] = field(default_factory=dict)
    password: str = "password"
    total_duration_ms: float = 0

    def to_dict(self) -> dict:
        return {
            "scenario_id": self.scenario_id,
            "label": self.label,
            "status": self.status,
            "steps": self.steps,
            "created_entities": self.created_entities,
            "password": self.password,
            "total_duration_ms": self.total_duration_ms,
        }


class BaseScenario:
    """Subclass and implement ``define_steps`` to create a scenario."""

    id: str = "base"
    label: str = "Base Scenario"
    description: str = ""
    category: str = "business"

    def __init__(self, db: Session, options: Optional[dict] = None):
        self.db = db
        self.options = options or {}
        self.prefix = f"sim_{uuid.uuid4().hex[:8]}"
        self._steps: List[tuple] = []          # (name, fn, optional)
        self._created: Dict[str, list] = {}
        self._context: Dict[str, Any] = {}     # shared state across steps

    # -- public API ----------------------------------------------------------

    def define_steps(self) -> None:
        """Override to call ``self.step(...)`` for each step."""
        raise NotImplementedError

    def step(self, name: str, fn: Callable[[], Optional[str]], *, optional: bool = False):
        """Register a step.  *fn* should return an entity ID or None."""
        self._steps.append((name, fn, optional))

    def record(self, entity_type: str, entity_id: str) -> None:
        self._created.setdefault(entity_type, []).append(entity_id)

    # -- runner entry point --------------------------------------------------

    def run(self) -> ScenarioResult:
        self.define_steps()
        result = ScenarioResult(scenario_id=self.id, label=self.label)
        t0 = time.perf_counter()
        failed = False

        for name, fn, optional in self._steps:
            step = ScenarioStep(name=name)
            if failed and not optional:
                step.status = "skipped"
                result.steps.append(_step_dict(step))
                continue

            ts = time.perf_counter()
            try:
                entity_id = fn()
                step.status = "passed"
                step.entity_id = entity_id
            except Exception as exc:
                step.status = "failed"
                step.error = str(exc)
                step.detail = traceback.format_exc()
                if not optional:
                    failed = True
                    step.duration_ms = round((time.perf_counter() - ts) * 1000, 1)
                    result.steps.append(_step_dict(step))
                    result.status = "failed"
                    result.created_entities = self._created
                    result.total_duration_ms = round((time.perf_counter() - t0) * 1000, 1)
                    self.db.rollback()
                    raise exc
            step.duration_ms = round((time.perf_counter() - ts) * 1000, 1)
            result.steps.append(_step_dict(step))

        result.status = "failed" if failed else "completed"
        result.created_entities = self._created
        result.total_duration_ms = round((time.perf_counter() - t0) * 1000, 1)
        return result

    # -- helpers for subclasses ----------------------------------------------

    def uid(self, tag: str) -> str:
        return f"{self.prefix}_{tag}"

    def _ensure_role_assignment(self, user_id, role_id, institution_id=None,
                                company_id=None, program_id=None):
        from app.modules.shared import models
        if self.db.query(models.Role).filter(models.Role.id == role_id).first() is None:
            return
        ra_id = self.uid(f"ura_{user_id}")
        if self.db.query(models.UserRoleAssignment).filter(
            models.UserRoleAssignment.id == ra_id
        ).first():
            return
        ura = models.UserRoleAssignment(
            id=ra_id, user_id=user_id, role_id=role_id,
            institution_id=institution_id, company_id=company_id, program_id=program_id,
        )
        self.db.add(ura)

    def _ensure_cv_template(self, institution_id=None):
        from app.modules.shared.cv_template_utils import ensure_cv_template
        ensure_cv_template(
            self.db,
            institution_id=institution_id or self._context.get("institution_id"),
        )


class ScenarioRunner:
    """Convenience wrapper: look up a scenario by id and execute it."""

    def __init__(self, registry: dict):
        self.registry = registry

    def list_scenarios(self) -> List[dict]:
        out = []
        for sid, cls in self.registry.items():
            out.append({
                "id": sid,
                "label": cls.label,
                "description": cls.description,
                "category": cls.category,
            })
        return out

    def run(self, scenario_id: str, db: Session, options: Optional[dict] = None) -> ScenarioResult:
        cls = self.registry.get(scenario_id)
        if cls is None:
            raise ValueError(f"Unknown scenario: {scenario_id}")
        scenario = cls(db, options)
        return scenario.run()


def _step_dict(s: ScenarioStep) -> dict:
    d: dict = {"name": s.name, "status": s.status, "duration_ms": s.duration_ms}
    if s.entity_id:
        d["entity_id"] = s.entity_id
    if s.error:
        d["error"] = s.error
    return d
