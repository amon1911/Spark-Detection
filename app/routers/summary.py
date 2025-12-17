from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from ..database import get_db
from ..schemas import SummarySchema
from ..services import summary_service

router = APIRouter()

@router.get("/summary/today", response_model=SummarySchema, tags=["Dashboard"])
def get_today_summary(db: Session = Depends(get_db)):
    """
    ดึงข้อมูลสรุปของ 'วันนี้' (Real-time dashboard use)
    ถ้าไม่มีข้อมูล จะ return 0 ทั้งหมด ไม่ error
    """
    return summary_service.get_realtime_today_summary(db)

@router.get("/summary", response_model=SummarySchema, tags=["History"])
def get_historical_summary(
    date: date = Query(..., description="ระบุวันที่ (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    ดึงข้อมูลสรุปย้อนหลัง
    ถ้าไม่พบวันที่ระบุ จะ return 404
    """
    summary = summary_service.get_summary_by_date(db, date)
    
    if not summary:
        # กรณีดูย้อนหลัง ถ้าไม่มีข้อมูลถือว่า User อาจจะใส่วันผิด หรือวันหยุด
        raise HTTPException(status_code=404, detail="No data found for this date")
        
    return summary