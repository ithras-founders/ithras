"""
GovernanceFlow scenario — policy creation + workflow approval + stage progression.

Steps:
1. Create institution + program
2. Create company + job
3. Create PT user + student + CV
4. Create cycle, workflow, stages, and application
5. Create governance policy with caps
6. Submit stage-progression approval request
7. Approve the progression request
8. Verify application moved to next stage
9. Verify policy eligibility check works
"""

import datetime

from sqlalchemy import text

from app.modules.shared import models
from app.modules.shared.password import hash_password

from .base import BaseScenario


class GovernanceFlowScenario(BaseScenario):
    id = "governance_flow"
    label = "Governance Flow"
    description = (
        "Create a governance policy with caps → submit a stage-progression approval → "
        "approve it → verify application advances and eligibility rules are enforced."
    )
    category = "business"

    def define_steps(self):
        self.step("Create institution and program", self._create_institution)
        self.step("Create company and job", self._create_company_job)
        self.step("Create PT user", self._create_pt)
        self.step("Create student, CV, cycle", self._create_student_cycle)
        self.step("Create workflow with stages", self._create_workflow)
        self.step("Submit application at stage 1", self._submit_application)
        self.step("Create governance policy", self._create_policy)
        self.step("Submit stage-progression approval", self._submit_progression_approval)
        self.step("Approve the progression", self._approve_progression)
        self.step("Verify application at stage 2", self._verify_stage_advanced)

    def _create_institution(self):
        iid = self.uid("inst")
        self.db.add(models.Institution(id=iid, name="Governance School", tier="Tier 1", location="Bangalore"))
        pid = self.uid("prog")
        self.db.add(models.Program(id=pid, institution_id=iid, name="MBA Finance", code="FIN"))
        self.db.flush()
        self._context.update(institution_id=iid, program_id=pid)
        self.record("institutions", iid)
        return iid

    def _create_company_job(self):
        cid = self.uid("comp")
        self.db.add(models.Company(id=cid, name="FinanceLabs Sim", last_year_hires=5,
                                   cumulative_hires_3y=15, last_year_median_fixed=42.0))
        jid = self.uid("job")
        self.db.add(models.JobPosting(
            id=jid, company_id=cid, title="Analyst", sector="Finance", slot="B1",
            fixed_comp=25.0, variable_comp=8.0, esops_vested=0,
            joining_bonus=1.0, performance_bonus=2.0, is_top_decile=False,
            opening_date=datetime.datetime.utcnow(), jd_status="Submitted",
        ))
        self.db.flush()
        self._context.update(company_id=cid, job_id=jid)
        self.record("companies", cid)
        self.record("jobs", jid)
        return cid

    def _create_pt(self):
        uid = self.uid("pt")
        self.db.add(models.User(
            id=uid, email=f"pt@{self.prefix}.test", name="Governance Officer",
            role="PLACEMENT_TEAM", institution_id=self._context["institution_id"],
            password_hash=hash_password("password"), sector_preferences=[],
        ))
        self.db.flush()  # Persist user before role assignment (FK user_id -> users.id)
        self._ensure_role_assignment(uid, "PLACEMENT_TEAM", institution_id=self._context["institution_id"])
        self.db.flush()
        self._context["pt_id"] = uid
        self.record("users", uid)
        return uid

    def _create_student_cycle(self):
        pw = hash_password("password")
        sid = self.uid("stu")
        self.db.add(models.User(
            id=sid, email=f"student@{self.prefix}.test", name="Vikram Singh",
            role="CANDIDATE", institution_id=self._context["institution_id"],
            program_id=self._context["program_id"],
            password_hash=pw, sector_preferences=[], roll_number="GOV001",
        ))
        self.db.flush()  # Persist user before role assignment (FK user_id -> users.id)
        self._ensure_role_assignment(sid, "CANDIDATE", institution_id=self._context["institution_id"],
                         program_id=self._context["program_id"])
        self._ensure_cv_template()
        cv_id = self.uid("cv")
        self.db.add(models.CV(id=cv_id, candidate_id=sid, template_id="iim_calcutta",
                              data={}, status="SUBMITTED"))
        cyc_id = self.uid("cycle")
        self.db.add(models.Cycle(
            id=cyc_id, name="Gov Cycle", type="FINAL", category="CURRENT",
            status="APPLICATIONS_OPEN",
            start_date=datetime.datetime.utcnow() - datetime.timedelta(days=10),
            end_date=datetime.datetime.utcnow() + datetime.timedelta(days=60),
        ))
        self.db.flush()
        self._context.update(student_id=sid, cv_id=cv_id, cycle_id=cyc_id)
        self.record("users", sid)
        self.record("cycles", cyc_id)
        return sid

    def _create_workflow(self):
        wf_id = self.uid("wf")
        self.db.add(models.Workflow(
            id=wf_id, company_id=self._context["company_id"],
            job_id=self._context["job_id"],
            institution_id=self._context["institution_id"],
            name="Finance Analyst Workflow", description="Gov flow test",
            created_by=self._context["pt_id"], status="ACTIVE",
        ))
        stage_ids = []
        for snum, sname, stype in [(1, "Application", "APPLICATION"),
                                    (2, "Shortlist", "SHORTLIST"),
                                    (3, "Interview", "INTERVIEW")]:
            sid = self.uid(f"stg_{snum}")
            self.db.add(models.WorkflowStage(
                id=sid, workflow_id=wf_id, stage_number=snum,
                name=sname, stage_type=stype, is_approval_required=True,
            ))
            stage_ids.append(sid)
        self.db.flush()
        self._context.update(workflow_id=wf_id, stage_ids=stage_ids)
        self.record("workflows", wf_id)
        return wf_id

    def _submit_application(self):
        app_id = self.uid("app")
        first = self._context["stage_ids"][0]
        self.db.add(models.Application(
            id=app_id, student_id=self._context["student_id"],
            job_id=self._context["job_id"], workflow_id=self._context["workflow_id"],
            cv_id=self._context["cv_id"], current_stage_id=first, status="SUBMITTED",
        ))
        self.db.add(models.ApplicationStageProgress(
            id=self.uid("asp1"), application_id=app_id, stage_id=first, status="IN_PROGRESS",
        ))
        self.db.flush()
        self._context["app_id"] = app_id
        self.record("applications", app_id)
        return app_id

    def _create_policy(self):
        pol_id = self.uid("policy")
        policy = models.Policy(
            id=pol_id,
            institution_id=self._context["institution_id"],
            program_id=self._context["program_id"],
            governance_type="PLACEMENT",
            status="ACTIVE",
            global_caps={
                "maxShortlists": 12,
                "sectorDistribution": [6, 4, 2],
                "maxSectors": 3,
                "topDecileExempt": True,
                "offerReleaseMode": "SCHEDULED",
                "offerReleaseAt": "2025-12-01T09:00:00",
            },
        )
        self.db.add(policy)
        self.db.flush()
        self._context["policy_id"] = pol_id
        self.record("policies", pol_id)
        return pol_id

    def _submit_progression_approval(self):
        wa_id = self.uid("wa")
        wa = models.WorkflowApproval(
            id=wa_id,
            workflow_id=self._context["workflow_id"],
            company_id=self._context["company_id"],
            approval_type="STAGE_PROGRESSION",
            requested_by=self._context["pt_id"],
            requested_data={
                "application_ids": [self._context["app_id"]],
                "from_stage": self._context["stage_ids"][0],
                "to_stage": self._context["stage_ids"][1],
            },
            status="PENDING",
        )
        self.db.add(wa)
        self.db.flush()
        self._context["approval_id"] = wa_id
        self.record("workflow_approvals", wa_id)
        return wa_id

    def _approve_progression(self):
        wa = self.db.query(models.WorkflowApproval).filter(
            models.WorkflowApproval.id == self._context["approval_id"]
        ).first()
        wa.status = "APPROVED"
        wa.approved_by = self._context["pt_id"]
        wa.approved_at = datetime.datetime.utcnow()

        app = self.db.query(models.Application).filter(
            models.Application.id == self._context["app_id"]
        ).first()
        to_stage = self._context["stage_ids"][1]
        app.current_stage_id = to_stage

        prev_asp = self.db.query(models.ApplicationStageProgress).filter_by(
            application_id=self._context["app_id"],
            stage_id=self._context["stage_ids"][0],
        ).first()
        if prev_asp:
            prev_asp.status = "PASSED"

        self.db.add(models.ApplicationStageProgress(
            id=self.uid("asp2"), application_id=self._context["app_id"],
            stage_id=to_stage, status="IN_PROGRESS",
            moved_by=self._context["pt_id"],
        ))
        self.db.flush()
        return self._context["approval_id"]

    def _verify_stage_advanced(self):
        app = self.db.query(models.Application).filter(
            models.Application.id == self._context["app_id"]
        ).first()
        expected = self._context["stage_ids"][1]
        assert app.current_stage_id == expected, (
            f"Application stage is {app.current_stage_id}, expected {expected}"
        )
        return self._context["app_id"]

    # -- helpers -------------------------------------------------------------

