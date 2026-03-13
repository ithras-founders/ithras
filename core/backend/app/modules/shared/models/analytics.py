"""Analytics domain models: AnalyticsReport, AnalyticsDashboard, AnalyticsSchedule"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
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
