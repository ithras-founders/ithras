"""Batches API - cohort management under programs."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, database, schemas
from ..auth import get_current_user
from ..audit import log_audit

router = APIRouter(prefix="/api/v1/batches", tags=["batches"])


@router.get("/", response_model=List[schemas.BatchSchema])
def get_batches(
    program_id: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user),
):
    """List batches, optionally filtered by program."""
    query = db.query(models.Batch)
    if program_id:
        query = query.filter(models.Batch.program_id == program_id)
    return query.order_by(models.Batch.year.desc().nullslast(), models.Batch.name).all()


@router.get("/{batch_id}", response_model=schemas.BatchSchema)
def get_batch(
    batch_id: str,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user),
):
    """Get a batch by ID."""
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@router.post("/", response_model=schemas.BatchSchema)
def create_batch(
    data: schemas.BatchCreateSchema,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user),
):
    """Create a new batch."""
    program = db.query(models.Program).filter(models.Program.id == data.program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    existing = db.query(models.Batch).filter(models.Batch.id == data.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Batch with this ID already exists")
    batch = models.Batch(
        id=data.id,
        program_id=data.program_id,
        name=data.name,
        year=data.year,
        start_date=data.start_date,
        end_date=data.end_date,
    )
    db.add(batch)
    log_audit(
        db,
        user_id=current_user.id,
        action="BATCH_CREATED",
        entity_type="batch",
        entity_id=data.id,
        details={"name": data.name, "program_id": data.program_id},
    )
    db.commit()
    db.refresh(batch)
    return batch


@router.put("/{batch_id}", response_model=schemas.BatchSchema)
def update_batch(
    batch_id: str,
    data: schemas.BatchUpdateSchema,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user),
):
    """Update a batch."""
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    changes = data.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(batch, key, value)
    log_audit(
        db,
        user_id=current_user.id,
        action="BATCH_UPDATED",
        entity_type="batch",
        entity_id=batch_id,
        details={"changed_fields": list(changes.keys())},
    )
    db.commit()
    db.refresh(batch)
    return batch


@router.delete("/{batch_id}")
def delete_batch(
    batch_id: str,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user),
):
    """Delete a batch."""
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    log_audit(
        db,
        user_id=current_user.id,
        action="BATCH_DELETED",
        entity_type="batch",
        entity_id=batch_id,
        details={"name": batch.name},
    )
    db.delete(batch)
    db.commit()
    return {"message": "Batch deleted"}
