import React, { useState, useEffect } from 'react';
import { Users, Smartphone, ShieldAlert, Clock, Activity, Loader2 } from 'lucide-react';
import { SummaryCard } from '../components/cards/SummaryCard';
import { ChartCard } from '../components/cards/ChartCard';
import { FamilyInsights } from '../components/FamilyInsights';
import { FamilyActivityFeed } from '../components/FamilyActivityFeed';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const Dashboard = () => {
  const [summary, setSummary] = useState({
    childrenCount: 0,
    devicesCount: 0,
    safetyAlerts: 0,
    screenTime: '0m',
  });
  const [trends, setTrends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrendsLoading, setIsTrendsLoading] = useState(true);
  const { socket } = useSocket();

  const fetchSummary = async () => {
    try {
      const res = await api.get('/analytics/summary');
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching summary', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const res = await api.get('/analytics/trends?type=screen_time&days=7');
      if (res.data.success) {
        setTrends(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching trends', err);
    } finally {
      setIsTrendsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchTrends();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchSummary();
      // Only refetch trends if necessary, but good to keep synced.
    };
    
    // Listen to real-time events that would update the dashboard summary
    socket.on('dashboard:updated', handleUpdate);
    socket.on('analytics:updated', handleUpdate);
    socket.on('activity:new', handleUpdate);
    socket.on('alert:new', handleUpdate);
    
    return () => {
      socket.off('dashboard:updated', handleUpdate);
      socket.off('analytics:updated', handleUpdate);
      socket.off('activity:new', handleUpdate);
      socket.off('alert:new', handleUpdate);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Family Overview</h2>
        <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/20">
          System Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Children" 
          value={summary.childrenCount} 
          icon={Users} 
          colorClass="bg-blue-500 shadow-lg shadow-blue-500/20" 
          link="/children"
          isLoading={isLoading}
        />
        <SummaryCard 
          title="Online Devices" 
          value={summary.devicesCount} 
          icon={Smartphone} 
          colorClass="bg-indigo-500 shadow-lg shadow-indigo-500/20" 
          link="/devices"
          isLoading={isLoading}
        />
        <SummaryCard 
          title="Safety Alerts" 
          value={summary.safetyAlerts} 
          icon={ShieldAlert} 
          colorClass="bg-red-500 shadow-lg shadow-red-500/20" 
          link="/alerts"
          isLoading={isLoading}
        />
        <SummaryCard 
          title="Total Screen Time" 
          value={summary.screenTime} 
          icon={Clock} 
          colorClass="bg-emerald-500 shadow-lg shadow-emerald-500/20" 
          link="/screen-time"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ChartCard 
            title="Screen Time Trend (Last 7 Days)" 
            data={trends} 
            xKey="date" 
            yKey="hours" 
            type="area" 
            color="#3b82f6" 
            isLoading={isTrendsLoading}
            valueFormatter={(val) => `${val}h`}
          />
          <FamilyInsights />
        </div>
        <div className="lg:col-span-1 h-[800px]">
          <FamilyActivityFeed />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
