from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import datetime
from statistics import mean
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from .. import database, models
from ..auth import require_permission_with_subscription, require_role

router = APIRouter(prefix="/api/v1/shared/analytics", tags=["shared-analytics"])


class SimilarProfileBenchmarkRequest(BaseModel):
    target_role: Optional[str] = None
    target_function: Optional[str] = None
    target_company_id: Optional[str] = None
    program_id: Optional[str] = None
    batch_id: Optional[str] = None
    limit: int = 10


def _verified_and_profile_approved_user_ids(db: Session) -> set[str]:
    users = db.query(models.User.id).filter(models.User.is_verified.is_(True)).all()
    verified_ids = {u.id for u in users}
    blocked = {
        r.user_id
        for r in db.query(models.UserProfileChangeRequest.user_id)
        .filter(models.UserProfileChangeRequest.status != "APPROVED")
        .all()
    }
    return verified_ids - blocked


def _refresh_preaggregates(db: Session) -> None:
    valid_user_ids = _verified_and_profile_approved_user_ids(db)

    db.query(models.BenchmarkCohortOutcomeAgg).delete()
    db.query(models.BenchmarkRoleProgressionAgg).delete()
    db.query(models.BenchmarkTransitionAgg).delete()

    outcomes = (
        db.query(
            models.PlacementOutcome,
            models.User,
            models.Batch,
            models.Program,
            models.JobPosting,
        )
        .join(models.User, models.User.id == models.PlacementOutcome.student_id)
        .outerjoin(models.Batch, models.Batch.id == models.User.batch_id)
        .outerjoin(models.Program, models.Program.id == models.User.program_id)
        .outerjoin(models.JobPosting, models.JobPosting.id == models.PlacementOutcome.job_id)
        .order_by(models.PlacementOutcome.student_id, models.PlacementOutcome.created_at.asc())
        .all()
    )

    cohort_counter = defaultdict(int)
    cohort_ctc = defaultdict(list)
    progression_counter = defaultdict(int)
    progression_ctc = defaultdict(list)
    per_student = defaultdict(list)

    for outcome, user, batch, program, job in outcomes:
        if outcome.student_id not in valid_user_ids:
            continue
        institution_id = user.institution_id
        program_id = user.program_id or (program.id if program else None)
        batch_id = user.batch_id or (batch.id if batch else None)
        month = (outcome.created_at or datetime.utcnow()).strftime("%Y-%m")
        grad_year = batch.year if batch and batch.year else None
        role_name = (job.title if job and job.title else outcome.outcome_type) or "UNKNOWN"

        cohort_key = (institution_id, program_id, batch_id, month, outcome.outcome_type)
        cohort_counter[cohort_key] += 1
        if outcome.ctc and outcome.ctc > 0:
            cohort_ctc[cohort_key].append(outcome.ctc)

        prog_key = (institution_id, program_id, batch_id, grad_year, role_name)
        progression_counter[prog_key] += 1
        if outcome.ctc and outcome.ctc > 0:
            progression_ctc[prog_key].append(outcome.ctc)

        per_student[outcome.student_id].append((outcome, user, job))

    for (institution_id, program_id, batch_id, month, outcome_type), count in cohort_counter.items():
        vals = cohort_ctc[(institution_id, program_id, batch_id, month, outcome_type)]
        db.add(models.BenchmarkCohortOutcomeAgg(
            id=f"bc_{uuid.uuid4().hex}",
            institution_id=institution_id,
            program_id=program_id,
            batch_id=batch_id,
            month_bucket=month,
            outcome_type=outcome_type,
            outcome_count=count,
            avg_ctc=round(mean(vals), 2) if vals else None,
        ))

    for (institution_id, program_id, batch_id, grad_year, role_name), count in progression_counter.items():
        vals = progression_ctc[(institution_id, program_id, batch_id, grad_year, role_name)]
        db.add(models.BenchmarkRoleProgressionAgg(
            id=f"br_{uuid.uuid4().hex}",
            institution_id=institution_id,
            program_id=program_id,
            batch_id=batch_id,
            graduation_year=grad_year,
            role_name=role_name,
            trajectory_count=count,
            avg_ctc=round(mean(vals), 2) if vals else None,
        ))

    for student_id, path in per_student.items():
        path = sorted(path, key=lambda x: (x[0].created_at or datetime.utcnow()))
        for idx in range(len(path) - 1):
            current_outcome, user, current_job = path[idx]
            next_outcome, _, next_job = path[idx + 1]
            db.add(models.BenchmarkTransitionAgg(
                id=f"bt_{uuid.uuid4().hex}",
                institution_id=user.institution_id,
                program_id=user.program_id,
                batch_id=user.batch_id,
                from_company_id=current_outcome.company_id,
                to_company_id=next_outcome.company_id,
                from_business_unit_id=None,
                to_business_unit_id=None,
                from_designation_id=None,
                to_designation_id=None,
                from_role_name=(current_job.title if current_job and current_job.title else current_outcome.outcome_type),
                to_role_name=(next_job.title if next_job and next_job.title else next_outcome.outcome_type),
                transition_count=1,
            ))

    db.commit()


