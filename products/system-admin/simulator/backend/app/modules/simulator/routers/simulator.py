"""
Simulator API - generates random students, colleges, cycles, companies, applications for testing.
All created users have password 'password' and can log in.
"""
import random
import uuid
import datetime
import sys
import os

# Ensure core backend is importable
_core_backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../../../../../core/backend'))
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from app.modules.shared import models, database
from app.modules.shared.password import hash_password
from app.modules.shared.audit import log_audit

from ..scenarios import SCENARIOS, ScenarioRunner

router = APIRouter(prefix="/api/v1/simulator", tags=["simulator"])

_runner = ScenarioRunner(SCENARIOS)


class RunScenarioRequest(BaseModel):
    scenario_id: str
    options: dict = {}

# Static data for random generation
COLLEGE_NAMES = ["Sim College Alpha", "Sim College Beta", "Sim College Gamma", "Sim Institute North", "Sim Institute South"]
COMPANY_NAMES = ["TechCorp Sim", "Consulting Inc Sim", "Finance Labs Sim", "Retail Pro Sim", "HealthCo Sim"]
STUDENT_FIRST = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rohan", "Kavya", "Arjun", "Divya"]
STUDENT_LAST = ["Sharma", "Patel", "Kumar", "Reddy", "Singh", "Nair", "Menon", "Iyer", "Rao", "Pillai"]
LOCATIONS = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune"]


class SimulatorGenerateRequest(BaseModel):
    num_colleges: int = 3
    num_students_per_college: int = 10
    num_companies: int = 3
    num_recruiters_per_company: int = 1
    num_placement_team_per_college: int = 1
    num_cycles: int = 1
    num_jobs_per_company: int = 2
    max_applications_per_student: int = 3


def _ensure_cv_template(db: Session, template_id: str = "iim_calcutta") -> None:
    """Ensure CV template exists in cv_templates table. Does not commit - caller's transaction applies."""
    from app.modules.shared.cv_template_utils import ensure_cv_template
    ensure_cv_template(db, template_id=template_id)


@router.get("/scenarios")
def list_scenarios():
    """List available simulator scenarios."""
    return _runner.list_scenarios()


@router.post("/run-scenario")
def run_scenario(
    req: RunScenarioRequest,
    db: Session = Depends(database.get_db),
):
    """Execute a simulator scenario and return step-by-step results."""
    try:
        result = _runner.run(req.scenario_id, db, req.options)
        db.commit()
        return result.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Scenario failed: {e}")


