import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Zap, Clock, CheckCircle, AlertOctagon, Server, Camera, Wifi, TrendingUp, Calendar, BarChart3, Activity
} from 'lucide-react';
import { format } from 'date-fns';
import DowntimeControlPanel from './components/Dashboard/DowntimeControlPanel';


const API_URL = "/api";
const TOTAL_WORK_HOURS = 7.5;

function App() {
  const [stateData, setStateData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [time, setTime] = useState(new Date());
  const [cameraStatus, setCameraStatus] = useState('active');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const chartTimes = ['08:30', '09:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30', '16:30'];
    const initialChartData = chartTimes.map((time, i) => ({
      time,
      availability: Number((85 + Math.sin(i * 0.5) * 10).toFixed(1))
    }));
    setChartData(initialChartData);

    const initialLogs = [
      {time: '10:48', msg: 'Cycle #47 completed successfully', status: 'OK'},
      {time: '10:45', msg: 'Machine transitioned to RUN state', status: 'OK'},
      {time: '10:42', msg: 'Minor spark detected - auto cleared', status: 'WARNING'},
      {time: '10:39', msg: 'Cycle #46 completed', status: 'OK'},
      {time: '10:36', msg: 'Daily production started', status: 'OK'},
    ];
    setLogs(initialLogs);
  }, []);

  const fetchData = async () => {
    try {
      const resState = await axios.get(`${API_URL}/state`);
      setStateData(resState.data);
      
      const resSummary = await axios.get(`${API_URL}/summary/today`);
      setSummaryData(resSummary.data);
      
      setCameraStatus('active');
      setLoading(false);

      // Update chart with real availability
      const runtimeSec = resState.data.today_runtime_sec || 0;
      const totalWorkSeconds = TOTAL_WORK_HOURS * 3600;
      const availability = resSummary.data.availability !== undefined ? resSummary.data.availability.toFixed(1) : ((runtimeSec / totalWorkSeconds) * 100).toFixed(1);
      // Update the last data point with current availability (immutable)
      setChartData(prev =>
        prev.map((point, index) =>
          index === prev.length - 1
            ? { ...point, availability: parseFloat(availability) }
            : point
        )
      );
    } catch (err) {
      console.error("API Error:", err);
      setCameraStatus('error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const isRunning = stateData?.state === "RUN";
  const runtimeSec = stateData?.today_runtime_sec || 0;
  const runtimeHours = (runtimeSec / 3600).toFixed(2);
  const totalWorkSeconds = TOTAL_WORK_HOURS * 3600;
  const availability = summaryData?.availability !== undefined ? summaryData.availability.toFixed(1) : ((runtimeSec / totalWorkSeconds) * 100).toFixed(1);

  const downtimeSec = summaryData?.total_downtime_sec || 0;
  const downtimeHours = (downtimeSec / 3600).toFixed(2);

  const formatRuntime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const themeColor = isRunning ? 'from-green-900/20 to-green-950/10' : 'from-red-900/20 to-red-950/10';
  const borderColor = isRunning ? 'border-green-500/30' : 'border-red-500/30';
  const iconColor = isRunning ? 'text-green-400' : 'text-red-400';

  if (loading) {
    return (
      <div className="min-h-screen text-gray-100">
        <header className="bg-[#111827]/80 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-40">
          <div className="max-w-[1920px] mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20 animate-pulse"></div>
                <div className="animate-pulse">
                  <div className="h-8 w-48 bg-gray-700 rounded"></div>
                  <div className="h-4 w-32 bg-gray-800 rounded mt-1"></div>
                </div>
              </div>
              <div className="flex items-center gap-6 animate-pulse">
                <div className="h-6 w-32 bg-gray-700 rounded"></div>
                <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-[1920px] mx-auto px-6 py-8 pb-24">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-3 space-y-6">
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-2xl p-8 h-[320px] animate-pulse"></div>
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-xl p-6 h-[280px] animate-pulse"></div>
            </div>
            <div className="xl:col-span-9 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({length: 3}).map((_, i) => (
                  <div key={i} className="bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-xl p-6 h-56 animate-pulse"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({length: 2}).map((_, i) => (
                  <div key={i} className="bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-2xl p-6 h-[450px] animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <footer className="fixed bottom-0 left-0 right-0 bg-[#111827]/95 backdrop-blur-xl border-t border-gray-800/50 px-6 py-3 z-30">
          <div className="max-w-[1920px] mx-auto flex justify-between items-center text-xs text-gray-500 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-4 w-40 bg-gray-700 rounded"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-700 rounded"></div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-100">
      
      {/* HEADER */}
      <header className="bg-[#111827]/80 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20">
                <Zap className="text-white" size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  SPARK VISION GUARD
                </h1>
                <p className="text-xs text-gray-500 uppercase tracking-[0.15em] font-medium">
                  Industrial Monitoring System
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm font-bold text-white tabular-nums">
                  {format(time, 'dd MMM yyyy')}
                </div>
                <div className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">
                  {format(time, 'HH:mm:ss')}
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full ${isRunning ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}`}></div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-[1920px] mx-auto px-6 py-6 pb-16">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN - STATUS PANEL */}
          <div className="xl:col-span-3 space-y-4">
            
            {/* MACHINE STATUS CARD */}
            <div className={`bg-gradient-to-br ${themeColor} rounded-2xl p-6 border-2 ${borderColor} relative overflow-hidden shadow-2xl`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${isRunning ? 'from-green-500/5' : 'from-red-500/5'} to-transparent`}></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Machine Status</h2>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${isRunning ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    LIVE
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center py-6">
                  <div className={`mb-6 p-8 rounded-full ${isRunning ? 'bg-green-500/10 border-2 border-green-500/30' : 'bg-red-500/10 border-2 border-red-500/30'} transition-all duration-500`}>
                    {isRunning ?
                      <CheckCircle size={72} className="text-green-400" strokeWidth={2} /> :
                      <AlertOctagon size={72} className="text-red-400" strokeWidth={2} />
                    }
                  </div>
                  
                  <div className={`text-6xl font-black tracking-wider mb-2 ${iconColor} drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]`}>
                    {stateData?.state || "INIT"}
                  </div>
                  
                  <div className="text-sm text-gray-500 font-medium">
                    {isRunning ? 'Production Active' : 'Machine Idle'}
                  </div>
                </div>
              </div>
            </div>

            {/* SYSTEM STATUS CARD */}
            <div className="bg-[#111827] rounded-xl p-6 border border-gray-800/50 shadow-xl">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">System Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <Wifi size={18} className="text-green-400" />
                    <span className="text-sm font-medium text-gray-300">Backend API</span>
                  </div>
                  <span className="text-xs font-bold text-green-400 px-2 py-1 bg-green-500/10 rounded">ONLINE</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <Camera size={18} className={cameraStatus === 'active' ? 'text-blue-400' : 'text-red-400'} />
                    <span className="text-sm font-medium text-gray-300">Camera Feed</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${cameraStatus === 'active' ? 'text-blue-400 bg-blue-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {cameraStatus === 'active' ? 'ACTIVE' : 'ERROR'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <Server size={18} className="text-purple-400" />
                    <span className="text-sm font-medium text-gray-300">Database</span>
                  </div>
                  <span className="text-xs font-bold text-purple-400 px-2 py-1 bg-purple-500/10 rounded">CONNECTED</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="xl:col-span-9 space-y-4">
            
            {/* KPI CARDS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* TOTAL RUNTIME */}
              <div className="bg-gradient-to-br from-purple-900/20 to-purple-950/10 rounded-xl p-6 border border-purple-500/20 shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-purple-400" />
                      <p className="text-xs uppercase font-bold tracking-wider text-gray-400">Total Runtime</p>
                    </div>
                    <h3 className="text-5xl font-black text-white font-mono tabular-nums group-hover:scale-105 transition-transform">
                      {formatRuntime(runtimeSec)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{runtimeHours} hours active</p>
                  </div>
                  <div className="p-4 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                    <Clock size={32} className="text-purple-400" strokeWidth={2} />
                  </div>
                </div>
                <div className="w-full bg-gray-800/50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 shadow-lg shadow-purple-500/50"
                    style={{ width: `${Math.min(100, (runtimeSec / totalWorkSeconds) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* TOTAL DOWNTIME */}
              <div className="bg-gradient-to-br from-orange-900/20 to-orange-950/10 rounded-xl p-6 border border-orange-500/20 shadow-xl hover:shadow-orange-500/10 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertOctagon size={16} className="text-orange-400" />
                      <p className="text-xs uppercase font-bold tracking-wider text-gray-400">Total Downtime</p>
                    </div>
                    <h3 className="text-5xl font-black text-white font-mono tabular-nums group-hover:scale-105 transition-transform">
                      {formatRuntime(downtimeSec)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{downtimeHours} hours downtime</p>
                  </div>
                  <div className="p-4 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                    <AlertOctagon size={32} className="text-orange-400" strokeWidth={2} />
                  </div>
                </div>
                <div className="w-full bg-gray-800/50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500 shadow-lg shadow-orange-500/50"
                    style={{ width: `${Math.min(100, (downtimeSec / totalWorkSeconds) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* AVAILABILITY */}
              <div className="bg-gradient-to-br from-green-900/20 to-green-950/10 rounded-xl p-6 border border-green-500/20 shadow-xl hover:shadow-green-500/10 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-green-400" />
                      <p className="text-xs uppercase font-bold tracking-wider text-gray-400">Machine Utilization (%)</p>
                    </div>
                    <h3 className="text-5xl font-black text-white tabular-nums group-hover:scale-105 transition-transform">
                      {availability}<span className="text-3xl">%</span>
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">machine uptime ratio</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                    <TrendingUp size={32} className="text-green-400" strokeWidth={2} />
                  </div>
                </div>
                <div className="w-full bg-gray-800/50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-lg shadow-green-500/50"
                    style={{ width: `${Math.min(100, parseFloat(availability))}%` }}
                  ></div>
                </div>
              </div>
            </div>


            {/* DOWNTIME CONTROL PANEL */}
            <DowntimeControlPanel />
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#111827]/95 backdrop-blur-xl border-t border-gray-800/50 px-6 py-3 z-30">
        <div className="max-w-[1920px] mx-auto flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>© 2025 Spark Vision Guard</span>
            <span className="text-gray-700">|</span>
            <span>Version 1.0.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span>Last updated: {format(time, 'HH:mm:ss')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;