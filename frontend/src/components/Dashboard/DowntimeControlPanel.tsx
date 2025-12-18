import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../lib/api';
import {
  AlertCircle,
  Clock,
  Wrench,
  Settings,
  Power,
  StopCircle,
  PlayCircle,
  Download
} from 'lucide-react';

interface DowntimeLog {
  id: number;
  start_time: string;
  end_time: string | null;
  downtime_reason: string;
  duration_sec: number | null;
  date: string;
  is_active: boolean;
}

interface ActiveDowntimeResponse {
  is_active: boolean;
  current_downtime: DowntimeLog | null;
}

interface DowntimeSummary {
  [key: string]: number;
}

const DOWNTIME_REASONS = [
  { id: 'SETUP_DIE', label: 'SETUP DIE', icon: Settings, color: 'blue' },
  { id: 'REPAIR', label: 'เครื่องขัดข้อง/alarm', icon: Wrench, color: 'red' },
  { id: 'MAINTENANCE', label: 'บำรุงรักษา', icon: Settings, color: 'yellow' },
  { id: 'MATERIAL_SHORTAGE', label: 'รอวัตถุดิบ', icon: AlertCircle, color: 'orange' },
  { id: 'POWER_FAILURE', label: 'ไฟฟ้าขัดข้อง', icon: Power, color: 'purple' },
  { id: 'QUALITY_CHECK', label: 'ตรวจสอบคุณภาพ', icon: Settings, color: 'green' },
  { id: 'WAITING_APPROVAL', label: 'รอการอนุมัติ', icon: Clock, color: 'gray' },
  { id: 'OPERATOR_BREAK', label: 'พักผ่อน', icon: Clock, color: 'cyan' },
  { id: 'OTHER_1', label: 'อื่นๆ 1', icon: AlertCircle, color: 'slate' },
  { id: 'OTHER_2', label: 'อื่นๆ 2', icon: AlertCircle, color: 'slate' },
];

