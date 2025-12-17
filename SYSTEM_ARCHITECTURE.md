# 🏗️ SPARK VISION GUARD - System Architecture

## 📐 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPARK VISION GUARD SYSTEM                     │
│                  Industrial Monitoring Platform                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Camera     │───▶│    Vision    │───▶│    State     │───▶│   Database   │
│   (RTSP)     │    │   Detector   │    │   Machine    │    │ (PostgreSQL) │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                           │                    │                    │
                           │                    │                    │
                           ▼                    ▼                    ▼
                    ┌──────────────────────────────────────────────────┐
                    │              FastAPI Backend                     │
                    │         (REST API Endpoints)                     │
                    └──────────────────────────────────────────────────┘
                                         │
                                         │ HTTP/JSON
                                         ▼
                    ┌──────────────────────────────────────────────────┐
                    │           React Dashboard (Frontend)             │
                    │      Real-time Monitoring Interface              │
                    └──────────────────────────────────────────────────┘
```

## 🔄 Data Flow Architecture

### 1. Vision Input Layer (การจับภาพและประมวลผล)

```python
# File: app/vision/spark_detector.py
Camera (RTSP) → OpenCV → AI Model → Boolean (True/False)
```

**Process**:
1. เปิด Stream วิดีโอจากกล้อง RTSP
2. อ่านภาพทีละเฟรม (Frame by Frame)
3. Resize เป็น 640×640 pixels
4. ส่งเข้า AI Model (YOLO-based)
5. ได้ผลลัพธ์: `spark_detected = True/False`

**Working Hours**:
- Start: 08:00
- End: 16:30
- Outside hours: System sends `False` to close last cycle

### 2. Logic Layer (State Machine)

```python
# File: app/state_machine.py
Vision Result → State Logic → Database Actions
```

**State Transition Table**:

| Current State | Event | Action | Next State |
|--------------|-------|--------|------------|
| STOP | Spark Detected (True) | Record Start Time | RUN |
| RUN | Spark Detected (True) | Update Last Spark Time | RUN |
| RUN | No Spark (False) | Start Countdown (10s) | RUN |
| RUN | Timeout (>10s no spark) | Record Stop Time, Save Cycle | STOP |

**Key Variables**:
- `current_state`: "RUN" or "STOP"
- `last_spark_time`: Timestamp of last detected spark
- `run_start_time`: When current cycle started
- `stop_threshold`: 10 seconds (configurable)

**Cycle Recording Logic**:
```python
def _handle_stop_logic(db, stop_time):
    1. Calculate runtime = stop_time - run_start_time
    2. Update DailySummary (total_cycles++, total_runtime += runtime)
    3. Create CycleLog record
    4. Commit to database
```

### 3. Data Layer (Database)

**Database Schema**:

#### Table: `machine_state`
```sql
id              INTEGER PRIMARY KEY
timestamp       DATETIME (auto)
state           VARCHAR(10)      -- 'RUN' or 'STOP'
current_cycle   INTEGER
today_runtime_sec INTEGER
```
**Purpose**: Log every state change for audit trail

#### Table: `cycle_log`
```sql
id              INTEGER PRIMARY KEY
date            DATE
cycle_no        INTEGER
start_time      DATETIME
stop_time       DATETIME
runtime_sec     INTEGER
```
**Purpose**: Store each complete production cycle

#### Table: `daily_summary`
```sql
date                DATE PRIMARY KEY
total_cycles        INTEGER
total_runtime_sec   INTEGER
total_downtime_sec  INTEGER
```
**Purpose**: Aggregated daily statistics

### 4. API Layer (FastAPI Backend)

**Endpoints**:

#### GET `/api/state`
```json
{
  "state": "RUN",
  "is_running": true,
  "current_cycle": 45,
  "today_runtime_sec": 18750,
  "last_updated": "2025-12-15T10:00:00"
}
```
**Source**: In-memory cache from `machine_brain` singleton

#### GET `/api/cycles?date=YYYY-MM-DD`
```json
[
  {
    "cycle_no": 1,
    "start_time": "2025-12-15T08:05:30",
    "stop_time": "2025-12-15T08:12:45",
    "runtime_sec": 435
  },
  ...
]
```
**Source**: Query `cycle_log` table filtered by date

#### GET `/api/summary/today`
```json
{
  "date": "2025-12-15",
  "total_cycles": 45,
  "total_runtime_sec": 18750,
  "total_downtime_sec": 12150
}
```
**Source**: Query `daily_summary` table for today

### 5. Presentation Layer (React Dashboard)

**Component Structure**:
```
App.jsx
├── Header
│   ├── Logo & Title
│   ├── Date/Time Display
│   └── Live Status Indicator
│
├── Left Panel (Status)
│   ├── Machine Status Card
│   │   ├── Status Icon (Animated)
│   │   ├── State Display (RUN/STOP)
│   │   └── Status Description
│   │
│   ├── System Status Card
│   │   ├── Backend API Status
│   │   ├── Camera Feed Status
│   │   └── Database Status
│   │
│   └── Daily Summary Card
│       ├── Cycles Completed
│       ├── Active Time
│       ├── Uptime Rate
│       └── Current State
│
├── Right Panel (Metrics & Chart)
│   ├── KPI Cards Row
│   │   ├── Total Cycles Card
│   │   ├── Total Runtime Card
│   │   └── Availability Card
│   │
│   └── Timeline Chart
│       ├── Chart Header
│       ├── Legend (RUN/STOP)
│       └── Plotly Interactive Chart
│
└── Footer
    ├── Copyright Info
    └── Last Update Time
