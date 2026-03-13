from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add core backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../core/backend'))

from .modules.cv_builder.routers import cv_templates, cvs

app = FastAPI(title="CV Builder API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include CV builder routers
app.include_router(cv_templates.router)
app.include_router(cvs.router)

@app.get("/")
def root():
    return {"message": "CV Builder API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
