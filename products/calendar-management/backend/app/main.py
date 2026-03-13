from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add core backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../core/backend'))

from .modules.scheduling.routers import calendar_slots, timetable_blocks, availability
from app.modules.shared import database

app = FastAPI(title="Calendar Scheduling API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include scheduling routers
app.include_router(calendar_slots.router)
app.include_router(timetable_blocks.router)
app.include_router(availability.router)

@app.get("/")
def root():
    return {"message": "Calendar Scheduling API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
