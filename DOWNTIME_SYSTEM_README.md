# ระบบจัดการ Downtime

## ภาพรวม
ระบบนี้ช่วยให้ผู้คุมเครื่องสามารถบันทึกและติดตามสาเหตุการหยุดเครื่อง (Downtime) พร้อมทั้งสร้างรายงานเพื่อวิเคราะห์ประสิทธิภาพการผลิต

## คุณสมบัติหลัก

### 1. บันทึก Downtime แบบ Real-time
- **10 ปุ่มสาเหตุ Downtime:**
  1. SETUP DIE - การติดตั้งแม่พิมพ์
  2. ซ่อมเครื่อง - การซ่อมบำรุงเครื่องจักร
  3. บำรุงรักษา - การบำรุงรักษาตามแผน
  4. ขาดวัตถุดิบ - รอวัตถุดิบ
  5. ไฟฟ้าขัดข้อง - ปัญหาไฟฟ้า
  6. ตรวจสอบคุณภาพ - การตรวจสอบ QC
  7. รอการอนุมัติ - รอการอนุมัติจากหัวหน้างาน
  8. พักผ่อน - เวลาพักของพนักงาน
  9. อื่นๆ 1 - สาเหตุอื่นๆ (สามารถกำหนดเอง)
  10. อื่นๆ 2 - สาเหตุอื่นๆ (สามารถกำหนดเอง)

### 2. แสดงสถานะ Downtime ปัจจุบัน
- แสดงสาเหตุ Downtime ที่กำลังดำเนินการ
- แสดงเวลาเริ่มต้น
- นับเวลา Downtime แบบ Real-time
- ปุ่มหยุด Downtime เมื่อเสร็จสิ้น

### 3. Export รายงาน
รองรับการ Export รายงานในรูปแบบ Excel (.xlsx) 3 ประเภท:

#### รายงานรายวัน (Daily Report)
- แสดงรายละเอียดทุก Downtime ในวันที่เลือก
- ข้อมูล: เวลาเริ่ม, เวลาสิ้นสุด, สาเหตุ, ระยะเวลา, สถานะ

#### รายงานรายเดือน (Monthly Report)
- สรุป Downtime แยกตามวัน
- ข้อมูล: วันที่, จำนวนครั้ง, รวมเวลา Downtime, สาเหตุหลัก

#### รายงานรายปี (Yearly Report)
- สรุป Downtime แยกตามเดือน
- ข้อมูล: เดือน, จำนวนครั้ง, รวมเวลา Downtime, ค่าเฉลี่ยต่อวัน

## การติดตั้ง

### Backend
1. ติดตั้ง dependencies:
```bash
pip install -r requirements.txt
```

2. สร้างตาราง database ใหม่:
```bash
# ระบบจะสร้างตาราง downtime_log อัตโนมัติเมื่อรัน
python -m app.main
```

### Frontend
ไม่ต้องติดตั้งเพิ่มเติม - ใช้ dependencies ที่มีอยู่แล้ว

## API Endpoints

### 1. เริ่ม Downtime
```http
POST /api/downtime/start
Content-Type: application/json

{
  "downtime_reason": "SETUP_DIE"
}
```

### 2. หยุด Downtime
```http
POST /api/downtime/stop
```

### 3. ดูสถานะ Downtime ปัจจุบัน
```http
GET /api/downtime/active
```

### 4. ดูประวัติ Downtime
```http
GET /api/downtime/history?start_date=2025-01-01&end_date=2025-01-31&limit=100
```

### 5. Export รายงาน
```http
# รายวัน
GET /api/downtime/export?report_type=daily&year=2025&month=1&day=15

# รายเดือน
GET /api/downtime/export?report_type=monthly&year=2025&month=1

# รายปี
GET /api/downtime/export?report_type=yearly&year=2025
```

## Database Schema

### ตาราง downtime_log
```sql
CREATE TABLE downtime_log (
    id SERIAL PRIMARY KEY,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    downtime_reason VARCHAR(50),
    duration_sec INTEGER,
    date DATE,
    is_active BOOLEAN DEFAULT TRUE
);
```

## การใช้งาน UI

### 1. เริ่มบันทึก Downtime
1. เมื่อเครื่องหยุดทำงาน ให้กดปุ่มสาเหตุที่ตรงกับสถานการณ์
2. ระบบจะเริ่มนับเวลาอัตโนมัติ
3. สถานะจะแสดงที่กล่อง "Downtime Status"

### 2. หยุดบันทึก Downtime
1. เมื่อเครื่องกลับมาทำงานปกติ
2. กดปุ่ม "หยุด Downtime" สีแดง
3. ระบบจะบันทึกเวลาและคำนวณระยะเวลาอัตโนมัติ

### 3. Export รายงาน
1. เลือกประเภทรายงาน (รายวัน/รายเดือน/รายปี)
2. เลือกวันที่ที่ต้องการ
3. กดปุ่ม "ดาวน์โหลดรายงาน"
4. ไฟล์ Excel จะถูกดาวน์โหลดอัตโนมัติ

## หมายเหตุ
- ไม่สามารถเริ่ม Downtime ใหม่ได้ ถ้ายังมี Downtime ที่กำลังดำเนินการอยู่
- ระบบจะอัพเดทสถานะทุก 2 วินาที
- รายงานจะแสดงเฉพาะ Downtime ที่เสร็จสิ้นแล้ว (is_active = False)
- ระยะเวลาจะถูกคำนวณเป็นวินาที และแปลงเป็นนาที/ชั่วโมงในรายงาน

## การปรับแต่ง

### เปลี่ยนชื่อปุ่ม Downtime
แก้ไขในไฟล์ `frontend/src/components/Dashboard/DowntimeControlPanel.tsx`:
```typescript
const DOWNTIME_REASONS = [
  { id: 'SETUP_DIE', label: 'ชื่อใหม่', icon: Settings, color: 'blue' },
  // ...
];
```

### เพิ่มสาเหตุ Downtime
เพิ่มในอาร์เรย์ `DOWNTIME_REASONS` ในไฟล์เดียวกัน

## การแก้ปัญหา

### ปุ่มไม่ทำงาน
- ตรวจสอบว่า Backend API ทำงานอยู่ที่ http://localhost:8000
- เช็ค Console ใน Browser Developer Tools

### Export ไม่ทำงาน
- ตรวจสอบว่าติดตั้ง openpyxl แล้ว: `pip install openpyxl`
- เช็คว่ามีข้อมูลในช่วงเวลาที่เลือก

### ข้อมูลไม่อัพเดท
- รีเฟรชหน้าเว็บ
- ตรวจสอบการเชื่อมต่อ Database
