"""
Timetable Blocks API Router
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import sys
import os
_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)
from app.modules.shared import models, database, schemas

router = APIRouter(prefix="/api/v1/timetable-blocks", tags=["timetable-blocks"])

@router.get("/", response_model=List[schemas.TimetableBlockSchema])
def get_timetable_blocks(
    student_id: Optional[str] = Query(None),
    institution_id: Optional[str] = Query(None),
    db: Session = Depends(database.get_db)
):
    """Get timetable blocks with optional filtering"""
    query = db.query(models.TimetableBlock)
    
    if student_id:
        query = query.filter(models.TimetableBlock.student_id == student_id)
    if institution_id:
        query = query.filter(models.TimetableBlock.institution_id == institution_id)
    
    return query.all()

@router.get("/{block_id}", response_model=schemas.TimetableBlockSchema)
def get_timetable_block(block_id: str, db: Session = Depends(database.get_db)):
    """Get a specific timetable block"""
    block = db.query(models.TimetableBlock).filter(models.TimetableBlock.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Timetable block not found")
    return block

@router.post("/", response_model=schemas.TimetableBlockSchema)
def create_timetable_block(
    block_data: schemas.TimetableBlockCreateSchema,
    db: Session = Depends(database.get_db)
):
    """Create a new timetable block"""
    block_id = f"block_{uuid.uuid4().hex[:12]}"
    
    db_block = models.TimetableBlock(
        id=block_id,
        student_id=block_data.student_id,
        institution_id=block_data.institution_id,
        day_of_week=block_data.day_of_week,
        start_time=block_data.start_time,
        end_time=block_data.end_time,
        block_type=block_data.block_type or "CLASS",
        recurring=block_data.recurring if block_data.recurring is not None else True,
        start_date=block_data.start_date,
        end_date=block_data.end_date
    )
    
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block

@router.put("/{block_id}", response_model=schemas.TimetableBlockSchema)
def update_timetable_block(
    block_id: str,
    block_update: schemas.TimetableBlockUpdateSchema,
    db: Session = Depends(database.get_db)
):
    """Update a timetable block"""
    db_block = db.query(models.TimetableBlock).filter(models.TimetableBlock.id == block_id).first()
    if not db_block:
        raise HTTPException(status_code=404, detail="Timetable block not found")
    
    for key, value in block_update.dict(exclude_unset=True).items():
        setattr(db_block, key, value)
    
    db.commit()
    db.refresh(db_block)
    return db_block

@router.delete("/{block_id}")
def delete_timetable_block(block_id: str, db: Session = Depends(database.get_db)):
    """Delete a timetable block"""
    db_block = db.query(models.TimetableBlock).filter(models.TimetableBlock.id == block_id).first()
    if not db_block:
        raise HTTPException(status_code=404, detail="Timetable block not found")
    
    db.delete(db_block)
    db.commit()
    return {"message": "Timetable block deleted successfully"}
