# คู่มือ Deploy Frontend บน Vercel + Backend Ngrok (100% ใช้งานได้)

## สถานะปัจจุบัน
- ✅ Backend รันอยู่: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- ✅ Ngrok tunnel: `https://anthropocentric-poisonous-darcie.ngrok-free.dev`
- ✅ Frontend config: proxy `/api` -> ngrok backend
- ✅ `vercel.json` พร้อม deploy

## ขั้นตอน Deploy (5 นาที)

### 1. ตรวจสอบ Backend ทำงาน
```bash
# Test API endpoint
curl https://anthropocentric-poisonous-darcie.ngrok-free.dev/api/state
# ต้องได้ JSON response {"state":"STOP","is_running":false,...}
```

### 2. Push Code ไป GitHub
```bash
# ใน workspace root (d:/WorkSpace/Spark_Detection)
git add .
git commit -m "Ready for Vercel deployment with ngrok backend"
git branch -M main

# สร้าง repo ใหม่ที่ https://github.com/new
# ตั้งชื่อ: spark-detection-dashboard
# Copy HTTPS URL แล้วรัน:
git remote add origin https://github.com/[YOUR_USERNAME]/spark-detection-dashboard.git
git push -u origin main
```

### 3. Deploy Vercel
1. ไป https://vercel.com/login
2. Login ด้วย GitHub
3. Click **"Add New Project"**
4. Import repo `spark-detection-dashboard`
5. **Framework Preset**: Vite (auto detect)
6. **Root Directory**: `frontend` (สำคัญ!)
7. **Build Command**: `npm run build` (default)
8. **Output Directory**: `dist` (default)
9. **Install Command**: `npm install` (default)
10. **Environment Variables**: ไม่ต้องใส่ (ใช้ vercel.json proxy)
11. Click **Deploy**

### 4. รอ Deploy เสร็จ (~2 นาที)
- Vercel จะ build frontend
- ได้ URL เช่น: `https://spark-detection-dashboard.vercel.app`

### 5. Test Production
1. เปิด Vercel URL
2. F12 Console: ดู Network tab
3. ต้องเห็น requests ไป `/api/state`, `/api/summary/today` สำเร็จ
4. Dashboard แสดง metrics real-time

## วิธีแก้ปัญหา

### ถ้า API error 404/502
1. ตรวจสอบ ngrok ยังรันอยู่: `https://anthropocentric-poisonous-darcie.ngrok-free.dev/docs`
2. Update `vercel.json` line 12 ด้วย ngrok URL ใหม่ (ถ้า restart ngrok)
3. Redeploy: Vercel dashboard > Deployments > ... > Redeploy

### ถ้า ngrok หมดอายุ (free 2h)
1. Restart ngrok: `ngrok http 8000`
2. Copy URL ใหม่
3. แก้ `vercel.json` line 12:
   ```json
   "dest": "https://[NEW-NGROK-URL].ngrok-free.dev/api/$1"
   ```
4. Git push:
   ```bash
   git add vercel.json
   git commit -m "Update ngrok URL"
   git push
   ```
5. Vercel auto redeploy

### ถ้าต้องการ ngrok ไม่หมดอายุ
- Upgrade ngrok paid ($8/เดือน): static domain + no time limit
- หรือใช้ Railway deploy backend (ฟรี 500h/เดือน, ดูคู่มือ DEPLOYMENT_GUIDE_TH.md)

## โครงสร้างการทำงาน

```
User Browser
    ↓
Vercel Frontend (https://spark-detection-dashboard.vercel.app)
    ↓ /api/* requests
vercel.json proxy
    ↓
Ngrok Tunnel (https://anthropocentric-poisonous-darcie.ngrok-free.dev)
    ↓
Local Backend (uvicorn :8000)
    ↓
SQLite Database
```

## ไฟล์สำคัญ
- [`vercel.json`](vercel.json) - Vercel config + API proxy
- [`frontend/src/lib/api.ts`](frontend/src/lib/api.ts) - API base URL (ใช้ `/api` ทั้ง dev/prod)
- [`frontend/vite.config.js`](frontend/vite.config.js) - Dev proxy localhost:8000

## หมายเหตุ
- **ไม่ต้องใส่ VITE_API_URL** ใน Vercel env vars (ใช้ vercel.json proxy แทน)
- **ngrok inspect page** จะไม่มีปัญหาเพราะ Vercel proxy ข้าม browser warning
- **Backend ต้องรันตลอด** ถ้าปิด PC frontend จะ error
