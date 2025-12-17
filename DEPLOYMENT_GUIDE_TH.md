# คู่มือการ Deploy Spark Detection Dashboard ขึ้นเว็บ 🚀

## 📋 สรุปภาพรวม
โปรเจกต์นี้ใช้ **Docker Compose** จัดการ Backend (FastAPI + YOLO), Frontend (React + Nginx), Database (PostgreSQL), PgAdmin (optional).

- **Local ports**: Frontend `8080`, Backend `8000`, PgAdmin `5050`, DB `5433`
- **Production ready**: Gunicorn workers, Nginx static serve, proxy /api to backend

## 🧪 1. ทดสอบ Local Deployment (ทำก่อนเสมอ!)

### ข้อกำหนดเบื้องต้น
- [ ] Docker Desktop ติดตั้งและรันอยู่ ([docker.com](docker.com))

### ขั้นตอนละเอียด
1. **หยุด Dev Servers ทั้งหมด (สำคัญ!)**
   ```
   # ใน VSCode terminals กด Ctrl+C ทุกตัว (1-11)
   # หรือ Command Prompt: taskkill /F /IM python.exe /IM node.exe (ระวัง!)
   ```

2. **Copy และแก้ .env**
   ```
   copy .env.example .env
   notepad .env
   ```
   - `POSTGRES_PASSWORD=รหัสผ่านแข็งแรงใหม่!` (อย่างน้อย 12 ตัวอักษร)
   - `RTSP_URL=0` (ปิด AI vision สำหรับ test, เปลี่ยนเป็น RTSP จริงทีหลัง)

3. **ล้าง container เก่า (ถ้ามี)**
   ```
   docker compose down -v
   ```

4. **Build & Start**
   ```
   docker compose up --build -d
   ```
   - รอ build เสร็จ (~5-10 นาทีครั้งแรก)

5. **ตรวจสอบสถานะ**
   ```
   docker compose ps
   docker compose logs -f app     # Backend logs
   docker compose logs -f frontend # Frontend logs
   ```

6. **ทดสอบ URLs**
   | ชื่อ | URL | คำอธิบาย |
   |------|-----|----------|
   | **Dashboard** | http://localhost:8080 | React UI หลัก |
   | **API Docs** | http://localhost:8000/docs | FastAPI Swagger |
   | **PgAdmin** | http://localhost:5050 | DB Manager (login จาก .env) |

7. **หยุดระบบ**
   ```
   docker compose down
   ```

### ถ้าผิดพลาดบ่อย
- **Port 8000 conflict**: เปลี่ยน `8000:8000` เป็น `8001:8000` ใน docker-compose.yml
- **Build fail**: `docker system prune -f`
- **DB empty**: Base.metadata.create_all() auto create tables

## ☁️ 2. Deploy Production บน Cloud Platforms

### ⭐ แนะนำ #1: Railway.app (ง่ายสุด, ฟรี tier 500h/เดือน)
1. **Push code ไป GitHub**
   ```
   git init
   git add .
   git commit -m \"Ready for deploy\"
   # GitHub new repo > copy HTTPS URL
   git remote add origin https://github.com/yourusername/spark-detection.git
   git push -u origin main
   ```
   - **ไม่ push .env** (git add .env.example เท่านั้น)

