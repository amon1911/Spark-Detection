from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from ..database import get_db
from ..schemas import CycleSchema
from ..services import cycle_service

router = APIRouter()

@router.get("/cycles", response_model=List[CycleSchema], tags=["History"])
def get_cycles(
    date: date = Query(..., description="ระบุวันที่ต้องการดูข้อมูล (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    ดึงรายการ Cycle ทั้งหมดในวันที่ระบุ
    """
    cycles = cycle_service.get_cycles_by_date(db, date)
    return cycles