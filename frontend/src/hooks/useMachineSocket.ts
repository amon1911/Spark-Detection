import { useState, useEffect } from 'react';
import { API_BASE } from '../lib/api';
import { MachineMetrics, MachineState, ChartDataPoint } from '../types';

export const useMachineSocket = () => {
  const [metrics, setMetrics] = useState<MachineMetrics>({
    machine_utilization: 0.0,
    oee: 85.0,
    totalSparks: 0,
    lastUpdated: new Date().toISOString(),
  });

  const [machineState, setMachineState] = useState<MachineState>('STOP');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summaryRes = await fetch(`${API_BASE}/summary/today`);
        if (!summaryRes.ok) return;
        const summaryData = await summaryRes.json();
        const stateRes = await fetch(`${API_BASE}/state`);
        if (!stateRes.ok) return;
        const stateData = await stateRes.json();
        const nowStr = new Date().toLocaleTimeString('th-TH');
        setMetrics(prev => ({
          ...prev,
          machine_utilization: summaryData.availability,
          oee: 85.0,
          lastUpdated: new Date().toISOString(),
        }));
        setMachineState(stateData.is_running ? 'RUN' : 'STOP');
        setChartData(prev => {
          const newData = [...prev, {
            time: nowStr,
            machine_utilization: summaryData.availability,
            oee: 85.0
          }];
          return newData.slice(-20);
        });
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return { metrics, machineState, chartData };
};