2. **Railway Setup**
   - ไป [railway.app](https://railway.app) > Sign up with GitHub
   - New Project > Deploy from GitHub repo
   - Auto detect `docker-compose.yml` > Deploy!

3. **เพิ่ม PostgreSQL**
   - New Service > Database > PostgreSQL
   - Copy `DATABASE_URL` (Railway generate)

4. **ตั้งค่า Environment Variables**
   - Project Settings > Variables
     ```
     POSTGRES_PASSWORD=strong_pass_same_as_local
     RTSP_URL=rtsp://your-public-camera:554/stream  # สำคัญ!
     # DATABASE_URL auto จาก Railway DB (ไม่ต้อง set)
     ```

5. **เข้าถึง**
   - Railway dashboard > Generated Domain (e.g. https://spark-detection-production.up.railway.app)

### 🔄 Alternative #2: Render.com (ฟรี tier static + paid services)
1. **PostgreSQL**: New > PostgreSQL > External DB URL
2. **Backend**: New > Web Service > GitHub repo (root) > Runtime: Docker > Env: DATABASE_URL, RTSP_URL
3. **Frontend**: New > Static Site > GitHub repo (frontend/) > Build: `npm ci && npm run build` > Publish: `dist`
   - Edit nginx.conf proxy_pass `http://backend-service.onrender.com:10000/;`

### 🖥️ Alternative #3: VPS (DigitalOcean/Linode ~$6/เดือน)
1. สร้าง Droplet Ubuntu 22.04 (1GB RAM พอ)
2. SSH:
   ```
   sudo apt update && sudo apt install docker.io docker-compose -y
   sudo usermod -aG docker $USER
   ```
3. `git clone https://github.com/your/spark-detection`
4. `cd spark-detection`
5. `cp .env.example .env` edit vars (DB local or managed)
6. `docker compose up -d`
7. Firewall: `sudo ufw allow 80,443,8080`
8. Domain: A record -> VPS IP

## ⚠️ ข้อควรระวัง Production
- **RTSP Camera**: ต้องเข้าถึงได้จาก internet/container (port forward หรือ cloud camera)
- **YOLO Model**: `weights/best.pt` auto copy, ถ้าใหญ่ใช้ volume
- **Security**:
  - เปลี่ยน CORS ใน [`app/main.py`](app/main.py) จาก \"*\" เป็น domain จริง
  - HTTPS auto ใน cloud
  - DB password แข็งแรง, ไม่ expose pgadmin
- **Performance**: Gunicorn workers=2, เพิ่มตาม CPU cores
- **Backup**: pg_dump cronjob
- **Monitoring**: Cloud dashboard หรือ Prometheus

## ❓ ถ้ามีปัญหา?
- Logs: `docker compose logs service_name`
- Vision ไม่ work: RTSP_URL=0
- DB migration: run `python migrate_db.py` ใน container ถ้าต้องการ
- Support: comment ใน GitHub issues

**พร้อม deploy แล้ว! ถ้าต้องการช่วยเพิ่มเติม บอก platform ที่เลือก**

## 🥧 Backend บน Raspberry Pi (Native Python + SQLite)

### ข้อกำหนดเบื้องต้น
- Raspberry Pi OS **64-bit** (Pi 4/5, RAM 4GB+ แนะนำ)
- SSH เข้า Pi ได้ (`ssh pi@<pi-ip>`)
- Copy `weights/best.pt` ไปด้วย

### ขั้นตอน
1. **ติดตั้ง Dependencies**
   ```
   sudo apt update && sudo apt upgrade -y
   sudo apt install python3-venv python3-pip git libgl1-mesa-glx libglib2.0-0 -y
   ```

2. **Copy Project ไป Pi**
   ```
   # จาก PC: scp -r d:/WorkSpace/Spark_Detection pi@192.168.1.100:/home/pi/
   cd /home/pi/Spark_Detection
   ```

3. **Setup .env (ใช้ SQLite ง่าย)**
   ```
   cp .env.example .env
   # Edit notepad .env หรือ nano .env
   DATABASE_URL=sqlite:///./machine_monitor.db
   RTSP_URL=rtsp://your-camera:554/stream  # หรือ test=0
   ```

4. **Virtualenv & Pip Install**
   ```
   python3 -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   # ถ้า Torch error: pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
   ```

5. **Test Run**
   ```
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   Test: `curl http://<pi-ip>:8000/docs`

6. **Production Service (systemd)**
   สร้าง `/etc/systemd/system/spark-detection.service`:
   ```
   [Unit]
   Description=Spark Detection Backend
   After=network.target

   [Service]
   User=pi
   WorkingDirectory=/home/pi/Spark_Detection
   Environment="PATH=/home/pi/Spark_Detection/venv/bin"
   ExecStart=/home/pi/Spark_Detection/venv/bin/gunicorn -w 2 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000 --timeout 120
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   ```
   sudo systemctl daemon-reload
   sudo systemctl enable spark-detection
   sudo systemctl start spark-detection
   sudo journalctl -u spark-detection -f  # logs
   ```

### Firewall Pi
```
sudo ufw allow 8000/tcp
sudo ufw enable
```

## 🌐 Frontend Deploy ด้วย Ngrok (Nginx + Static)

### ข้อกำหนด
- Nginx ([nginx.org](nginx.org))
- Ngrok ([ngrok.com](ngrok.com))
- Pi IP:8000 ping ได้จาก PC

### 1. Build
```
cd frontend
npm ci
npm run build
```

### 2. Nginx Config
Copy `frontend/nginx.conf` edit `proxy_pass http://<PI_IP>:8000/;` & root to dist path
```
nginx -c your-nginx.conf
```

### 3. Ngrok
```
ngrok http 80
```
ใช้ URL ที่ได้! (Free: 2h limit)

**Pro Tip**: Ngrok paid สำหรับ static domain & no limit.