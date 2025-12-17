from sqlalchemy.orm import Session
from datetime import date
from ..models import DailySummary
from ..schemas import SummarySchema

def get_summary_by_date(db: Session, target_date: date) -> DailySummary:
    """
    ดึงข้อมูล Summary ตามวันที่
    """
    return db.query(DailySummary).filter(DailySummary.date == target_date).first()

def create_empty_summary(target_date: date) -> DailySummary:
    """
    สร้าง Object เปล่า สำหรับส่งกลับกรณีเริ่มวันใหม่แล้วยังไม่มี Log
    เพื่อป้องกัน Frontend Error
    """
    return DailySummary(
        date=target_date,
        total_cycles=0,
        total_runtime_sec=0,
        total_downtime_sec=0,
        availability=0.0
    )


def get_realtime_today_summary(db: Session) -> SummarySchema:
    from datetime import date, datetime
    from ..state_machine import machine_brain
    today = date.today()
    summary = get_summary_by_date(db, today)
    if not summary:
        summary = create_empty_summary(today)
    current_add = 0
    if (machine_brain.current_state == "RUN" and
        machine_brain.run_start_time and
        machine_brain.run_start_time.date() == today):
        current_add = int((datetime.now() - machine_brain.run_start_time).total_seconds())
    total_runtime = summary.total_runtime_sec + current_add
    SHIFT_SECONDS = 7.5 * 3600
    availability = round(min(100.0, total_runtime / SHIFT_SECONDS * 100), 2)
    return SummarySchema(
        date=today,
        total_cycles=summary.total_cycles,
        total_runtime_sec=total_runtime,
        total_downtime_sec=summary.total_downtime_sec,
        availability=availability
    )