@router.post("/generate")
def generate_simulator_data(
    req: SimulatorGenerateRequest = SimulatorGenerateRequest(),
    db: Session = Depends(database.get_db),
):
    """Generate random colleges, students, companies, cycles, jobs, workflows, and applications."""
    if req.num_colleges < 1 or req.num_companies < 1:
        raise HTTPException(status_code=400, detail="Need at least 1 college and 1 company")

    pw_hash = hash_password("password")
    prefix = f"sim_{uuid.uuid4().hex[:8]}"
    created = {"institutions": [], "companies": [], "users": [], "cycles": [], "applications": []}

    # 1. Create institutions and programs
    institutions = []
    for i in range(req.num_colleges):
        inst_id = f"{prefix}_inst_{i}"
        name = COLLEGE_NAMES[i % len(COLLEGE_NAMES)] + f" {i}"
        loc = LOCATIONS[i % len(LOCATIONS)]
        existing = db.query(models.Institution).filter(models.Institution.id == inst_id).first()
        if not existing:
            inst = models.Institution(id=inst_id, name=name, tier="Tier 1", location=loc)
            db.add(inst)
        institutions.append({"id": inst_id, "name": name})
        prog_id = f"{inst_id}_default"
        prog_exists = db.query(models.Program).filter(models.Program.id == prog_id).first()
        if not prog_exists:
            prog = models.Program(
                id=prog_id,
                institution_id=inst_id,
                name=f"{name} (Default)",
                code="DEFAULT",
            )
            db.add(prog)
    created["institutions"] = institutions

    # 2. Create companies
    companies = []
    for i in range(req.num_companies):
        comp_id = f"{prefix}_comp_{i}"
        name = COMPANY_NAMES[i % len(COMPANY_NAMES)] + f" {i}"
        existing = db.query(models.Company).filter(models.Company.id == comp_id).first()
        if not existing:
            comp = models.Company(
                id=comp_id,
                name=name,
                last_year_hires=random.randint(5, 20),
                cumulative_hires_3y=random.randint(15, 60),
                last_year_median_fixed=random.uniform(25, 45),
            )
            db.add(comp)
            companies.append({"id": comp_id, "name": name})
    created["companies"] = companies

    # 3. Create placement team users
    pt_users = []
    for inst in institutions:
        inst_id = inst["id"]
        for j in range(req.num_placement_team_per_college):
            uid = f"{prefix}_pt_{inst_id}_{j}"
            email = f"pt{j}@sim_{inst_id}.test"
            existing = db.query(models.User).filter(models.User.id == uid).first()
            if not existing:
                u = models.User(
                    id=uid,
                    email=email,
                    name=f"Placement Team {inst_id} #{j}",
                    role="PLACEMENT_TEAM",
                    institution_id=inst_id,
                    program_id=None,
                    company_id=None,
                    sector_preferences=[],
                    password_hash=pw_hash,
                )
                db.add(u)
                pt_users.append({"id": uid, "email": email, "role": "PLACEMENT_TEAM", "institution_id": inst_id})
    created["users"].extend(pt_users)

    # 4. Create student users
    students = []
    for inst in institutions:
        inst_id = inst["id"]
        prog_id = f"{inst_id}_default"
        for j in range(req.num_students_per_college):
            uid = f"{prefix}_stu_{inst_id}_{j}"
            fname = STUDENT_FIRST[(hash(inst_id) + j) % len(STUDENT_FIRST)]
            lname = STUDENT_LAST[(hash(inst_id) + j + 1) % len(STUDENT_LAST)]
            email = f"student{j}@sim_{inst_id}.test"
            existing = db.query(models.User).filter(models.User.id == uid).first()
            if not existing:
                u = models.User(
                    id=uid,
                    email=email,
                    name=f"{fname} {lname}",
                    role="CANDIDATE",
                    institution_id=inst_id,
                    program_id=prog_id,
                    company_id=None,
                    sector_preferences=[],
                    roll_number=f"SIM{j:04d}",
                    password_hash=pw_hash,
                )
                db.add(u)
                students.append({"id": uid, "email": email, "role": "CANDIDATE", "institution_id": inst_id})
    created["users"].extend(students)

    # 5. Create recruiter users
    for comp in companies:
        comp_id = comp["id"]
        for j in range(req.num_recruiters_per_company):
            uid = f"{prefix}_rec_{comp_id}_{j}"
            email = f"recruiter{j}@sim_{comp_id}.test"
            existing = db.query(models.User).filter(models.User.id == uid).first()
            if not existing:
                u = models.User(
                    id=uid,
                    email=email,
                    name=f"Recruiter {comp['name']} #{j}",
                    role="RECRUITER",
                    institution_id=None,
                    program_id=None,
                    company_id=comp_id,
                    sector_preferences=[],
                    password_hash=pw_hash,
                )
                db.add(u)
                created["users"].append({"id": uid, "email": email, "role": "RECRUITER", "company_id": comp_id})
    db.flush()

    # 6. Create UserRoleAssignments for login
    all_users = pt_users + students + [u for u in created["users"] if u.get("role") == "RECRUITER"]
    for u in all_users:
        uid = u["id"]
        role_id = u["role"]
        assignment_id = f"{prefix}_ura_{uid}_{role_id}"
        exists = db.execute(text("SELECT 1 FROM user_role_assignments WHERE id = :id"), {"id": assignment_id}).fetchone()
        if not exists:
            role_exists = db.execute(text("SELECT 1 FROM roles WHERE id = :id"), {"id": role_id}).fetchone()
            if role_exists:
                prog_id = None
                if role_id == "CANDIDATE" and u.get("institution_id"):
                    prog_id = f"{u['institution_id']}_default"
                db.execute(
                    text("""
                        INSERT INTO user_role_assignments (id, user_id, role_id, institution_id, company_id, program_id, granted_at, is_active)
                        VALUES (:id, :uid, :rid, :iid, :cid, :pid, NOW(), true)
                    """),
                    {
                        "id": assignment_id,
                        "uid": uid,
                        "rid": role_id,
                        "iid": u.get("institution_id"),
                        "cid": u.get("company_id"),
                        "pid": prog_id,
                    },
                )

    # 7. Create cycles
    cycles = []
    for i in range(req.num_cycles):
        cid = f"{prefix}_cycle_{i}"
        existing = db.query(models.Cycle).filter(models.Cycle.id == cid).first()
        if not existing:
            start = datetime.datetime.utcnow() - datetime.timedelta(days=30)
            end = datetime.datetime.utcnow() + datetime.timedelta(days=90)
            c = models.Cycle(
                id=cid,
                name=f"Sim Cycle {i}",
                type=random.choice(["FINAL", "SUMMER"]),
                category="CURRENT",
                status="APPLICATIONS_OPEN",
                start_date=start,
                end_date=end,
            )
            db.add(c)
            cycles.append({"id": cid})
    created["cycles"] = cycles

    # 8. Create jobs
    jobs = []
    for comp in companies:
        comp_id = comp["id"]
        for j in range(req.num_jobs_per_company):
            jid = f"{prefix}_job_{comp_id}_{j}"
            existing = db.query(models.JobPosting).filter(models.JobPosting.id == jid).first()
            if not existing:
                job = models.JobPosting(
                    id=jid,
                    company_id=comp_id,
                    title=f"Role {j} at {comp['name']}",
                    sector=random.choice(["Consulting", "Technology", "Finance", "General Management"]),
                    slot="SIM",
                    fixed_comp=random.uniform(20, 50),
                    variable_comp=random.uniform(0, 15),
                    esops_vested=0,
                    joining_bonus=0,
                    performance_bonus=0,
                    is_top_decile=random.choice([True, False]),
                    opening_date=datetime.datetime.utcnow(),
                    jd_status="Submitted",
                )
                db.add(job)
                jobs.append({"id": jid, "company_id": comp_id})
    db.flush()

    # 9. Ensure CV template exists
    _ensure_cv_template(db, "iim_calcutta")

    # 10. Create workflows (company + job + institution) with stages, set ACTIVE
    workflows = []
    for inst in institutions:
        inst_id = inst["id"]
        pt = next((p for p in pt_users if p.get("institution_id") == inst_id), None)
        if not pt:
            continue
        for job in jobs[:3]:  # Limit workflows per institution
            wf_id = f"{prefix}_wf_{inst_id}_{job['id']}"
            existing_wf = db.query(models.Workflow).filter(models.Workflow.id == wf_id).first()
            if not existing_wf:
                wf = models.Workflow(
                    id=wf_id,
                    company_id=job["company_id"],
                    job_id=job["id"],
                    institution_id=inst_id,
                    name=f"Workflow {job['id']} @ {inst_id}",
                    description="Sim workflow",
                    created_by=pt["id"],
                    status="ACTIVE",
                )
                db.add(wf)
                # Add stages
                for snum, sname in enumerate(["Application", "Shortlist", "Interview"], 1):
                    stage_id = f"{wf_id}_stage_{snum}"
                    stage = models.WorkflowStage(
                        id=stage_id,
                        workflow_id=wf_id,
                        stage_number=snum,
                        name=sname,
                        stage_type="APPLICATION" if snum == 1 else "SHORTLIST",
                        is_approval_required=False,
                    )
                    db.add(stage)
                workflows.append({"id": wf_id, "institution_id": inst_id})
    db.flush()

    # 11. Create CVs for students
    student_cvs = {}
    template_id = "iim_calcutta"
    for stu in students:
        cv_id = f"{prefix}_cv_{stu['id']}"
        existing_cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
        if not existing_cv:
            cv = models.CV(
                id=cv_id,
                candidate_id=stu["id"],
                template_id=template_id,
                data={},
                status="SUBMITTED",
            )
            db.add(cv)
            student_cvs[stu["id"]] = cv_id
    db.flush()

    # 12. Create applications (random subset)
    app_count = 0
    for stu in students:
        cvid = student_cvs.get(stu["id"])
        if not cvid:
            continue
        stu_workflows = [w for w in workflows if w["institution_id"] == stu["institution_id"]]
        n_apps = min(req.max_applications_per_student, random.randint(0, len(stu_workflows)) if stu_workflows else 0)
        for wf in random.sample(stu_workflows, min(n_apps, len(stu_workflows))):
            app_id = f"{prefix}_app_{stu['id']}_{wf['id']}"
            exists = db.query(models.Application).filter(models.Application.id == app_id).first()
            if not exists:
                first_stage = (
                    db.query(models.WorkflowStage)
                    .filter(models.WorkflowStage.workflow_id == wf["id"])
                    .order_by(models.WorkflowStage.stage_number)
                    .first()
                )
                w = db.query(models.Workflow).filter(models.Workflow.id == wf["id"]).first()
                job_id = w.job_id if w else None
                app = models.Application(
                    id=app_id,
                    student_id=stu["id"],
                    workflow_id=wf["id"],
                    cv_id=cvid,
                    job_id=job_id,
                    current_stage_id=first_stage.id if first_stage else None,
                    status="SUBMITTED",
                )
                db.add(app)
                if first_stage:
                    prog_id = f"{prefix}_prog_{app_id}"
                    prog = models.ApplicationStageProgress(
                        id=prog_id,
                        application_id=app_id,
                        stage_id=first_stage.id,
                        status="PENDING",
                    )
                    db.add(prog)
                app_count += 1
                created["applications"].append({"id": app_id})
    db.commit()

    return {
        "message": "Simulator data generated successfully",
        "password": "password",
        "users": [{"email": u["email"], "role": u["role"]} for u in created["users"]],
        "institutions": created["institutions"],
        "companies": created["companies"],
        "cycles": created["cycles"],
        "created_count": {
            "institutions": len(institutions),
            "companies": len(companies),
            "users": len(created["users"]),
            "cycles": len(cycles),
            "applications": app_count,
        },
    }
