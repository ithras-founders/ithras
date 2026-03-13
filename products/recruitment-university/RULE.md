# Placement Governance Product

## Entry Points

### Backend
- `app/modules/governance/routers/` - policies, workflows, workflow_approvals
- `app/modules/candidate/routers/` - shortlists, applications
- `app/modules/recruiter/routers/` - jobs, jd_submissions, bulk_operations

### Frontend
- `CandidatePortal`, `ApplicationSubmission` - Candidate flows
- `RecruiterPortal`, `CompanyWorkflowView` - Recruiter flows
- `AdminPortal`, `WorkflowManager`, `ApprovalQueue` - Governance flows

## Core Dependencies
- `shared.models.placement`, `shared.models.governance`, `shared.models.core`
- `api/placement.js`, `api/governance.js`, `api/core.js`

## DB Tables
- `workflows`, `workflow_stages`, `applications`, `workflow_approvals`, `shortlists`, `jobs`, `jd_submissions`, `policies`
