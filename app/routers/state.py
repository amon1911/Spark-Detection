from fastapi import APIRouter, Depends
from ..state_machine import machine_brain
from ..schemas import StateResponse
from datetime import datetime

router = APIRouter()

@router.get("/state", response_model=StateResponse)
def get_current_state():
    return {
        "state": machine_brain.current_state,
        "is_running": machine_brain.current_state == "RUN",
        "current_cycle": machine_brain.current_cycle_count,
        "today_runtime_sec": machine_brain.today_runtime,
        "last_updated": datetime.now()
    }