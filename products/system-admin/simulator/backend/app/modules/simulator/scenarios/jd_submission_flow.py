"""
JDSubmissionFlow scenario — recruiter submits a JD, placement team approves it.

Steps:
1. Create institution + program
2. Create company
3. Create placement-team user
4. Create recruiter user
5. Create cycle
6. Create draft workflow
7. Recruiter submits JD (creates JDSubmission)
8. PT approves JD (creates JobPosting, activates workflow)
9. Verify job posting exists and workflow is ACTIVE
"""

import datetime

from sqlalchemy import text

from app.modules.shared import models
from app.modules.shared.password import hash_password

from .base import BaseScenario


class JDSubmissionFlowScenario(BaseScenario):
    id = "jd_submission_flow"
    label = "JD Submission Flow"
    description = (
        "Recruiter submits a Job Description → placement team reviews and approves → "
        "job posting goes live and workflow becomes ACTIVE."
    )
    category = "business"

    def define_steps(self):
        self.step("Create institution and program", self._create_institution)
        self.step("Create company", self._create_company)
        self.step("Create placement-team user", self._create_pt_user)
        self.step("Create recruiter user", self._create_recruiter)
        self.step("Create placement cycle", self._create_cycle)
        self.step("Create draft workflow", self._create_draft_workflow)
        self.step("Recruiter submits JD", self._submit_jd)
        self.step("PT approves JD submission", self._approve_jd)
        self.step("Verify job posting created", self._verify_job)
        self.step("Verify workflow is ACTIVE", self._verify_workflow_active)

    def _create_institution(self):
        iid = self.uid("inst")
        inst = models.Institution(id=iid, name="Sim Business School", tier="Tier 1", location="Delhi")
        self.db.add(inst)
        pid = self.uid("prog")
        prog = models.Program(id=pid, institution_id=iid, name="MBA General", code="MBA")
        self.db.add(prog)
        self.db.flush()
        self._context["institution_id"] = iid
        self._context["program_id"] = pid
        self.record("institutions", iid)
        return iid

    def _create_company(self):
        cid = self.uid("comp")
        comp = models.Company(
            id=cid, name="Consulting Inc Sim",
            last_year_hires=8, cumulative_hires_3y=22, last_year_median_fixed=40.0,
        )
        self.db.add(comp)
        self.db.flush()
        self._context["company_id"] = cid
        self.record("companies", cid)
        return cid

    def _create_pt_user(self):
        uid = self.uid("pt")
        u = models.User(
            id=uid, email=f"pt@{self.prefix}.test", name="Placement Officer",
            role="PLACEMENT_TEAM", institution_id=self._context["institution_id"],
            password_hash=hash_password("password"), sector_preferences=[],
        )
        self.db.add(u)
        self.db.flush()  # Persist user before role assignment (FK user_id -> users.id)
        self._ensure_role_assignment(uid, "PLACEMENT_TEAM",
                                     institution_id=self._context["institution_id"])
        self.db.flush()
        self._context["pt_user_id"] = uid
        self.record("users", uid)
        return uid

    def _create_recruiter(self):
        uid = self.uid("rec")
        u = models.User(
            id=uid, email=f"recruiter@{self.prefix}.test", name="Recruiter One",
            role="RECRUITER", company_id=self._context["company_id"],
            password_hash=hash_password("password"), sector_preferences=[],
        )
        self.db.add(u)
        self.db.flush()  # Persist user before role assignment (FK user_id -> users.id)
        self._ensure_role_assignment(uid, "RECRUITER",
                                     company_id=self._context["company_id"])
        self.db.flush()
        self._context["recruiter_id"] = uid
        self.record("users", uid)
        return uid

    def _create_cycle(self):
        cid = self.uid("cycle")
        c = models.Cycle(
            id=cid, name="Final Placement 2025", type="FINAL",
            category="CURRENT", status="APPLICATIONS_OPEN",
            start_date=datetime.datetime.utcnow() - datetime.timedelta(days=15),
            end_date=datetime.datetime.utcnow() + datetime.timedelta(days=60),
        )
        self.db.add(c)
        self.db.flush()
        self._context["cycle_id"] = cid
        self.record("cycles", cid)
        return cid

    def _create_draft_workflow(self):
        wf_id = self.uid("wf")
        wf = models.Workflow(
            id=wf_id,
            company_id=self._context["company_id"],
            institution_id=self._context["institution_id"],
            name="Consulting Inc Workflow",
            description="Pending JD approval",
            created_by=self._context["pt_user_id"],
            status="DRAFT",
        )
        self.db.add(wf)
        for snum, sname, stype in [
            (1, "Application Review", "APPLICATION"),
            (2, "Case Study Round", "SHORTLIST"),
            (3, "Final Interview", "INTERVIEW"),
        ]:
            sid = self.uid(f"stage_{snum}")
            stage = models.WorkflowStage(
                id=sid, workflow_id=wf_id, stage_number=snum,
                name=sname, stage_type=stype, is_approval_required=(snum > 1),
            )
            self.db.add(stage)
        self.db.flush()
        self._context["workflow_id"] = wf_id
        self.record("workflows", wf_id)
        return wf_id

    def _submit_jd(self):
        jd_id = self.uid("jd")
        jd = models.JDSubmission(
            id=jd_id,
            workflow_id=self._context["workflow_id"],
            company_id=self._context["company_id"],
            job_title="Associate Consultant",
            job_description="Strategy and operations consulting role for MBA graduates.",
            sector="Consulting", slot="A1",
            fixed_comp=28.0, variable_comp=6.0,
            esops_vested=0, joining_bonus=3.0, performance_bonus=4.0,
            is_top_decile=False,
        )
        self.db.add(jd)
        self.db.flush()
        self._context["jd_id"] = jd_id
        self.record("jd_submissions", jd_id)
        return jd_id

    def _approve_jd(self):
        jd = self.db.query(models.JDSubmission).filter(
            models.JDSubmission.id == self._context["jd_id"]
        ).first()
        jd.status = "APPROVED"
        jd.approved_at = datetime.datetime.utcnow()

        job_id = self.uid("job")
        job = models.JobPosting(
            id=job_id,
            company_id=jd.company_id,
            title=jd.job_title, sector=jd.sector, slot=jd.slot,
            fixed_comp=jd.fixed_comp, variable_comp=jd.variable_comp,
            esops_vested=jd.esops_vested, joining_bonus=jd.joining_bonus,
            performance_bonus=jd.performance_bonus, is_top_decile=jd.is_top_decile,
            opening_date=datetime.datetime.utcnow(), jd_status="Approved",
        )
        self.db.add(job)

        wf = self.db.query(models.Workflow).filter(
            models.Workflow.id == self._context["workflow_id"]
        ).first()
        wf.status = "ACTIVE"
        wf.job_id = job_id
        self.db.flush()
        self._context["job_id"] = job_id
        self.record("jobs", job_id)
        return job_id

    def _verify_job(self):
        job = self.db.query(models.JobPosting).filter(
            models.JobPosting.id == self._context["job_id"]
        ).first()
        assert job is not None, "Job posting was not created after JD approval"
        assert job.jd_status == "Approved", f"Job status is {job.jd_status}, expected Approved"
        return self._context["job_id"]

    def _verify_workflow_active(self):
        wf = self.db.query(models.Workflow).filter(
            models.Workflow.id == self._context["workflow_id"]
        ).first()
        assert wf.status == "ACTIVE", f"Workflow status is {wf.status}, expected ACTIVE"
        return self._context["workflow_id"]

