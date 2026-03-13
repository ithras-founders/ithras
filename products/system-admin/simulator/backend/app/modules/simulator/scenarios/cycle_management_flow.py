"""
CycleManagementFlow scenario — placement cycle lifecycle.

Steps:
1. Create institution
2. Create cycle in DRAFT status
3. Transition to APPLICATIONS_OPEN
4. Create company + job + workflow under the cycle
5. Transition to APPLICATIONS_CLOSED
6. Transition to OFFERS_IN_PROGRESS
7. Transition to COMPLETED
8. Verify full lifecycle
"""

import datetime

from sqlalchemy import text

from app.modules.shared import models
from app.modules.shared.password import hash_password

from .base import BaseScenario


CYCLE_TRANSITIONS = [
    ("DRAFT", "APPLICATIONS_OPEN"),
    ("APPLICATIONS_OPEN", "APPLICATIONS_CLOSED"),
    ("APPLICATIONS_CLOSED", "OFFERS_IN_PROGRESS"),
    ("OFFERS_IN_PROGRESS", "COMPLETED"),
]


class CycleManagementFlowScenario(BaseScenario):
    id = "cycle_management_flow"
    label = "Cycle Management Flow"
    description = (
        "Create a placement cycle and transition it through the full lifecycle: "
        "DRAFT → APPLICATIONS_OPEN → APPLICATIONS_CLOSED → OFFERS_IN_PROGRESS → COMPLETED."
    )
    category = "business"

    def define_steps(self):
        self.step("Create institution", self._create_institution)
        self.step("Create PT user", self._create_pt)
        self.step("Create cycle (DRAFT)", self._create_cycle)
        self.step("Open applications", self._open_applications)
        self.step("Create company and job under cycle", self._create_company_job)
        self.step("Create workflow under cycle", self._create_workflow)
        self.step("Close applications", self._close_applications)
        self.step("Begin offer phase", self._begin_offers)
        self.step("Complete cycle", self._complete_cycle)
        self.step("Verify full lifecycle", self._verify_lifecycle)

    def _create_institution(self):
        iid = self.uid("inst")
        self.db.add(models.Institution(id=iid, name="Cycle Mgmt School",
                                       tier="Tier 1", location="Hyderabad"))
        pid = self.uid("prog")
        self.db.add(models.Program(id=pid, institution_id=iid, name="MBA", code="MBA"))
        self.db.flush()
        self._context.update(institution_id=iid, program_id=pid)
        self.record("institutions", iid)
        return iid

    def _create_pt(self):
        uid = self.uid("pt")
        self.db.add(models.User(
            id=uid, email=f"pt@{self.prefix}.test", name="Cycle Manager",
            role="PLACEMENT_TEAM", institution_id=self._context["institution_id"],
            password_hash=hash_password("password"), sector_preferences=[],
        ))
        self.db.flush()  # Persist user before role assignment (FK user_id -> users.id)
        self._ensure_role_assignment(uid, "PLACEMENT_TEAM",
                         institution_id=self._context["institution_id"])
        self.db.flush()
        self._context["pt_id"] = uid
        self.record("users", uid)
        return uid

    def _create_cycle(self):
        cid = self.uid("cycle")
        self.db.add(models.Cycle(
            id=cid, name="Final Placement 2025-26", type="FINAL",
            category="CURRENT", status="DRAFT",
            start_date=datetime.datetime.utcnow(),
            end_date=datetime.datetime.utcnow() + datetime.timedelta(days=120),
        ))
        self.db.flush()
        self._context["cycle_id"] = cid
        self._context["transitions"] = ["DRAFT"]
        self.record("cycles", cid)
        return cid

    def _open_applications(self):
        return self._transition("APPLICATIONS_OPEN")

    def _create_company_job(self):
        cid = self.uid("comp")
        self.db.add(models.Company(id=cid, name="CycleCorp", last_year_hires=12,
                                   cumulative_hires_3y=36, last_year_median_fixed=38.0))
        jid = self.uid("job")
        self.db.add(models.JobPosting(
            id=jid, company_id=cid, cycle_id=self._context["cycle_id"],
            title="Management Trainee", sector="General Management", slot="A1",
            fixed_comp=22.0, variable_comp=4.0, esops_vested=0,
            joining_bonus=0, performance_bonus=0, is_top_decile=False,
            opening_date=datetime.datetime.utcnow(), jd_status="Submitted",
        ))
        self.db.flush()
        self._context.update(company_id=cid, job_id=jid)
        self.record("companies", cid)
        self.record("jobs", jid)
        return jid

    def _create_workflow(self):
        wf_id = self.uid("wf")
        self.db.add(models.Workflow(
            id=wf_id, company_id=self._context["company_id"],
            job_id=self._context["job_id"],
            institution_id=self._context["institution_id"],
            name="CycleCorp Workflow", description="Cycle management test",
            created_by=self._context["pt_id"], status="ACTIVE",
        ))
        for snum, sname in enumerate(["Application", "GD Round", "Interview"], 1):
            self.db.add(models.WorkflowStage(
                id=self.uid(f"stg_{snum}"), workflow_id=wf_id, stage_number=snum,
                name=sname, stage_type="APPLICATION" if snum == 1 else "SHORTLIST",
                is_approval_required=False,
            ))
        self.db.flush()
        self._context["workflow_id"] = wf_id
        self.record("workflows", wf_id)
        return wf_id

    def _close_applications(self):
        return self._transition("APPLICATIONS_CLOSED")

    def _begin_offers(self):
        return self._transition("OFFERS_IN_PROGRESS")

    def _complete_cycle(self):
        return self._transition("COMPLETED")

    def _verify_lifecycle(self):
        c = self.db.query(models.Cycle).filter(
            models.Cycle.id == self._context["cycle_id"]
        ).first()
        assert c.status == "COMPLETED", f"Cycle status is {c.status}, expected COMPLETED"
        expected = ["DRAFT", "APPLICATIONS_OPEN", "APPLICATIONS_CLOSED",
                     "OFFERS_IN_PROGRESS", "COMPLETED"]
        assert self._context["transitions"] == expected, (
            f"Transition history: {self._context['transitions']}"
        )
        return self._context["cycle_id"]

    # -- helpers -------------------------------------------------------------

    def _transition(self, new_status):
        c = self.db.query(models.Cycle).filter(
            models.Cycle.id == self._context["cycle_id"]
        ).first()
        c.status = new_status
        self.db.flush()
        self._context["transitions"].append(new_status)
        return self._context["cycle_id"]

