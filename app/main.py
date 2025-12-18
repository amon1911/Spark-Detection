import threading
import time
import os
import cv2
import socket
from contextlib import asynccontextmanager # <--- ของใหม่
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import local modules
from .database import engine, Base, SessionLocal
from .routers import state, cycles, summary, downtime
from .vision.spark_detector import SparkDetector
from .state_machine import machine_brain

from datetime import datetime, time as dtime

# 1. Load Config
load_dotenv()

# 2. Create Database Tables
Base.metadata.create_all(bind=engine)

# --- BACKGROUND VISION TASK ---
def vision_loop():
    print("👁️ Vision Module Started...")
    
    # --- CONFIG เวลาทำงาน 08:00-16:00 (มีพัก 3 ช่วง) ---
    START_TIME = dtime(8, 0)   # 08:00 น.
    END_TIME = dtime(17, 30)    # 16:30 น.
    BREAKS = [
        (dtime(10,0), dtime(10,15)),  # พัก 15 นาที
        (dtime(12,0), dtime(13,0)),   # พักกลางวัน 1 ชม.
        (dtime(15,0), dtime(15,15))   # พัก 15 นาที
    ]
    # ----------------------

    rtsp_source = os.getenv("RTSP_URL", "0")
    if rtsp_source.isdigit(): rtsp_source = int(rtsp_source)
    
    detector = SparkDetector()
    db = SessionLocal()
    cap = None
    
    try:
        while True:
            # ดึงเวลาปัจจุบัน
            now = datetime.now().time()
            
            # 🕑 เช็ค: อยู่ในเวลางานไหม? (ไม่รวมช่วงพัก)
            is_break = any(b_start <= now <= b_end for b_start, b_end in BREAKS)
            is_working_hours = START_TIME <= now <= END_TIME and not is_break

            # ---------------------------------------------------------
            # กรณี 1: อยู่นอกเวลางาน (เลิกงานแล้ว หรือ ยังไม่ถึงเวลา)
            # ---------------------------------------------------------
            if not is_working_hours:
                # ส่งค่า False เข้าไป เพื่อให้แน่ใจว่าเครื่องจะถูกตัดเป็น STOP (ปิด Cycle สุดท้ายของวัน)
                machine_brain.update_from_vision(db, False) 
                
                # พักยาวๆ หน่อย (ประหยัด CPU) เช็คทุก 1 วินาทีพอ
                time.sleep(1) 
                
                # ถ้ามี connection ค้างอยู่ ปิดทิ้งไปเลย (ประหยัดเน็ต/bandwidth)
                if cap is not None:
                    cap.release()
                    cap = None
                
                continue # ข้าม Loop ไปเลย ไม่ต้องไปอ่านภาพ
            
            # ---------------------------------------------------------
            # กรณี 2: ในเวลางาน (08:00-16:00, ไม่รวมพัก) -> ทำงานปกติ
            # ---------------------------------------------------------
            
            # Reconnection Logic (เหมือนเดิม)
            if cap is None or not cap.isOpened():
                print(f"📷 Start Shift / Reconnecting: {rtsp_source} ...")
                cap = cv2.VideoCapture(rtsp_source)
                if not cap.isOpened():
                    time.sleep(5)
                    continue

            ret, frame = cap.read()
            if not ret:
                cap.release()
                time.sleep(1)
                continue
            
            # AI Process (เหมือนเดิม)
            frame_resized = cv2.resize(frame, (640, 640))
            result = detector.detect(frame_resized)
            machine_brain.update_from_vision(db, result["spark_detected"])
            
            time.sleep(0.01)

    except Exception as e:
        print(f"🔥 Error: {e}")
    finally:
        if cap: cap.release()
        db.close()


# --- LIFESPAN MANAGER (วิธีใหม่ แทน on_event) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 🟢 Startup: ทำก่อน Server เริ่ม
    print("🚀 System Starting...")
    t = threading.Thread(target=vision_loop, daemon=True)
    t.start()
    db = SessionLocal()
    machine_brain.load_today_stats(db)
    db.close()
    print("✅ Today stats loaded from database")
    
    yield # จุดที่ Server ทำงานจริง
    
    # 🔴 Shutdown: ทำตอนกดปิด Server
    print("🛑 System Shutting down...")

# 3. Initialize FastAPI with Lifespan
app = FastAPI(
    title="Industrial Spark Monitor API",
    lifespan=lifespan # <--- ใส่ตรงนี้
)

# 4. Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Register Routers
app.include_router(state, prefix="/api")
app.include_router(cycles, prefix="/api")
app.include_router(summary, prefix="/api")
app.include_router(downtime, prefix="/api")

@app.get("/")
def root():
    return {"message": "Machine Availability Monitor API is Running 🚀"}
    
if __name__ == "__main__":
    import uvicorn
    port = 8000
    print("Server running on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