@router.post("/refresh", summary="Refresh shared analytics pre-aggregates")
def refresh_shared_analytics(
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_permission_with_subscription("placement.cycles.manage")),
):
    _refresh_preaggregates(db)
    return {"status": "ok"}


@router.get("/cohort-outcomes", summary="Institution/program/batch cohort outcomes over time")
def get_cohort_outcomes(
    institution_id: Optional[str] = Query(None),
    program_id: Optional[str] = Query(None),
    batch_id: Optional[str] = Query(None),
    refresh: bool = Query(False),
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_permission_with_subscription("placement.cycles.view")),
):
    if refresh:
        _refresh_preaggregates(db)
    query = db.query(models.BenchmarkCohortOutcomeAgg)
    if institution_id:
        query = query.filter(models.BenchmarkCohortOutcomeAgg.institution_id == institution_id)
    if program_id:
        query = query.filter(models.BenchmarkCohortOutcomeAgg.program_id == program_id)
    if batch_id:
        query = query.filter(models.BenchmarkCohortOutcomeAgg.batch_id == batch_id)
    rows = query.order_by(models.BenchmarkCohortOutcomeAgg.month_bucket.asc()).all()
    return {"items": [
        {
            "institution_id": r.institution_id,
            "program_id": r.program_id,
            "batch_id": r.batch_id,
            "month": r.month_bucket,
            "outcome_type": r.outcome_type,
            "outcome_count": r.outcome_count,
            "avg_ctc": r.avg_ctc,
        }
        for r in rows
    ]}


@router.get("/role-progression", summary="Role progression timelines by graduation year")
def get_role_progression(
    graduation_year: Optional[int] = Query(None),
    institution_id: Optional[str] = Query(None),
    program_id: Optional[str] = Query(None),
    batch_id: Optional[str] = Query(None),
    refresh: bool = Query(False),
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_permission_with_subscription("placement.cycles.view")),
):
    if refresh:
        _refresh_preaggregates(db)
    query = db.query(models.BenchmarkRoleProgressionAgg)
    if graduation_year:
        query = query.filter(models.BenchmarkRoleProgressionAgg.graduation_year == graduation_year)
    if institution_id:
        query = query.filter(models.BenchmarkRoleProgressionAgg.institution_id == institution_id)
    if program_id:
        query = query.filter(models.BenchmarkRoleProgressionAgg.program_id == program_id)
    if batch_id:
        query = query.filter(models.BenchmarkRoleProgressionAgg.batch_id == batch_id)
    rows = query.order_by(models.BenchmarkRoleProgressionAgg.trajectory_count.desc()).all()
    return {"items": [
        {
            "graduation_year": r.graduation_year,
            "role_name": r.role_name,
            "trajectory_count": r.trajectory_count,
            "avg_ctc": r.avg_ctc,
            "institution_id": r.institution_id,
            "program_id": r.program_id,
            "batch_id": r.batch_id,
        }
        for r in rows
    ]}


