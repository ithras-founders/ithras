"""
Bulk Operations API Router
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import zipfile
import io
import os
from app.modules.shared import models, database, schemas

router = APIRouter(prefix="/api/v1/bulk", tags=["bulk-operations"])

@router.post("/download-cvs")
def download_cvs_bulk(
    workflow_id: Optional[str] = Query(None),
    job_id: Optional[str] = Query(None),
    db: Session = Depends(database.get_db)
):
    """Download all CVs for a workflow/job as ZIP"""
    if not workflow_id and not job_id:
        raise HTTPException(status_code=400, detail="Either workflow_id or job_id is required")
    
    # Get applications
    query = db.query(models.Application)
    if workflow_id:
        query = query.filter(models.Application.workflow_id == workflow_id)
    if job_id:
        query = query.filter(models.Application.job_id == job_id)
    
    applications = query.all()
    
    if not applications:
        raise HTTPException(status_code=404, detail="No applications found")
    
    # Create ZIP file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for app in applications:
            cv = db.query(models.CV).filter(models.CV.id == app.cv_id).first()
            if cv and cv.pdf_url:
                # Extract file path
                file_path = cv.pdf_url.replace("/uploads/", "")
                full_path = os.path.join("/app/uploads", file_path)
                
                if os.path.exists(full_path):
                    # Get student name for filename
                    student = db.query(models.User).filter(models.User.id == app.student_id).first()
                    filename = f"{student.name.replace(' ', '_')}_{app.id}.pdf" if student else f"cv_{app.id}.pdf"
                    
                    zip_file.write(full_path, filename)
    
    zip_buffer.seek(0)
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=cvs.zip"}
    )

@router.post("/progress-students")
def progress_students_bulk(
    request_data: schemas.BulkProgressStudentsSchema,
    db: Session = Depends(database.get_db)
):
    """Submit student progression to next stage (creates approval request)"""
    from ...governance.routers.workflow_approvals import create_workflow_approval
    
    workflow_id = request_data.workflow_id
    stage_id = request_data.stage_id
    student_ids = request_data.student_ids
    requested_by = request_data.requested_by
    
    # Verify workflow and stage exist
    workflow = db.query(models.Workflow).filter(models.Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    stage = db.query(models.WorkflowStage).filter(models.WorkflowStage.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    
    # Get company_id from workflow
    company_id = workflow.company_id
    
    # Create approval request
    approval_data = schemas.WorkflowApprovalCreateSchema(
        workflow_id=workflow_id,
        company_id=company_id,
        approval_type="STAGE_PROGRESSION",
        requested_by=requested_by,
        requested_data={
            "stage_id": stage_id,
            "student_ids": student_ids
        }
    )
    
    return create_workflow_approval(approval_data, db)
