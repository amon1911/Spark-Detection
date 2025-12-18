# คู่มือการตั้งค่า Frontend

## ปัญหาที่แก้ไข

### 1. Frontend ไม่เชื่อมต่อกับ Backend
**สาเหตุ:** ไม่มีไฟล์ `.env` ใน frontend ที่กำหนด `VITE_API_URL`

**วิธีแก้:**
1. สร้างไฟล์ `frontend/.env` โดยคัดลอกจาก `frontend/.env.example`
2. ตั้งค่า `VITE_API_URL` ให้ตรงกับ ngrok URL ของคุณ:
   ```
   VITE_API_URL=https://your-ngrok-url.ngrok-free.dev
   ```

### 2. คำเตือน Tailwind CDN
**สาเหตุ:** ใช้ Tailwind CDN ใน production ซึ่งไม่แนะนำ

**วิธีแก้:**
- ลบ `<script src="https://cdn.tailwindcss.com"></script>` ออกจาก `index.html`
- ติดตั้ง Tailwind CSS แบบ PostCSS plugin (ทำแล้ว)
- เพิ่ม `@tailwind` directives ใน `index.css` (ทำแล้ว)

## การตั้งค่าสำหรับ Development

### 1. ติดตั้ง Dependencies
```bash
cd frontend
npm install
```

### 2. ตั้งค่า Environment Variables
```bash
# คัดลอกไฟล์ .env.example
cp .env.example .env

# แก้ไข .env และใส่ ngrok URL ของคุณ
# VITE_API_URL=https://your-ngrok-url.ngrok-free.dev
```

### 3. รัน Development Server
```bash
npm run dev
```

Frontend จะรันที่ `http://localhost:5173`

## การตั้งค่าสำหรับ Production (Vercel)

### 1. ตั้งค่า Environment Variables ใน Vercel
ไปที่ Project Settings > Environment Variables และเพิ่ม:
- **Key:** `VITE_API_URL`
- **Value:** `https://your-ngrok-url.ngrok-free.dev`
- **Environment:** Production, Preview, Development

### 2. Deploy
```bash
# Build locally เพื่อทดสอบ
npm run build

# หรือ push ไปที่ GitHub แล้ว Vercel จะ deploy อัตโนมัติ
git add .
git commit -m "Fix frontend API connection and Tailwind setup"
git push
```

## การตรวจสอบว่าทำงานถูกต้อง

### 1. ตรวจสอบ API Connection
เปิด Browser Console (F12) และดูว่า:
- ✅ ไม่มี error `404 Not Found` จาก API calls
- ✅ ไม่มีคำเตือน "cdn.tailwindcss.com should not be used in production"
- ✅ เห็น API requests ไปที่ ngrok URL ของคุณ

### 2. ตรวจสอบ Tailwind CSS
- ✅ หน้าเว็บแสดงผลถูกต้องด้วย Tailwind styles
- ✅ ไม่มีคำเตือนเกี่ยวกับ Tailwind CDN

## โครงสร้างไฟล์ที่สำคัญ

```
frontend/
├── .env                    # Environment variables (ไม่ commit ลง git)
├── .env.example           # ตัวอย่าง environment variables
├── postcss.config.js      # PostCSS config สำหรับ Tailwind
├── tailwind.config.js     # Tailwind CSS config
├── vite.config.js         # Vite config (มี proxy สำหรับ /api)
└── src/
    ├── index.css          # มี @tailwind directives
    └── App.jsx            # Main component (ใช้ API_URL = '/api')
```

## หมายเหตุ

- **ไฟล์ `.env` จะไม่ถูก commit** เพราะอยู่ใน `.gitignore`
- **Vite proxy** จะ forward requests จาก `/api` ไปยัง `VITE_API_URL`
- **ใน production (Vercel)** ต้องตั้งค่า `VITE_API_URL` ใน Vercel dashboard
- **ngrok URL** อาจเปลี่ยนทุกครั้งที่รีสตาร์ท ngrok (ใช้ ngrok paid plan เพื่อได้ static domain)
