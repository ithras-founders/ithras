"""Calendar domain schemas"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CalendarSlotSchema(BaseModel):
    id: str
    company_id: str
    job_id: Optional[str] = None
    institution_id: str
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    slot_type: str
    max_capacity: Optional[int] = None
    booked_count: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CalendarSlotCreateSchema(BaseModel):
    company_id: str
    job_id: Optional[str] = None
    institution_id: str
    start_time: datetime
    end_time: datetime
    duration_minutes: Optional[int] = None
    slot_type: Optional[str] = "INTERVIEW"
    max_capacity: Optional[int] = None
    status: Optional[str] = "AVAILABLE"


class CalendarSlotUpdateSchema(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    slot_type: Optional[str] = None
    max_capacity: Optional[int] = None
    status: Optional[str] = None


class TimetableBlockSchema(BaseModel):
    id: str
    student_id: str
    institution_id: str
    day_of_week: int
    start_time: str
    end_time: str
    block_type: str
    recurring: bool
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TimetableBlockCreateSchema(BaseModel):
    student_id: str
    institution_id: str
    day_of_week: int
    start_time: str
    end_time: str
    block_type: Optional[str] = "CLASS"
    recurring: Optional[bool] = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class TimetableBlockUpdateSchema(BaseModel):
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    block_type: Optional[str] = None
    recurring: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SlotBookingSchema(BaseModel):
    id: str
    slot_id: str
    company_id: str
    booked_at: datetime
    status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class SlotBookingCreateSchema(BaseModel):
    company_id: str
    notes: Optional[str] = None
