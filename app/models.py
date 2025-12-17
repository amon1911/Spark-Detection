from sqlalchemy import Column, Integer, String, DateTime, Date, Boolean, Float
from sqlalchemy.sql import func
from .database import Base

class MachineState(Base):
    __tablename__ = "machine_state"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    state = Column(String(10))  # 'RUN', 'STOP'
    current_cycle = Column(Integer, default=0)
    today_runtime_sec = Column(Integer, default=0)

class CycleLog(Base):
    __tablename__ = "cycle_log"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    cycle_no = Column(Integer)
    start_time = Column(DateTime)
    stop_time = Column(DateTime)
    runtime_sec = Column(Integer)

class DailySummary(Base):
    __tablename__ = "daily_summary"
    date = Column(Date, primary_key=True, index=True)
    total_cycles = Column(Integer, default=0)
    total_runtime_sec = Column(Integer, default=0)
    total_downtime_sec = Column(Integer, default=0)
    availability = Column(Float, default=0.0)

class DowntimeLog(Base):
    __tablename__ = "downtime_log"
    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    downtime_reason = Column(String(50))  # SETUP_DIE, REPAIR, etc.
    duration_sec = Column(Integer, nullable=True)
    date = Column(Date, index=True)
    is_active = Column(Boolean, default=True)