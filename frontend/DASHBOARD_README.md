# 🎯 Spark Vision Guard Dashboard

## 📊 Overview

Modern, real-time industrial monitoring dashboard for the Spark Vision Guard system. This dashboard provides comprehensive visualization of machine production cycles, runtime statistics, and system health monitoring.

## ✨ Features

### 1. **Real-time Machine Status**
- Live status indicator (RUN/STOP)
- Visual status with animated icons
- Color-coded states (Green = Running, Red = Stopped)
- Pulsing indicator for active state

### 2. **Key Performance Indicators (KPIs)**

#### Total Cycles
- Displays total production cycles completed today
- Visual progress bar
- Real-time updates every 2 seconds

#### Total Runtime
- Shows accumulated runtime in HH:MM:SS format
- Displays hours in decimal format
- Progress indicator based on work hours (8.5h)

#### Availability Percentage
- Calculates machine uptime ratio
- Formula: (Runtime / Total Work Hours) × 100
- Visual percentage indicator

### 3. **Machine Activity Timeline**
- Interactive timeline chart showing RUN/STOP periods
- Green bars = Machine running
- Gray bars = Machine stopped/idle
- Hover to see detailed information:
  - Cycle number
  - Start/Stop times
  - Duration in seconds
- Zoom and pan capabilities

### 4. **System Status Monitoring**
- **Backend API**: Connection status
- **Camera Feed**: Live camera status
- **Database**: Database connection status

### 5. **Daily Summary**
- Cycles completed
- Active time (hours)
- Uptime rate (%)
- Current state

## 🎨 Design Features

### Color Scheme
- **Background**: Dark gradient (#0a0e17 → #0f1419)
- **Running State**: Green (#10b981)
- **Stopped State**: Red (#ef4444)
- **Accent Colors**: Blue, Purple, Cyan

### Typography
- **Primary Font**: Inter (Google Fonts)
- **Monospace Font**: JetBrains Mono (for time displays)
- **Font Weights**: 300-900 for various emphasis levels

### Visual Effects
- Gradient backgrounds
- Glass morphism effects
- Smooth transitions and animations
- Hover effects on cards
- Pulsing indicators
- Shadow effects with color matching

## 🔧 Technical Stack

### Frontend
- **React 19.2.0**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Plotly.js**: Interactive charting library
- **Lucide React**: Icon library
- **Axios**: HTTP client
- **date-fns**: Date formatting

### Backend Integration
- **FastAPI**: REST API endpoints
- **SQLAlchemy**: Database ORM
- **PostgreSQL**: Data storage

## 📡 API Endpoints Used

### 1. `/api/state`
Returns current machine state and statistics:
```json
{
  "state": "RUN",
  "is_running": true,
  "current_cycle": 45,
  "today_runtime_sec": 18750,
  "last_updated": "2025-12-15T10:00:00"
}
```

### 2. `/api/cycles?date=YYYY-MM-DD`
Returns all production cycles for specified date:
```json
[
  {
    "cycle_no": 1,
    "start_time": "2025-12-15T08:05:30",
    "stop_time": "2025-12-15T08:12:45",
    "runtime_sec": 435
  }
]
```

## 🚀 Running the Dashboard

### Development Mode
```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

## ⚙️ Configuration

### API URL
Located in [`App.jsx`](src/App.jsx:10):
```javascript
const API_URL = "http://localhost:8000/api";
```

### Work Hours
Located in [`App.jsx`](src/App.jsx:11):
```javascript
const WORK_HOURS = 8.5; // 08:00 - 16:30 = 8.5 hours
```

### Refresh Rate
Data refreshes every 2 seconds (configurable in [`App.jsx`](src/App.jsx:42))

## 📱 Responsive Design

The dashboard is fully responsive and optimized for:
- **Desktop**: Full-width layout with side-by-side panels
- **Tablet**: Stacked layout with adjusted spacing
- **Mobile**: Single column layout (not recommended for production monitoring)

## 🎯 Key Metrics Explained

### Availability Calculation
```
Availability = (Total Runtime / Total Work Hours) × 100
```
- Work hours: 08:00 - 16:30 (8.5 hours)
- Measures how much time the machine was actually running vs. available time

### Cycle Counting
- Each RUN → STOP transition = 1 cycle
- Cycles are numbered sequentially per day
- Reset at midnight

### Runtime Accumulation
- Starts when machine enters RUN state
- Stops when machine enters STOP state
- Accumulated throughout the day
- Displayed in both HH:MM:SS and decimal hours

## 🔍 Troubleshooting

### No Data Showing
1. Check if backend API is running (`http://localhost:8000`)
2. Verify database connection
3. Check browser console for errors
4. Ensure camera feed is active during work hours (08:00-16:30)

### Chart Not Displaying
1. Ensure at least one complete cycle exists
2. Check if cycles have valid start_time and stop_time
3. Verify date format in API request

### Status Shows "INIT"
- Backend is starting up
- Wait a few seconds for initialization
- Check backend logs for errors

## 📊 Data Flow

```
Camera Feed → Spark Detector → State Machine → Database → FastAPI → React Dashboard
     ↓              ↓               ↓              ↓          ↓           ↓
  RTSP Stream   AI Model      Logic Engine    PostgreSQL   REST API   Plotly Chart
```

## 🎨 Customization

### Changing Colors
Edit Tailwind classes in [`App.jsx`](src/App.jsx):
- Running state: `text-green-400`, `bg-green-500`
- Stopped state: `text-red-400`, `bg-red-500`
- Accent colors: `blue-500`, `purple-500`, `cyan-500`

### Adjusting Layout
Modify grid classes:
- Main grid: `grid-cols-1 xl:grid-cols-12`
- KPI cards: `grid-cols-1 md:grid-cols-3`

### Chart Customization
Edit Plotly layout in [`App.jsx`](src/App.jsx:220-240):
- Colors: `line.color`
- Margins: `margin`
- Grid: `showgrid`, `gridcolor`

## 📝 Future Enhancements

- [ ] Historical data comparison
- [ ] Export data to CSV/Excel
- [ ] Alert notifications
- [ ] Multi-camera support
- [ ] Predictive maintenance indicators
- [ ] Performance analytics
- [ ] Custom date range selection
- [ ] Dark/Light theme toggle

## 🤝 Support

For issues or questions:
1. Check backend logs: `app/main.py`
2. Check state machine: `app/state_machine.py`
3. Verify API endpoints: `app/routers/`

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**License**: MIT
