from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional

class StateResponse(BaseModel):
    state: str
    is_running: bool
    current_cycle: int
    today_runtime_sec: int
    last_updated: datetime

class CycleSchema(BaseModel):
    cycle_no: int
    start_time: datetime
    stop_time: datetime
    runtime_sec: int

class SummarySchema(BaseModel):
    date: date
    total_cycles: int
    total_runtime_sec: int
    total_downtime_sec: int
    availability: float = 0.0

class DowntimeStartRequest(BaseModel):
    downtime_reason: str

class DowntimeStopRequest(BaseModel):
    pass

class DowntimeLogSchema(BaseModel):
    id: int
    start_time: datetime
    end_time: Optional[datetime]
    downtime_reason: str
    duration_sec: Optional[int]
    date: date
    is_active: bool

    class Config:
        from_attributes = True

class ActiveDowntimeResponse(BaseModel):
    is_active: bool
    current_downtime: Optional[DowntimeLogSchema]