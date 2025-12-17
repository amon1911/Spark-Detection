from sqlalchemy.orm import Session
from datetime import date
from typing import List
from ..models import CycleLog

def get_cycles_by_date(db: Session, target_date: date) -> List[CycleLog]:
    """
    ดึงข้อมูล Cycle ทั้งหมดของวันที่ระบุ
    เรียงตามเวลาเริ่ม (start_time)
    """
    return db.query(CycleLog)\
             .filter(CycleLog.date == target_date)\
             .order_by(CycleLog.start_time.asc())\
             .all()