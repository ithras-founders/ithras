from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add core backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../core/backend'))

from .modules.governance.routers import policies, workflows, workflow_approvals, workflow_templates, application_requests
from .modules.candidate.routers import shortlists, applications
from .modules.recruiter.routers import jobs, jd_submissions, bulk_operations

app = FastAPI(title="Placement Governance API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include governance routers
app.include_router(policies.router)
app.include_router(workflows.router)
app.include_router(workflow_approvals.router)
app.include_router(workflow_templates.router)
app.include_router(application_requests.router)

# Include candidate routers
app.include_router(shortlists.router)
app.include_router(applications.router)

# Include recruiter routers
app.include_router(jobs.router)
app.include_router(jd_submissions.router)
app.include_router(bulk_operations.router)

@app.get("/")
def root():
    return {"message": "Placement Governance API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