@router.get("/transitions", summary="Company/function/designation transition matrices")
def get_transitions(
    institution_id: Optional[str] = Query(None),
    program_id: Optional[str] = Query(None),
    batch_id: Optional[str] = Query(None),
    company_id: Optional[str] = Query(None),
    business_unit_id: Optional[str] = Query(None),
    designation_id: Optional[str] = Query(None),
    refresh: bool = Query(False),
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_permission_with_subscription("placement.cycles.view")),
):
    if refresh:
        _refresh_preaggregates(db)
    query = db.query(
        models.BenchmarkTransitionAgg.from_company_id,
        models.BenchmarkTransitionAgg.to_company_id,
        models.BenchmarkTransitionAgg.from_business_unit_id,
        models.BenchmarkTransitionAgg.to_business_unit_id,
        models.BenchmarkTransitionAgg.from_designation_id,
        models.BenchmarkTransitionAgg.to_designation_id,
        func.sum(models.BenchmarkTransitionAgg.transition_count).label("transition_count"),
    )

    if institution_id:
        query = query.filter(models.BenchmarkTransitionAgg.institution_id == institution_id)
    if program_id:
        query = query.filter(models.BenchmarkTransitionAgg.program_id == program_id)
    if batch_id:
        query = query.filter(models.BenchmarkTransitionAgg.batch_id == batch_id)
    if company_id:
        query = query.filter(
            and_(
                models.BenchmarkTransitionAgg.from_company_id == company_id,
                models.BenchmarkTransitionAgg.to_company_id.is_not(None),
            )
        )
    if business_unit_id:
        query = query.filter(models.BenchmarkTransitionAgg.from_business_unit_id == business_unit_id)
    if designation_id:
        query = query.filter(models.BenchmarkTransitionAgg.from_designation_id == designation_id)

    rows = query.group_by(
        models.BenchmarkTransitionAgg.from_company_id,
        models.BenchmarkTransitionAgg.to_company_id,
        models.BenchmarkTransitionAgg.from_business_unit_id,
        models.BenchmarkTransitionAgg.to_business_unit_id,
        models.BenchmarkTransitionAgg.from_designation_id,
        models.BenchmarkTransitionAgg.to_designation_id,
    ).all()

    return {"items": [
        {
            "from_company_id": r.from_company_id,
            "to_company_id": r.to_company_id,
            "from_business_unit_id": r.from_business_unit_id,
            "to_business_unit_id": r.to_business_unit_id,
            "from_designation_id": r.from_designation_id,
            "to_designation_id": r.to_designation_id,
            "transition_count": int(r.transition_count or 0),
        }
        for r in rows
    ]}


@router.post("/benchmark/similar-profile", summary="Recruiter similar-profile benchmark")
def similar_profile_benchmark(
    req: SimilarProfileBenchmarkRequest,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
):
    query = db.query(models.BenchmarkTransitionAgg)
    if req.target_company_id:
        query = query.filter(
            (models.BenchmarkTransitionAgg.from_company_id == req.target_company_id)
            | (models.BenchmarkTransitionAgg.to_company_id == req.target_company_id)
        )
    if req.program_id:
        query = query.filter(models.BenchmarkTransitionAgg.program_id == req.program_id)
    if req.batch_id:
        query = query.filter(models.BenchmarkTransitionAgg.batch_id == req.batch_id)
    if req.target_role:
        role_like = f"%{req.target_role.lower()}%"
        query = query.filter(
            func.lower(func.coalesce(models.BenchmarkTransitionAgg.from_role_name, "")).like(role_like)
            | func.lower(func.coalesce(models.BenchmarkTransitionAgg.to_role_name, "")).like(role_like)
        )

    trajectories = query.order_by(models.BenchmarkTransitionAgg.transition_count.desc()).limit(max(1, min(req.limit, 30))).all()
    counts = [t.transition_count for t in trajectories if t.transition_count]
    avg_count = mean(counts) if counts else 0
    confidence = {
        "lower": round(max(0, avg_count * 0.8), 2),
        "median": round(avg_count, 2),
        "upper": round(avg_count * 1.2, 2),
    }

    return {
        "top_trajectories": [
            {
                "from_company_id": t.from_company_id,
                "to_company_id": t.to_company_id,
                "from_role": t.from_role_name,
                "to_role": t.to_role_name,
                "transition_count": t.transition_count,
            }
            for t in trajectories
        ],
        "confidence_band": confidence,
        "filters": req.model_dump(),
        "source": "verified_and_profile_approved_records_only",
    }
