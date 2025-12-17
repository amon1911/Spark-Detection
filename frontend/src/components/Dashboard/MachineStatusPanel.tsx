import React from 'react';
import { CheckCircle, AlertTriangle, Camera } from 'lucide-react';
import { MachineState } from '../../types';

interface Props {
  state: MachineState;
}

export const MachineStatusPanel: React.FC<Props> = ({ state }) => {
  const isAlarm = state === 'ALARM_SPARK';
  const isRunning = state === 'RUN';
  const isStopped = state === 'STOP';

  const getStatusClasses = () => {
    if (isAlarm) {
      return 'from-red-900/30 via-red-800/20 to-red-900/10 border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-pulse';
    } else if (isRunning) {
      return 'from-green-900/30 via-emerald-800/20 to-green-900/10 border-green-500/40 shadow-[0_0_40px_rgba(34,197,94,0.4)]';
    } else {
      return 'from-yellow-900/30 via-amber-800/20 to-yellow-900/10 border-yellow-500/40 shadow-[0_0_40px_rgba(251,191,36,0.4)]';
    }
  };

  const getIconClasses = () => {
    if (isAlarm) {
      return 'text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-ping';
    } else if (isRunning) {
      return 'text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]';
    } else {
      return 'text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]';
    }
  };

  const label = isAlarm ? 'SPARK DETECTED!' : state;
  const subLabel = isAlarm ? 'Emergency Alert!' : isRunning ? 'Production Active' : 'Standby Ready';

  return (
    <div className="group relative w-full h-[480px] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900/50 to-black/70 border-4 border-gray-800/50 shadow-2xl backdrop-blur-xl hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] hover:border-white/20 transition-all duration-500 cursor-pointer">
      
      {/* Camera Feed */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900/80 via-slate-900/90 to-black/80">
        <div className="w-48 h-48 bg-gradient-to-br from-blue-900/50 to-cyan-900/30 rounded-2xl border-4 border-blue-500/30 shadow-2xl flex items-center justify-center animate-pulse">
          <Camera className="w-20 h-20 text-blue-400 opacity-70" strokeWidth={1.5} />
        </div>
        {/* Noise overlay for realism */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-50" />
      </div>

      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t ${getStatusClasses()} transition-all duration-1000 group-hover:opacity-90`} />

      {/* Status Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-10 backdrop-blur-sm bg-black/20">
        
        {/* Main Icon */}
        <div className={`p-16 rounded-3xl mb-8 transition-all duration-700 hover:scale-110 hover:rotate-3 ${getStatusClasses().includes('animate-pulse') ? 'animate-pulse' : ''}`}>
          {isAlarm ? (
            <AlertTriangle className={`w-28 h-28 ${getIconClasses()}`} strokeWidth={2} />
          ) : (
            <CheckCircle className={`w-28 h-28 ${getIconClasses()}`} strokeWidth={2} />
          )}
        </div>

        {/* Labels */}
        <div className="space-y-3">
          <h2 className="text-xl font-black uppercase tracking-[0.2em] text-white/80 bg-gradient-to-r from-white/50 to-gray-300/50 bg-clip-text">
            Machine Status
          </h2>
          <div className={`text-6xl md:text-7xl font-black uppercase tracking-widest bg-clip-text text-transparent drop-shadow-2xl transition-all duration-500 ${isAlarm ? 'bg-gradient-to-r from-red-400 via-red-500 to-red-600 animate-pulse' : isRunning ? 'bg-gradient-to-r from-green-400 via-emerald-400 to-green-500' : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500'}`}>
            {label}
          </div>
          <p className={`text-lg font-semibold tracking-wide ${isAlarm ? 'text-red-200/90' : isRunning ? 'text-green-200/90' : 'text-yellow-200/90'}`}>
            {subLabel}
          </p>
        </div>

      </div>

      {/* Live Indicator */}
      <div className="absolute top-6 right-6 w-6 h-6 bg-green-500 rounded-full border-4 border-green-900/50 shadow-lg animate-ping z-20" />
      <div className="absolute top-6 right-6 w-4 h-4 bg-green-400 rounded-full shadow-md z-30" />

      {/* Decorative Glow Lines */}
      <div className="absolute -top-2 -right-2 w-32 h-32 bg-gradient-to-r from-cyan-500/20 to-blue-500/10 rounded-full blur-xl animate-pulse opacity-60" />
      <div className="absolute -bottom-2 -left-2 w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/10 rounded-full blur-xl opacity-50" />

    </div>
  );
};