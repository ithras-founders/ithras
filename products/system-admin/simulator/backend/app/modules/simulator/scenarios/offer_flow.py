"""
OfferFlow scenario — offer lifecycle with accept, reject, and withdraw paths.

Steps:
1. Seed institution, company, job, student, workflow, application
2. Create offer A → accept it
3. Create offer B → reject it
4. Create offer C → withdraw it (recruiter side)
5. Verify final statuses
"""

import datetime

from sqlalchemy import text

from app.modules.shared import models
from app.modules.shared.password import hash_password

from .base import BaseScenario


class OfferFlowScenario(BaseScenario):
    id = "offer_flow"
    label = "Offer Flow"
    description = (
        "Create three offers and exercise the three outcome paths: "
        "accept, reject, and recruiter-withdraw."
    )
    category = "business"

    def define_steps(self):
        self.step("Seed institution, company, users", self._seed_base)
        self.step("Create workflow and 3 applications", self._create_apps)
        self.step("Create Offer A (will be accepted)", self._create_offer_a)
        self.step("Accept Offer A", self._accept_offer_a)
        self.step("Create Offer B (will be rejected)", self._create_offer_b)
        self.step("Reject Offer B", self._reject_offer_b)
        self.step("Create Offer C (will be withdrawn)", self._create_offer_c)
        self.step("Withdraw Offer C", self._withdraw_offer_c)
        self.step("Verify final statuses", self._verify_statuses)

    def _seed_base(self):
        pw = hash_password("password")
        iid = self.uid("inst")
        self.db.add(models.Institution(id=iid, name="Offer Test School",
                                       tier="Tier 1", location="Chennai"))
        pid = self.uid("prog")
        self.db.add(models.Program(id=pid, institution_id=iid, name="MBA", code="MBA"))

        cid = self.uid("comp")
        self.db.add(models.Company(id=cid, name="OfferCorp", last_year_hires=6,
                                   cumulative_hires_3y=18, last_year_median_fixed=32.0))

        jid = self.uid("job")
        self.db.add(models.JobPosting(
            id=jid, company_id=cid, title="PM Role", sector="Technology", slot="A1",
            fixed_comp=30.0, variable_comp=5.0, esops_vested=0,
            joining_bonus=0, performance_bonus=0, is_top_decile=False,
            opening_date=datetime.datetime.utcnow(), jd_status="Submitted",
        ))

        pt_id = self.uid("pt")
        self.db.add(models.User(id=pt_id, email=f"pt@{self.prefix}.test", name="PT",
                                role="PLACEMENT_TEAM", institution_id=iid,
                                password_hash=pw, sector_preferences=[]))
        self.db.flush()  # Persist user before role assignment (FK user_id -> users.id)
        self._ensure_role_assignment(pt_id, "PLACEMENT_TEAM", institution_id=iid)

        students = []
        self._ensure_cv_template(iid)
        for i in range(3):
            sid = self.uid(f"stu_{i}")
            self.db.add(models.User(
                id=sid, email=f"stu{i}@{self.prefix}.test",
                name=f"Student {i}", role="CANDIDATE",
                institution_id=iid, program_id=pid,
                password_hash=pw, sector_preferences=[], roll_number=f"OFR{i:03d}",
            ))
            self.db.flush()  # Persist user before role assignment (FK user_id -> users.id)
            self._ensure_role_assignment(sid, "CANDIDATE", institution_id=iid, program_id=pid)
            cv_id = self.uid(f"cv_{i}")
            self.db.add(models.CV(id=cv_id, candidate_id=sid, template_id="iim_calcutta",
                                  data={}, status="SUBMITTED"))
            students.append({"id": sid, "cv_id": cv_id})

        cyc_id = self.uid("cycle")
        self.db.add(models.Cycle(
            id=cyc_id, name="Offer Cycle", type="FINAL", category="CURRENT",
            status="APPLICATIONS_OPEN",
            start_date=datetime.datetime.utcnow() - datetime.timedelta(days=10),
            end_date=datetime.datetime.utcnow() + datetime.timedelta(days=30),
        ))

        self.db.flush()
        self._context.update(
            institution_id=iid, company_id=cid, job_id=jid,
            pt_id=pt_id, students=students, cycle_id=cyc_id,
        )
        self.record("institutions", iid)
        self.record("companies", cid)
        self.record("jobs", jid)
        return iid

    def _create_apps(self):
        wf_id = self.uid("wf")
        self.db.add(models.Workflow(
            id=wf_id, company_id=self._context["company_id"],
            job_id=self._context["job_id"],
            institution_id=self._context["institution_id"],
            name="Offer Workflow", description="Testing offers",
            created_by=self._context["pt_id"], status="ACTIVE",
        ))
        sid = self.uid("stg_1")
        self.db.add(models.WorkflowStage(
            id=sid, workflow_id=wf_id, stage_number=1,
            name="Application", stage_type="APPLICATION", is_approval_required=False,
        ))
        self.db.flush()

        app_ids = []
        for i, stu in enumerate(self._context["students"]):
            aid = self.uid(f"app_{i}")
            self.db.add(models.Application(
                id=aid, student_id=stu["id"], job_id=self._context["job_id"],
                workflow_id=wf_id, cv_id=stu["cv_id"],
                current_stage_id=sid, status="SUBMITTED",
            ))
            app_ids.append(aid)
            self.record("applications", aid)
        self.db.flush()
        self._context.update(workflow_id=wf_id, app_ids=app_ids)
        return wf_id

    def _create_offer_a(self):
        return self._create_offer(0, "offer_a")

    def _accept_offer_a(self):
        return self._update_offer("offer_a", "ACCEPTED")

    def _create_offer_b(self):
        return self._create_offer(1, "offer_b")

    def _reject_offer_b(self):
        return self._update_offer("offer_b", "REJECTED")

    def _create_offer_c(self):
        return self._create_offer(2, "offer_c")

    def _withdraw_offer_c(self):
        return self._update_offer("offer_c", "WITHDRAWN")

    def _verify_statuses(self):
        for key, expected in [("offer_a", "ACCEPTED"), ("offer_b", "REJECTED"),
                               ("offer_c", "WITHDRAWN")]:
            oid = self._context[key]
            o = self.db.query(models.Offer).filter(models.Offer.id == oid).first()
            assert o.status == expected, f"{key} status is {o.status}, expected {expected}"
        return "all_verified"

    # -- helpers -------------------------------------------------------------

    def _create_offer(self, student_idx, key):
        oid = self.uid(key)
        stu = self._context["students"][student_idx]
        self.db.add(models.Offer(
            id=oid, application_id=self._context["app_ids"][student_idx],
            candidate_id=stu["id"], company_id=self._context["company_id"],
            job_id=self._context["job_id"], status="PENDING", ctc=30.0 + student_idx * 5,
            deadline=datetime.datetime.utcnow() + datetime.timedelta(days=7),
        ))
        self.db.flush()
        self._context[key] = oid
        self.record("offers", oid)
        return oid

    def _update_offer(self, key, status):
        oid = self._context[key]
        o = self.db.query(models.Offer).filter(models.Offer.id == oid).first()
        o.status = status
        o.responded_at = datetime.datetime.utcnow()
        self.db.flush()
        return oid

