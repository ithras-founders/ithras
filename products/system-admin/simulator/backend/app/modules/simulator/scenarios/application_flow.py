"""
ApplicationFlow scenario — full student application lifecycle.

Steps:
1. Create institution + program
2. Create company + job posting
3. Create placement-team user
4. Create student user + CV
5. Create cycle
6. Create workflow + stages (Application → Shortlist → Interview)
7. Submit application (student applies)
8. Progress to Shortlist stage
9. Progress to Interview stage
10. Create offer
11. Accept offer
"""

import datetime
import random
import uuid

from sqlalchemy import text

from app.modules.shared import models
from app.modules.shared.password import hash_password

from .base import BaseScenario


class ApplicationFlowScenario(BaseScenario):
    id = "application_flow"
    label = "Application Flow"
    description = (
        "End-to-end student application lifecycle: institution setup → student applies → "
        "progresses through stages → receives and accepts an offer."
    )
    category = "business"

    def define_steps(self):
        self.step("Create institution and program", self._create_institution)
        self.step("Create company and job posting", self._create_company_and_job)
        self.step("Create placement-team user", self._create_pt_user)
        self.step("Create student user", self._create_student)
        self.step("Create student CV", self._create_cv)
        self.step("Create placement cycle", self._create_cycle)
        self.step("Create workflow with stages", self._create_workflow)
        self.step("Submit application", self._submit_application)
        self.step("Progress to Shortlist", self._progress_to_shortlist)
        self.step("Progress to Interview", self._progress_to_interview)
        self.step("Create offer", self._create_offer)
        self.step("Accept offer", self._accept_offer)

    # -- step implementations ------------------------------------------------

    def _create_institution(self):
        iid = self.uid("inst")
        inst = models.Institution(id=iid, name="Sim Institute Alpha", tier="Tier 1", location="Mumbai")
        self.db.add(inst)
        pid = self.uid("prog")
        prog = models.Program(id=pid, institution_id=iid, name="MBA (Default)", code="DEFAULT")
        self.db.add(prog)
        self.db.flush()
        self._context["institution_id"] = iid
        self._context["program_id"] = pid
        self.record("institutions", iid)
        return iid

    def _create_company_and_job(self):
        cid = self.uid("comp")
        comp = models.Company(
            id=cid, name="TechCorp Sim",
            last_year_hires=10, cumulative_hires_3y=30, last_year_median_fixed=35.0,
        )
        self.db.add(comp)
        jid = self.uid("job")
        job = models.JobPosting(
            id=jid, company_id=cid, title="Software Engineer",
            sector="Technology", slot="A1",
            fixed_comp=30.0, variable_comp=5.0, esops_vested=0,
            joining_bonus=2.0, performance_bonus=3.0, is_top_decile=False,
            opening_date=datetime.datetime.utcnow(), jd_status="Submitted",
        )
        self.db.add(job)
        self.db.flush()
        self._context["company_id"] = cid
        self._context["job_id"] = jid
        self.record("companies", cid)
        self.record("jobs", jid)
        return cid

    def _create_pt_user(self):
        pw = hash_password("password")
        uid = self.uid("pt")
        u = models.User(
            id=uid, email=f"pt@{self.prefix}.test", name="PT User",
            role="PLACEMENT_TEAM", institution_id=self._context["institution_id"],
            password_hash=pw, sector_preferences=[],
        )
        self.db.add(u)
        self.db.flush()  # Persist user before role assignment (FK user_id -> users.id)
        self._ensure_role_assignment(uid, "PLACEMENT_TEAM",
                                     institution_id=self._context["institution_id"])
        self.db.flush()
        self._context["pt_user_id"] = uid
        self.record("users", uid)
        return uid

    def _create_student(self):
        pw = hash_password("password")
        uid = self.uid("stu")
        u = models.User(
            id=uid, email=f"student@{self.prefix}.test", name="Rahul Sharma",
            role="CANDIDATE", institution_id=self._context["institution_id"],
            program_id=self._context["program_id"],
            password_hash=pw, sector_preferences=[], roll_number="SIM0001",
        )
        self.db.add(u)
        self.db.flush()  # Persist user before role assignment (FK user_id -> users.id)
        self._ensure_role_assignment(uid, "CANDIDATE",
                                     institution_id=self._context["institution_id"],
                                     program_id=self._context["program_id"])
        self.db.flush()
        self._context["student_id"] = uid
        self.record("users", uid)
        return uid

    def _create_cv(self):
        self._ensure_cv_template()
        cv_id = self.uid("cv")
        cv = models.CV(
            id=cv_id, candidate_id=self._context["student_id"],
            template_id="iim_calcutta", data={}, status="SUBMITTED",
        )
        self.db.add(cv)
        self.db.flush()
        self._context["cv_id"] = cv_id
        self.record("cvs", cv_id)
        return cv_id

    def _create_cycle(self):
        cid = self.uid("cycle")
        c = models.Cycle(
            id=cid, name="Sim Final Placement 2025", type="FINAL",
            category="CURRENT", status="APPLICATIONS_OPEN",
            start_date=datetime.datetime.utcnow() - datetime.timedelta(days=30),
            end_date=datetime.datetime.utcnow() + datetime.timedelta(days=90),
        )
        self.db.add(c)
        self.db.flush()
        self._context["cycle_id"] = cid
        self.record("cycles", cid)
        return cid

    def _create_workflow(self):
        wf_id = self.uid("wf")
        wf = models.Workflow(
            id=wf_id,
            company_id=self._context["company_id"],
            job_id=self._context["job_id"],
            institution_id=self._context["institution_id"],
            name="TechCorp Application Workflow",
            description="Application → Shortlist → Interview",
            created_by=self._context["pt_user_id"],
            status="ACTIVE",
        )
        self.db.add(wf)
        stage_ids = []
        for snum, sname, stype in [
            (1, "Application", "APPLICATION"),
            (2, "Shortlist", "SHORTLIST"),
            (3, "Interview", "INTERVIEW"),
        ]:
            sid = self.uid(f"stage_{snum}")
            stage = models.WorkflowStage(
                id=sid, workflow_id=wf_id, stage_number=snum,
                name=sname, stage_type=stype, is_approval_required=False,
            )
            self.db.add(stage)
            stage_ids.append(sid)
        self.db.flush()
        self._context["workflow_id"] = wf_id
        self._context["stage_ids"] = stage_ids
        self.record("workflows", wf_id)
        return wf_id

    def _submit_application(self):
        app_id = self.uid("app")
        first_stage = self._context["stage_ids"][0]
        app = models.Application(
            id=app_id, student_id=self._context["student_id"],
            job_id=self._context["job_id"], workflow_id=self._context["workflow_id"],
            cv_id=self._context["cv_id"], current_stage_id=first_stage,
            status="SUBMITTED",
        )
        self.db.add(app)
        prog_id = self.uid("asp_1")
        asp = models.ApplicationStageProgress(
            id=prog_id, application_id=app_id, stage_id=first_stage, status="IN_PROGRESS",
        )
        self.db.add(asp)
        self.db.flush()
        self._context["application_id"] = app_id
        self.record("applications", app_id)
        return app_id

    def _progress_to_shortlist(self):
        return self._progress_to_stage(1, "Shortlist")

    def _progress_to_interview(self):
        return self._progress_to_stage(2, "Interview")

    def _create_offer(self):
        oid = self.uid("offer")
        offer = models.Offer(
            id=oid,
            application_id=self._context["application_id"],
            candidate_id=self._context["student_id"],
            company_id=self._context["company_id"],
            job_id=self._context["job_id"],
            status="PENDING", ctc=35.0,
            deadline=datetime.datetime.utcnow() + datetime.timedelta(days=7),
        )
        self.db.add(offer)
        self.db.flush()
        self._context["offer_id"] = oid
        self.record("offers", oid)
        return oid

    def _accept_offer(self):
        oid = self._context["offer_id"]
        offer = self.db.query(models.Offer).filter(models.Offer.id == oid).first()
        offer.status = "ACCEPTED"
        offer.responded_at = datetime.datetime.utcnow()
        app = self.db.query(models.Application).filter(
            models.Application.id == self._context["application_id"]
        ).first()
        app.status = "SELECTED"
        self.db.flush()
        return oid

    # -- helpers -------------------------------------------------------------

    def _progress_to_stage(self, stage_index: int, label: str):
        app_id = self._context["application_id"]
        stage_ids = self._context["stage_ids"]
        prev_stage = stage_ids[stage_index - 1]
        next_stage = stage_ids[stage_index]

        prev_prog = (
            self.db.query(models.ApplicationStageProgress)
            .filter_by(application_id=app_id, stage_id=prev_stage)
            .first()
        )
        if prev_prog:
            prev_prog.status = "PASSED"

        prog_id = self.uid(f"asp_{stage_index + 1}")
        asp = models.ApplicationStageProgress(
            id=prog_id, application_id=app_id, stage_id=next_stage,
            status="IN_PROGRESS", moved_by=self._context["pt_user_id"],
        )
        self.db.add(asp)

        app = self.db.query(models.Application).filter(models.Application.id == app_id).first()
        app.current_stage_id = next_stage
        self.db.flush()
        return prog_id

