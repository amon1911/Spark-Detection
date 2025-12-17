import time
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models

class MachineStateMachine:
    def __init__(self):
        self.current_state = "STOP"
        self.last_spark_time = 0
        self.run_start_time = None
        self.stop_threshold = 10.0  # seconds
        
        # Cache stats in memory for realtime API speed
        self.current_cycle_count = 0
        self.today_runtime = 0
        self.cached_summary = {}

    def update_from_vision(self, db: Session, spark_detected: bool):
        now = time.time()
        
        # 1. Update Spark Timestamp
        if spark_detected:
            self.last_spark_time = now

        # 2. Logic Evaluation
        time_since_spark = now - self.last_spark_time
        
        previous_state = self.current_state
        
        if spark_detected:
            # Transition STOP -> RUN
            if self.current_state == "STOP":
                self.current_state = "RUN"
                self.run_start_time = datetime.now()
                self._log_state_change(db, "RUN")
                print(f"⚡ MACHINE STARTED at {self.run_start_time}")
                
        else:
            # Transition RUN -> STOP (after timeout)
            if self.current_state == "RUN" and time_since_spark > self.stop_threshold:
                self.current_state = "STOP"
                stop_time = datetime.now()
                self._handle_stop_logic(db, stop_time)
                self._log_state_change(db, "STOP")
                print(f"🛑 MACHINE STOPPED at {stop_time}")

    def _handle_stop_logic(self, db: Session, stop_time: datetime):
        if not self.run_start_time:
            return

        # Calculate Runtime
        runtime_delta = stop_time - self.run_start_time
        runtime_sec = int(runtime_delta.total_seconds())
        
        today = date.today()
        
        # 1. Update Daily Summary (Create if not exists)
        summary = db.query(models.DailySummary).filter(models.DailySummary.date == today).first()
        if not summary:
            summary = models.DailySummary(date=today, total_cycles=0, total_runtime_sec=0, total_downtime_sec=0)
            db.add(summary)
            db.flush() # to get defaults if needed

        summary.total_cycles += 1
        summary.total_runtime_sec += runtime_sec
        
        SHIFT_SECONDS = 27000.0
        summary.availability = round(min(100.0, summary.total_runtime_sec / SHIFT_SECONDS * 100), 2)
        
        # Downtime calculation requires simpler logic: 24h - runtime or time_since_start - runtime
        # For Phase 1 simple accumulation:
        # downtime is calculated on demand or by gap. Here we focus on runtime accumulation.
        
        self.current_cycle_count = summary.total_cycles
        self.today_runtime = summary.total_runtime_sec
        
        # 2. Log Cycle
        new_cycle = models.CycleLog(
            date=today,
            cycle_no=summary.total_cycles,
            start_time=self.run_start_time,
            stop_time=stop_time,
            runtime_sec=runtime_sec
        )
        db.add(new_cycle)
        db.commit()
        
        self.run_start_time = None

    def _log_state_change(self, db: Session, state: str):
        # Optional: Keep a granular log of state changes
        log = models.MachineState(
            state=state,
            current_cycle=self.current_cycle_count,
            today_runtime_sec=self.today_runtime
        )
        db.add(log)
        db.commit()
    
    def load_today_stats(self, db: Session):
        today = date.today()
        self.current_cycle_count = db.query(func.count(models.CycleLog.id)).filter(models.CycleLog.date == today).scalar() or 0
        self.today_runtime = db.query(func.coalesce(func.sum(models.CycleLog.runtime_sec), 0)).filter(models.CycleLog.date == today).scalar()

# Singleton Instance
machine_brain = MachineStateMachine()