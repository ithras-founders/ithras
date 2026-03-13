from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.modules.shared import models, database, schemas

router = APIRouter(tags=["programs"])


@router.get("/api/v1/institutions/{institution_id}/programs", response_model=List[schemas.ProgramSchema])
def get_programs(institution_id: str, db: Session = Depends(database.get_db)):
    """List programs for an institution"""
    institution = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    programs = db.query(models.Program).filter(models.Program.institution_id == institution_id).all()
    return programs


@router.post("/api/v1/institutions/{institution_id}/programs", response_model=schemas.ProgramSchema)
def create_program(
    institution_id: str,
    program: schemas.ProgramCreateSchema,
    db: Session = Depends(database.get_db)
):
    """Create a program for an institution"""
    if program.institution_id != institution_id:
        raise HTTPException(status_code=400, detail="Program institution_id must match path")
    institution = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    existing = db.query(models.Program).filter(models.Program.id == program.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Program with this ID already exists")
    db_program = models.Program(
        id=program.id,
        institution_id=program.institution_id,
        name=program.name,
        code=program.code
    )
    db.add(db_program)
    db.commit()
    db.refresh(db_program)
    return db_program


@router.get("/api/v1/programs/{program_id}", response_model=schemas.ProgramSchema)
def get_program(program_id: str, db: Session = Depends(database.get_db)):
    """Get a specific program by ID"""
    program = db.query(models.Program).filter(models.Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


@router.put("/api/v1/programs/{program_id}", response_model=schemas.ProgramSchema)
def update_program(
    program_id: str,
    program_update: schemas.ProgramUpdateSchema,
    db: Session = Depends(database.get_db)
):
    """Update a program"""
    db_program = db.query(models.Program).filter(models.Program.id == program_id).first()
    if not db_program:
        raise HTTPException(status_code=404, detail="Program not found")
    for key, value in program_update.model_dump(exclude_unset=True).items():
        setattr(db_program, key, value)
    import datetime
    db_program.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(db_program)
    return db_program


@router.delete("/api/v1/programs/{program_id}")
def delete_program(program_id: str, db: Session = Depends(database.get_db)):
    """Delete a program"""
    db_program = db.query(models.Program).filter(models.Program.id == program_id).first()
    if not db_program:
        raise HTTPException(status_code=404, detail="Program not found")
    users_count = db.query(models.User).filter(models.User.program_id == program_id).count()
    policies_count = db.query(models.Policy).filter(models.Policy.program_id == program_id).count()
    if users_count > 0 or policies_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete program: {users_count} users and {policies_count} policies reference it"
        )
    db.delete(db_program)
    db.commit()
    return {"message": "Program deleted successfully"}
