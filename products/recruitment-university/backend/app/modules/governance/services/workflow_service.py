"""
Workflow Service
Orchestrates workflow operations and sends notifications
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import sys
import os
_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)
from app.modules.shared import models, database, schemas


class WorkflowService:
    """Service for managing workflows and sending notifications"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_workflow(
        self, 
        company_id: str, 
        institution_id: str,
        created_by: str,
        name: str,
        stages_data: List[Dict[str, Any]],
        job_id: Optional[str] = None,
        description: Optional[str] = None
    ) -> models.Workflow:
        """Create workflow and send notification to company"""
        workflow_id = f"workflow_{uuid.uuid4().hex[:12]}"
        
        # Create workflow
        db_workflow = models.Workflow(
            id=workflow_id,
            company_id=company_id,
            job_id=job_id,
            institution_id=institution_id,
            name=name,
            description=description,
            created_by=created_by,
            status="DRAFT"
        )
        self.db.add(db_workflow)
        self.db.flush()
        
        # Create stages
        for idx, stage_data in enumerate(stages_data, start=1):
            stage_id = f"stage_{uuid.uuid4().hex[:12]}"
            db_stage = models.WorkflowStage(
                id=stage_id,
                workflow_id=workflow_id,
                stage_number=idx,
                name=stage_data.get("name", f"Stage {idx}"),
                description=stage_data.get("description"),
                stage_type=stage_data.get("stage_type", "APPLICATION"),
                is_approval_required=stage_data.get("is_approval_required", True)
            )
            self.db.add(db_stage)
        
        # Send notification to company users
        self._send_notification_to_company(
            company_id=company_id,
            notification_type="WORKFLOW_REQUEST",
            title="New Workflow Created",
            message=f"Placement team has created a workflow '{name}' for your company. Please submit JD and compensation details.",
            data={"workflow_id": workflow_id}
        )
        
        self.db.commit()
        self.db.refresh(db_workflow)
        return db_workflow
    
    def submit_jd(
        self, 
        workflow_id: str, 
        company_id: str,
        jd_data: Dict[str, Any]
    ) -> models.WorkflowApproval:
        """Create JD submission and approval request"""
        submission_id = f"jd_{uuid.uuid4().hex[:12]}"
        
        # Create JD submission
        db_submission = models.JDSubmission(
            id=submission_id,
            workflow_id=workflow_id,
            company_id=company_id,
            job_title=jd_data.get("job_title"),
            job_description=jd_data.get("job_description"),
            sector=jd_data.get("sector"),
            slot=jd_data.get("slot"),
            fixed_comp=jd_data.get("fixed_comp"),
            variable_comp=jd_data.get("variable_comp"),
            esops_vested=jd_data.get("esops_vested"),
            joining_bonus=jd_data.get("joining_bonus"),
            performance_bonus=jd_data.get("performance_bonus"),
            is_top_decile=jd_data.get("is_top_decile", False)
        )
        self.db.add(db_submission)
        self.db.flush()
        
        # Get workflow to find created_by (placement team user)
        workflow = self.db.query(models.Workflow).filter(models.Workflow.id == workflow_id).first()
        
        # Create approval request
        approval_id = f"approval_{uuid.uuid4().hex[:12]}"
        db_approval = models.WorkflowApproval(
            id=approval_id,
            workflow_id=workflow_id,
            company_id=company_id,
            approval_type="JD_SUBMISSION",
            requested_by=company_id,  # Should be actual user ID
            requested_data={"submission_id": submission_id},
            status="PENDING"
        )
        self.db.add(db_approval)
        
        # Send notification to placement team
        if workflow:
            self._send_notification(
                user_id=workflow.created_by,
                notification_type="APPROVAL_REQUIRED",
                title="JD Submission Pending Approval",
                message=f"Company has submitted JD for workflow '{workflow.name}'. Please review and approve.",
                data={"approval_id": approval_id, "workflow_id": workflow_id}
            )
        
        self.db.commit()
        self.db.refresh(db_approval)
        return db_approval
    
    def approve_jd(self, approval_id: str, approver_id: str) -> models.Workflow:
        """Approve JD and open applications"""
        approval = self.db.query(models.WorkflowApproval).filter(
            models.WorkflowApproval.id == approval_id
        ).first()
        
        if not approval:
            raise ValueError("Approval not found")
        
        if approval.status != "PENDING":
            raise ValueError("Approval is not pending")
        
        approval.status = "APPROVED"
        approval.approved_by = approver_id
        approval.approved_at = datetime.utcnow()
        
        # Get submission
        submission_id = approval.requested_data.get("submission_id")
        submission = self.db.query(models.JDSubmission).filter(
            models.JDSubmission.id == submission_id
        ).first()
        
        if submission:
            submission.approved_at = datetime.utcnow()
        
        # Activate workflow
        workflow = self.db.query(models.Workflow).filter(
            models.Workflow.id == approval.workflow_id
        ).first()
        
        if workflow:
            workflow.status = "ACTIVE"
            
            # Send notification to company
            self._send_notification_to_company(
                company_id=workflow.company_id,
                notification_type="APPLICATION_OPENED",
                title="Applications Now Open",
                message=f"Your JD has been approved. Applications for workflow '{workflow.name}' are now open.",
                data={"workflow_id": workflow.id}
            )
        
        self.db.commit()
        if workflow:
            self.db.refresh(workflow)
        return workflow
    
    def submit_application(
        self, 
        student_id: str, 
        workflow_id: str, 
        cv_id: str,
        job_id: Optional[str] = None
    ) -> models.Application:
        """Create application"""
        # Verify CV exists
        cv = self.db.query(models.CV).filter(models.CV.id == cv_id).first()
        if not cv:
            raise ValueError("CV not found")
        
        # Verify workflow is active
        workflow = self.db.query(models.Workflow).filter(models.Workflow.id == workflow_id).first()
        if not workflow:
            raise ValueError("Workflow not found")
        
        if workflow.status != "ACTIVE":
            raise ValueError("Workflow is not active for applications")
        
        # Check if application already exists
        existing = self.db.query(models.Application).filter(
            models.Application.student_id == student_id,
            models.Application.workflow_id == workflow_id
        ).first()
        
        if existing:
            raise ValueError("Application already exists")
        
        # Get first stage
        first_stage = self.db.query(models.WorkflowStage).filter(
            models.WorkflowStage.workflow_id == workflow_id
        ).order_by(models.WorkflowStage.stage_number).first()
        
        application_id = f"app_{uuid.uuid4().hex[:12]}"
        db_application = models.Application(
            id=application_id,
            student_id=student_id,
            job_id=job_id,
            workflow_id=workflow_id,
            cv_id=cv_id,
            current_stage_id=first_stage.id if first_stage else None,
            status="SUBMITTED"
        )
        self.db.add(db_application)
        
        # Create initial stage progress
        if first_stage:
            progress_id = f"progress_{uuid.uuid4().hex[:12]}"
            db_progress = models.ApplicationStageProgress(
                id=progress_id,
                application_id=application_id,
                stage_id=first_stage.id,
                status="PENDING"
            )
            self.db.add(db_progress)
        
        self.db.commit()
        self.db.refresh(db_application)
        return db_application
    
    def progress_students(
        self, 
        workflow_id: str, 
        stage_id: str, 
        student_ids: List[str],
        requested_by: str
    ) -> models.WorkflowApproval:
        """Create approval request for student progression"""
        workflow = self.db.query(models.Workflow).filter(models.Workflow.id == workflow_id).first()
        if not workflow:
            raise ValueError("Workflow not found")
        
        approval_id = f"approval_{uuid.uuid4().hex[:12]}"
        db_approval = models.WorkflowApproval(
            id=approval_id,
            workflow_id=workflow_id,
            company_id=workflow.company_id,
            approval_type="STAGE_PROGRESSION",
            requested_by=requested_by,
            requested_data={
                "stage_id": stage_id,
                "student_ids": student_ids
            },
            status="PENDING"
        )
        self.db.add(db_approval)
        
        # Send notification to placement team
        self._send_notification(
            user_id=workflow.created_by,
            notification_type="APPROVAL_REQUIRED",
            title="Student Progression Pending Approval",
            message=f"Company has requested to progress {len(student_ids)} students to next stage.",
            data={"approval_id": approval_id, "workflow_id": workflow_id}
        )
        
        self.db.commit()
        self.db.refresh(db_approval)
        return db_approval
    
    def approve_progression(self, approval_id: str, approver_id: str) -> Dict[str, Any]:
        """Approve and update student stages"""
        approval = self.db.query(models.WorkflowApproval).filter(
            models.WorkflowApproval.id == approval_id
        ).first()
        
        if not approval:
            raise ValueError("Approval not found")
        
        if approval.status != "PENDING":
            raise ValueError("Approval is not pending")
        
        approval.status = "APPROVED"
        approval.approved_by = approver_id
        approval.approved_at = datetime.utcnow()
        
        stage_id = approval.requested_data.get("stage_id")
        student_ids = approval.requested_data.get("student_ids", [])
        
        # Get next stage
        stage = self.db.query(models.WorkflowStage).filter(models.WorkflowStage.id == stage_id).first()
        if not stage:
            raise ValueError("Stage not found")
        
        next_stage = self.db.query(models.WorkflowStage).filter(
            models.WorkflowStage.workflow_id == stage.workflow_id,
            models.WorkflowStage.stage_number > stage.stage_number
        ).order_by(models.WorkflowStage.stage_number).first()
        
        if not next_stage:
            raise ValueError("No next stage found")
        
        # Update applications
        updated_count = 0
        for student_id in student_ids:
            application = self.db.query(models.Application).filter(
                models.Application.student_id == student_id,
                models.Application.workflow_id == stage.workflow_id
            ).first()
            
            if application:
                application.current_stage_id = next_stage.id
                application.status = "IN_PROGRESS"
                
                # Create progress record
                progress_id = f"progress_{uuid.uuid4().hex[:12]}"
                db_progress = models.ApplicationStageProgress(
                    id=progress_id,
                    application_id=application.id,
                    stage_id=next_stage.id,
                    status="PENDING",
                    moved_by=approver_id
                )
                self.db.add(db_progress)
                updated_count += 1
        
        self.db.commit()
        return {"updated_count": updated_count, "next_stage_id": next_stage.id}
    
    def send_notification(
        self, 
        user_id: str, 
        notification_type: str, 
        title: str, 
        message: str,
        data: Optional[Dict[str, Any]] = None
    ) -> models.Notification:
        """Create a notification"""
        return self._send_notification(user_id, notification_type, title, message, data)
    
    def _send_notification(
        self, 
        user_id: str, 
        notification_type: str, 
        title: str, 
        message: str,
        data: Optional[Dict[str, Any]] = None
    ) -> models.Notification:
        """Internal method to create notification"""
        notification_id = f"notif_{uuid.uuid4().hex[:12]}"
        
        db_notification = models.Notification(
            id=notification_id,
            user_id=user_id,
            recipient_type="USER",
            notification_type=notification_type,
            title=title,
            message=message,
            data=data or {},
            is_read=False
        )
        
        self.db.add(db_notification)
        self.db.flush()
        return db_notification
    
    def _send_notification_to_company(
        self,
        company_id: str,
        notification_type: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None
    ):
        """Send notification to all users in a company"""
        company_users = self.db.query(models.User).filter(
            models.User.company_id == company_id
        ).all()
        
        for user in company_users:
            self._send_notification(user.id, notification_type, title, message, data)
