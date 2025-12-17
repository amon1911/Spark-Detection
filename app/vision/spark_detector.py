import os
from datetime import datetime
from ultralytics import YOLO
import numpy as np

class SparkDetector:
    def __init__(self):
        # --- CONFIG ---
        # 1. เปลี่ยนชื่อไฟล์ตรงนี้เป็น best.pt
        self.model_path = "weights/best.pt" 
        
        # 2. ตั้งค่าความมั่นใจ (ถ้าโมเดลแม่น ปรับขึ้นเป็น 0.6-0.7 ได้)
        self.conf_threshold = 0.5
        
        # 3. ต้องเจอ "on" ต่อเนื่องกี่เฟรม ถึงจะยอมรับว่า Run จริง (กันวูบวาบ)
        self.required_consecutive_frames = 3
        
        # --- STATE ---
        self.consecutive_sparks = 0
        self.model = None
        
        # --- LOAD MODEL ---
        print(f"🔄 Loading Custom Model: {self.model_path}...")
        if os.path.exists(self.model_path):
            try:
                self.model = YOLO(self.model_path)
                print("✅ Model loaded successfully!")
                print(f"📋 Class Names: {self.model.names}") # มันจะปริ้นท์บอกว่า 0=on, 1=off หรือเปล่า
            except Exception as e:
                print(f"❌ Error loading model: {e}")
        else:
            print(f"⚠️ Warning: Model file not found at {self.model_path}")

    def detect(self, frame: np.ndarray) -> dict:
        if self.model is None or frame is None:
            return {
                "timestamp": datetime.now().isoformat(),
                "spark_detected": False,
                "confidence": 0.0
            }

        # --- AI INFERENCE ---
        results = self.model.predict(frame, conf=self.conf_threshold, verbose=False)
        
        detected_on = False
        max_conf = 0.0

        # วนลูปดูทุกวัตถุที่เจอในภาพ
        if len(results) > 0:
            for box in results[0].boxes:
                class_id = int(box.cls[0])
                class_name = self.model.names[class_id] # ดึงชื่อ class เช่น 'on', 'off'
                conf = float(box.conf[0])

                # 👉 LOGIC สำคัญ: เราสนใจแค่ 'on' 
                # (ต้องพิมพ์เล็กพิมพ์ใหญ่ให้ตรงกับที่พี่เทรนมานะ ส่วนใหญ่ YOLO เป็น lowercase)
                if class_name == 'on':  
                    detected_on = True
                    if conf > max_conf:
                        max_conf = conf
                
                # ถ้าเจอ 'off' เราก็แค่ปล่อยผ่าน เพราะถือว่าเครื่องหยุด
                elif class_name == 'off':
                    pass 

        # --- CONFIRMATION LOGIC ---
        if detected_on:
            self.consecutive_sparks += 1
        else:
            self.consecutive_sparks = 0 # Reset ถ้าไม่เจอ on

        # ยืนยันสถานะเมื่อเจอต่อเนื่องครบตามกำหนด
        is_confirmed_run = self.consecutive_sparks >= self.required_consecutive_frames

        return {
            "timestamp": datetime.now().isoformat(),
            "spark_detected": is_confirmed_run,
            "confidence": max_conf if is_confirmed_run else 0.0
        }