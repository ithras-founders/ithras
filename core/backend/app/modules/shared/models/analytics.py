"""Analytics domain models: report/dashboards and benchmark pre-aggregates."""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from ..database import Base
import datetime


class AnalyticsReport(Base):
    __tablename__ = "analytics_reports"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    query = Column(String)
    params_json = Column(JSON)
    chart_config_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AnalyticsDashboard(Base):
    __tablename__ = "analytics_dashboards"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    layout_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AnalyticsSchedule(Base):
    __tablename__ = "analytics_schedules"
    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey("analytics_reports.id"))
    cron_expr = Column(String, nullable=False)
    recipients_json = Column(JSON)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    report = relationship("AnalyticsReport", foreign_keys=[report_id])


class BenchmarkCohortOutcomeAgg(Base):
    __tablename__ = "benchmark_cohort_outcome_agg"
    id = Column(String, primary_key=True)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=True, index=True)
    program_id = Column(String, ForeignKey("programs.id"), nullable=True, index=True)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=True, index=True)
    month_bucket = Column(String, nullable=False, index=True)
    outcome_type = Column(String, nullable=False, index=True)
    outcome_count = Column(Integer, nullable=False, default=0)
    avg_ctc = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class BenchmarkRoleProgressionAgg(Base):
    __tablename__ = "benchmark_role_progression_agg"
    id = Column(String, primary_key=True)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=True, index=True)
    program_id = Column(String, ForeignKey("programs.id"), nullable=True, index=True)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=True, index=True)
    graduation_year = Column(Integer, nullable=True, index=True)
    role_name = Column(String, nullable=False, index=True)
    trajectory_count = Column(Integer, nullable=False, default=0)
    avg_ctc = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class BenchmarkTransitionAgg(Base):
    __tablename__ = "benchmark_transition_agg"
    id = Column(String, primary_key=True)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=True, index=True)
    program_id = Column(String, ForeignKey("programs.id"), nullable=True, index=True)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=True, index=True)
    from_company_id = Column(String, ForeignKey("companies.id"), nullable=True, index=True)
    to_company_id = Column(String, ForeignKey("companies.id"), nullable=True, index=True)
    from_business_unit_id = Column(String, ForeignKey("business_units.id"), nullable=True, index=True)
    to_business_unit_id = Column(String, ForeignKey("business_units.id"), nullable=True, index=True)
    from_designation_id = Column(String, ForeignKey("company_designations.id"), nullable=True, index=True)
    to_designation_id = Column(String, ForeignKey("company_designations.id"), nullable=True, index=True)
    from_role_name = Column(String, nullable=True)
    to_role_name = Column(String, nullable=True)
    transition_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