const DowntimeControlPanel: React.FC = () => {
  const [activeDowntime, setActiveDowntime] = useState<ActiveDowntimeResponse>({
    is_active: false,
    current_downtime: null
  });
  const [downtimeSummary, setDowntimeSummary] = useState<DowntimeSummary>({});
  const [topDowntimes, setTopDowntimes] = useState<DowntimeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [exportType, setExportType] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [exportDate, setExportDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  });

  // Fetch active downtime status
  const fetchActiveDowntime = async () => {
    try {
      const response = await axios.get<ActiveDowntimeResponse>(`${API_BASE}/downtime/active`);
      setActiveDowntime(response.data);
    } catch (error: any) {
      if (error.code !== 'ERR_NETWORK') {
        console.error('Error fetching active downtime:', error);
      }
      // Ignore network errors to prevent console spam
    }
  };

  // Fetch downtime summary for today
  const fetchDowntimeSummary = async () => {
    try {
      const response = await axios.get<DowntimeSummary>(`${API_BASE}/downtime/summary/today`);
      setDowntimeSummary(response.data);
    } catch (error: any) {
      if (error.code !== 'ERR_NETWORK') {
        console.error('Error fetching downtime summary:', error);
      }
    }
  };

  // Fetch top 10 downtimes today
  const fetchTopDowntimes = async () => {
    try {
      const response = await axios.get<DowntimeLog[]>(`${API_BASE}/downtime/top-today`);
      setTopDowntimes(response.data);
    } catch (error: any) {
      if (error.code !== 'ERR_NETWORK') {
        console.error('Error fetching top downtimes:', error);
      }
    }
  };

  useEffect(() => {
    // Fetch initial data
    fetchDowntimeSummary();
    fetchTopDowntimes();
    fetchActiveDowntime();
    
    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchDowntimeSummary();
      fetchTopDowntimes();
      fetchActiveDowntime();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate current duration
  useEffect(() => {
    if (activeDowntime.is_active && activeDowntime.current_downtime) {
      const interval = setInterval(() => {
        const start = new Date(activeDowntime.current_downtime!.start_time);
        const now = new Date();
        const duration = Math.floor((now.getTime() - start.getTime()) / 1000);
        setCurrentDuration(duration);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCurrentDuration(0);
    }
  }, [activeDowntime]);

  const handleStartDowntime = async (reason: string) => {
    if (activeDowntime.is_active) {
      alert('มี downtime ที่กำลังดำเนินการอยู่แล้ว กรุณาหยุดก่อน');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/downtime/start`, { downtime_reason: reason });
      // Optimistic update for UI
      const now = new Date().toISOString();
      setActiveDowntime({
        is_active: true,
        current_downtime: {
          id: Date.now(),
          start_time: now,
          end_time: null,
          downtime_reason: reason,
          duration_sec: null,
          date: now.split('T')[0],
          is_active: true
        }
      });
    } catch (error: any) {
      alert(error.response?.data?.detail || 'เกิดข้อผิดพลาดในการเริ่ม downtime');
    } finally {
      setLoading(false);
    }
  };

  const handleStopDowntime = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/downtime/stop`);
      // Optimistic update for UI
      setActiveDowntime({ is_active: false, current_downtime: null });
      setCurrentDuration(0);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'เกิดข้อผิดพลาดในการหยุด downtime');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      let url = `${API_BASE}/downtime/export?report_type=${exportType}&year=${exportDate.year}`;
      
      if (exportType === 'monthly' || exportType === 'daily') {
        url += `&month=${exportDate.month}`;
      }
      
      if (exportType === 'daily') {
        url += `&day=${exportDate.day}`;
      }

      const response = await axios.get(url, { responseType: 'blob' });
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      let filename;
      const y = String(exportDate.year);
      const m = String(exportDate.month).padStart(2, '0');
      const d = String(exportDate.day).padStart(2, '0');
      if (exportType === 'daily') {
        filename = `Daily_Report_${y}-${m}-${d}.xlsx`;
      } else if (exportType === 'monthly') {
        filename = `Monthly_Report_${y}-${m}.xlsx`;
      } else {
        filename = `Yearly_Report_${y}.xlsx`;
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการ export รายงาน');
      console.error('Export error:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; hover: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-500/10', hover: 'hover:bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
      red: { bg: 'bg-red-500/10', hover: 'hover:bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
      yellow: { bg: 'bg-yellow-500/10', hover: 'hover:bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
      orange: { bg: 'bg-orange-500/10', hover: 'hover:bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
      purple: { bg: 'bg-purple-500/10', hover: 'hover:bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
      green: { bg: 'bg-green-500/10', hover: 'hover:bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
      gray: { bg: 'bg-gray-500/10', hover: 'hover:bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
      cyan: { bg: 'bg-cyan-500/10', hover: 'hover:bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
      slate: { bg: 'bg-slate-500/10', hover: 'hover:bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Downtime Status - ลดขนาดลง */}
        <div className="lg:col-span-1 bg-gradient-to-br from-slate-900/30 to-slate-800/20 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-800/50">
            <div className={`p-2 rounded-xl border ${
              activeDowntime.is_active
                ? 'bg-red-500/15 border-red-500/30'
                : 'bg-green-500/15 border-green-500/30'
            }`}>
              {activeDowntime.is_active ? (
                <StopCircle size={20} className="text-red-400" strokeWidth={2} />
              ) : (
                <PlayCircle size={20} className="text-green-400" strokeWidth={2} />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                Downtime Status
              </h3>
              <p className="text-xs text-slate-500">สถานะปัจจุบัน</p>
            </div>
          </div>

          {activeDowntime.is_active && activeDowntime.current_downtime ? (
            <>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 mb-3">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">สาเหตุ</p>
                    <p className="text-sm font-bold text-red-400">
                      {DOWNTIME_REASONS.find(r => r.id === activeDowntime.current_downtime?.downtime_reason)?.label ||
                       activeDowntime.current_downtime.downtime_reason}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">เวลาเริ่ม</p>
                    <p className="text-sm font-bold text-white font-mono">
                      {new Date(activeDowntime.current_downtime.start_time).toLocaleTimeString('th-TH')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">ระยะเวลา</p>
                    <p className="text-sm font-bold text-orange-400 font-mono tabular-nums">
                      {formatDuration(currentDuration)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleStopDowntime}
                disabled={loading}
                className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-bold border border-red-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <StopCircle size={18} />
                หยุด Downtime
              </button>
            </>
          ) : (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 text-center">
              <p className="text-sm font-bold text-green-400">
                ✓ เครื่องทำงานปกติ
              </p>
            </div>
          )}
        </div>

        {/* Downtime Summary - กล่องใหม่ข้างขวา */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/30 to-slate-800/20 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800/50">
            <div className="p-2 bg-orange-500/15 rounded-xl border border-orange-500/30">
              <Clock size={20} className="text-orange-400" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-black bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent tracking-tight">
                สรุปเวลา Downtime วันนี้
              </h3>
              <p className="text-xs text-slate-500">เวลารวมแต่ละประเภท</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {DOWNTIME_REASONS.map((reason) => {
              const Icon = reason.icon;
              const colors = getColorClasses(reason.color);
              const totalSeconds = downtimeSummary[reason.id] || 0;
              return (
                <div
                  key={reason.id}
                  className={`${colors.bg} border ${colors.border} rounded-lg p-2`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} className={colors.text} strokeWidth={2} />
                    <span className={`text-xs font-bold ${colors.text}`}>
                      {reason.label}
                    </span>
                  </div>
                  <p className={`text-lg font-bold ${colors.text} font-mono tabular-nums`}>
                    {formatDuration(totalSeconds)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Downtime Reason Buttons */}
      <div className="bg-gradient-to-br from-slate-900/30 to-slate-800/20 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 shadow-xl">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800/50">
          <div className="p-3 bg-orange-500/15 rounded-2xl border border-orange-500/30">
            <AlertCircle size={28} className="text-orange-400" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-xl font-black bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent tracking-tight">
              เลือกสาเหตุ Downtime
            </h3>
            <p className="text-sm text-slate-500 mt-1">กดปุ่มเพื่อบันทึกสาเหตุการหยุดเครื่อง</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {DOWNTIME_REASONS.map((reason) => {
            const Icon = reason.icon;
            const colors = getColorClasses(reason.color);
            return (
              <button
                key={reason.id}
                onClick={() => handleStartDowntime(reason.id)}
                disabled={loading || activeDowntime.is_active}
                className={`${colors.bg} ${colors.hover} border ${colors.border} rounded-xl p-3 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-3 ${colors.bg} rounded-xl border ${colors.border} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className={colors.text} strokeWidth={2} />
                  </div>
                  <span className={`text-sm font-bold ${colors.text} text-center`}>
                    {reason.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Export Report Section */}
      <div className="bg-gradient-to-br from-slate-900/30 to-slate-800/20 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 shadow-xl">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800/50">
          <div className="p-3 bg-purple-500/15 rounded-2xl border border-purple-500/30">
            <Download size={28} className="text-purple-400" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
              Export รายงาน Downtime
            </h3>
            <p className="text-sm text-slate-500 mt-1">ดาวน์โหลดรายงานเป็นไฟล์ Excel</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Report Type Selection */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">ประเภทรายงาน</label>
            <div className="grid grid-cols-3 gap-3">
              {(['daily', 'monthly', 'yearly'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setExportType(type)}
                  className={`px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
                    exportType === type
                      ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/50'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
                  }`}
                >
                  {type === 'daily' ? 'รายวัน' : type === 'monthly' ? 'รายเดือน' : 'รายปี'}
                </button>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">เลือกวันที่</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <input
                  type="number"
                  value={exportDate.year}
                  onChange={(e) => setExportDate({ ...exportDate, year: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500/50"
                  placeholder="ปี"
                />
              </div>
              {(exportType === 'monthly' || exportType === 'daily') && (
                <div>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={exportDate.month}
                    onChange={(e) => setExportDate({ ...exportDate, month: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500/50"
                    placeholder="เดือน"
                  />
                </div>
              )}
              {exportType === 'daily' && (
                <div>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={exportDate.day}
                    onChange={(e) => setExportDate({ ...exportDate, day: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500/50"
                    placeholder="วัน"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleExportReport}
          className="mt-4 w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20"
        >
          <Download size={20} />
          ดาวน์โหลดรายงาน (.xlsx)
        </button>
      </div>
    </div>
  );
};

export default DowntimeControlPanel;