```

**Data Fetching**:
```javascript
// Fetch every 2 seconds
useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 2000);
  return () => clearInterval(interval);
}, []);
```

## 🔐 Security Considerations

### CORS Configuration
```python
# app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Production: Specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Database Connection
```python
# .env file
DATABASE_URL=postgresql://user:password@localhost/dbname
RTSP_URL=rtsp://camera_ip:port/stream
```

## ⚡ Performance Optimization

### Backend
1. **In-Memory Cache**: State data cached in `machine_brain` singleton
2. **Database Indexing**: Indexed on `date` field for fast queries
3. **Connection Pooling**: SQLAlchemy session management

### Frontend
1. **Lazy Loading**: Components load on demand
2. **Memoization**: Prevent unnecessary re-renders
3. **Debouncing**: API calls limited to 2-second intervals
4. **Chart Optimization**: Plotly configured for performance

## 📊 Metrics Calculation

### Availability Formula
```javascript
const WORK_HOURS = 8.5; // 08:00 - 16:30
const availability = (runtimeSec / (WORK_HOURS * 3600)) * 100;
```

### Runtime Display
```javascript
const formatRuntime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`;
};
```

## 🔄 State Machine Logic

### State Diagram
```
        ┌─────────┐
        │  STOP   │◄──────────┐
        └─────────┘            │
             │                 │
    Spark    │                 │ Timeout
   Detected  │                 │ (>10s)
             ▼                 │
        ┌─────────┐            │
        │   RUN   │────────────┘
        └─────────┘
             │
             │ Spark Detected
             │ (Reset Timer)
             └──────┐
                    │
                    ▼
               (Stay RUN)
