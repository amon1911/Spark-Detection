export interface MachineMetrics {
  machine_utilization: number;
  oee: number;
  totalSparks: number;
  lastUpdated: string;
}

export type MachineState = 'RUN' | 'STOP' | 'ALARM_SPARK';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
}

export interface ChartDataPoint {
  time: string;
  machine_utilization: number;
  oee: number;
}