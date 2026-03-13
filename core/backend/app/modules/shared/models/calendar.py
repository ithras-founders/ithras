"""Calendar domain models: CalendarSlot, TimetableBlock, SlotBooking, StudentSlotAvailability"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
import datetime


class CalendarSlot(Base):
    __tablename__ = "calendar_slots"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=True)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    slot_type = Column(String, default="INTERVIEW")  # INTERVIEW, PRESENTATION, NETWORKING, etc.
    max_capacity = Column(Integer, nullable=True)
    booked_count = Column(Integer, default=0)
    status = Column(String, default="AVAILABLE")  # AVAILABLE, BOOKED, CANCELLED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    company = relationship("Company", foreign_keys=[company_id])
    job = relationship("JobPosting", foreign_keys=[job_id])
    institution = relationship("Institution", foreign_keys=[institution_id])


class TimetableBlock(Base):
    __tablename__ = "timetable_blocks"
    id = Column(String, primary_key=True)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0-6 (Monday-Sunday)
    start_time = Column(String, nullable=False)  # HH:MM format
    end_time = Column(String, nullable=False)  # HH:MM format
    block_type = Column(String, default="CLASS")  # CLASS, EXAM, PERSONAL, etc.
    recurring = Column(Boolean, default=True)
    start_date = Column(DateTime, nullable=True)  # For recurring blocks
    end_date = Column(DateTime, nullable=True)  # For recurring blocks
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    student = relationship("User", foreign_keys=[student_id])
    institution = relationship("Institution", foreign_keys=[institution_id])


class SlotBooking(Base):
    __tablename__ = "slot_bookings"
    id = Column(String, primary_key=True)
    slot_id = Column(String, ForeignKey("calendar_slots.id"), nullable=False)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    booked_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="CONFIRMED")  # CONFIRMED, CANCELLED
    notes = Column(String, nullable=True)
    slot = relationship("CalendarSlot", foreign_keys=[slot_id])
    company = relationship("Company", foreign_keys=[company_id])


class StudentSlotAvailability(Base):
    __tablename__ = "student_slot_availability"
    id = Column(String, primary_key=True)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    slot_id = Column(String, ForeignKey("calendar_slots.id"), nullable=False)
    is_available = Column(Boolean, default=True)
    reason = Column(String, default="AVAILABLE")  # AVAILABLE, TIMETABLE_BLOCKED, OTHER_COMPANY_BOOKED, etc.
    related_company_id = Column(String, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    student = relationship("User", foreign_keys=[student_id])
    slot = relationship("CalendarSlot", foreign_keys=[slot_id])
    related_company = relationship("Company", foreign_keys=[related_company_id])