```

### Threshold Configuration
```python
# app/state_machine.py
self.stop_threshold = 10.0  # seconds
```

## 🗄️ Database Operations

### Write Operations
1. **State Change**: Every RUN/STOP transition
2. **Cycle Complete**: When RUN → STOP after timeout
3. **Daily Summary**: Updated on each cycle completion

### Read Operations
1. **Current State**: From in-memory cache (fast)
2. **Cycles**: Query by date (indexed)
3. **Summary**: Query by date (indexed)

## 🎨 UI/UX Design Principles

### Color Psychology
- **Green (#10b981)**: Active, Productive, Positive
- **Red (#ef4444)**: Alert, Stopped, Attention
- **Blue (#3b82f6)**: Information, Cycles
- **Purple (#a855f7)**: Time, Duration
- **Cyan (#06b6d4)**: Availability, Performance

### Visual Hierarchy
1. **Primary**: Machine Status (largest, center)
2. **Secondary**: KPI Cards (prominent, top)
3. **Tertiary**: Timeline Chart (detailed view)
4. **Quaternary**: System Status (supporting info)

### Accessibility
- High contrast ratios
- Clear typography
- Icon + Text labels
- Color + Shape coding (not color alone)

## 🚀 Deployment Architecture

### Development
```
Backend:  localhost:8000
Frontend: localhost:5173
Database: localhost:5432
```

### Production (Recommended)
```
Backend:  https://api.yourdomain.com
Frontend: https://dashboard.yourdomain.com
Database: Internal network (not exposed)
Camera:   Internal RTSP stream
```

## 📦 Technology Stack Summary

### Backend
- **Python 3.10+**
- **FastAPI**: Web framework
- **SQLAlchemy**: ORM
- **OpenCV**: Video processing
- **YOLO**: AI model (spark detection)
- **Uvicorn**: ASGI server

### Frontend
- **React 19.2.0**: UI library
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **Plotly.js**: Charts
- **Axios**: HTTP client
- **date-fns**: Date utilities
- **Lucide React**: Icons

### Database
- **PostgreSQL**: Primary database
- **SQLite**: Alternative (development)

## 🔍 Monitoring & Debugging

### Backend Logs
```bash
# Start with logs
uvicorn app.main:app --reload --log-level debug
```

### Frontend Console
```javascript
// Browser Console (F12)
- Network tab: Check API responses
- Console tab: Check errors
- Application tab: Check local storage
```

### Database Queries
```sql
-- Check today's cycles
SELECT * FROM cycle_log WHERE date = CURRENT_DATE ORDER BY start_time;

-- Check daily summary
SELECT * FROM daily_summary WHERE date = CURRENT_DATE;

-- Check state history
SELECT * FROM machine_state ORDER BY timestamp DESC LIMIT 10;
```

## 📈 Scalability Considerations

### Current Capacity
- Single machine monitoring
- Single camera input
- ~1000 cycles/day capacity
- 2-second refresh rate

### Future Scaling
- Multi-machine support
- Multi-camera arrays
- Historical data retention (30+ days)
- Advanced analytics and ML predictions

## 🛡️ Error Handling

### Backend
```python
try:
    # Vision processing
except Exception as e:
    print(f"🔥 Error: {e}")
    # Continue operation, don't crash
```

### Frontend
```javascript
try {
  await fetchData();
} catch (err) {
  console.error("API Error:", err);
  setCameraStatus('error');
  // Show error state, keep trying
}
```

## 📝 Configuration Files

### `.env` (Backend)
```env
DATABASE_URL=postgresql://user:pass@localhost/spark_db
RTSP_URL=rtsp://192.168.1.100:554/stream
```

### `vite.config.js` (Frontend)
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

## 🎯 Key Features Implementation

### Real-time Updates
- **Polling**: Every 2 seconds
- **State Management**: React useState hooks
- **Optimistic Updates**: Immediate UI feedback

### Timeline Visualization
- **Library**: Plotly.js
- **Chart Type**: Horizontal bar (timeline)
- **Interactivity**: Zoom, pan, hover tooltips

### Responsive Design
- **Breakpoints**: sm, md, lg, xl
- **Grid System**: Tailwind CSS Grid
- **Mobile-first**: Adapts to all screen sizes

## 🔧 Maintenance Guide

### Daily Tasks
- Monitor dashboard for anomalies
- Check system status indicators
- Verify camera feed is active

### Weekly Tasks
- Review availability trends
- Check database size
- Backup database

### Monthly Tasks
- Clean old logs (>30 days)
- Update dependencies
- Performance review

## 📚 API Documentation

Full API documentation available at:
```
http://localhost:8000/docs  (Swagger UI)
http://localhost:8000/redoc (ReDoc)
```

## 🎓 Learning Resources

### Understanding the System
1. Read [`DASHBOARD_GUIDE_TH.md`](DASHBOARD_GUIDE_TH.md) for Thai guide
2. Read [`frontend/DASHBOARD_README.md`](frontend/DASHBOARD_README.md) for technical details
3. Check [`app/state_machine.py`](app/state_machine.py:6) for logic
4. Review [`app/main.py`](app/main.py:24) for startup process

### Code Structure
- **Backend**: `app/` directory
- **Frontend**: `frontend/src/` directory
- **Models**: `app/models.py`
- **Routers**: `app/routers/`
- **Services**: `app/services/`

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Maintained by**: Spark Vision Guard Team
