"""Opportunities domain schemas: SavedOpportunity, OpportunityFeedItem."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SavedOpportunityRead(BaseModel):
    id: str
    user_id: str
    job_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class OpportunityFeedItem(BaseModel):
    """Job posting with enrichment for feed display."""
    id: str
    company_id: str
    company_name: Optional[str] = None
    cycle_id: Optional[str] = None
    institution_id: Optional[str] = None
    title: str
    sector: str
    slot: str
    slot_rank: Optional[int] = None
    fixed_comp: float
    variable_comp: float = 0
    esops_vested: float = 0
    joining_bonus: float = 0
    performance_bonus: float = 0
    is_top_decile: bool = False
    opening_date: Optional[datetime] = None
    jd_status: str
    min_cgpa: Optional[float] = None
    max_backlogs: Optional[int] = None
    is_saved: bool = False
    source: str = "campus"  # campus | lateral

    class Config:
        from_attributes = True


class CompanyFollowRead(BaseModel):
    id: str
    user_id: str
    company_id: str
    created_at: datetime

    class Config:
        from_attributes = True
