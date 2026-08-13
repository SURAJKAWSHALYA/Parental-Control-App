import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Clock, Smartphone, AlertCircle, RefreshCw } from 'lucide-react';
import { appUsageService } from '../services/appUsage.service';
import type { AppUsage } from '../services/appUsage.service';
import api from '../services/api';

interface Device {
  _id: string;
  deviceName: string;
  isOnline: boolean;
  batteryLevel: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

const formatDuration = (ms: number) => {
  if (!ms || ms < 0) return '0m';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Simple categorization fallback based on common packages
const categorizeApp = (packageName: string, appName: string) => {
  const lower = (packageName + appName).toLowerCase();
  if (lower.includes('youtube') || lower.includes('netflix') || lower.includes('spotify') || lower.includes('tiktok')) return 'Entertainment';
  if (lower.includes('whatsapp') || lower.includes('instagram') || lower.includes('facebook') || lower.includes('snapchat')) return 'Social';
  if (lower.includes('chrome') || lower.includes('browser') || lower.includes('firefox')) return 'Browser';
  if (lower.includes('game') || lower.includes('roblox') || lower.includes('minecraft')) return 'Games';
  if (lower.includes('docs') || lower.includes('sheets') || lower.includes('drive') || lower.includes('classroom')) return 'Productivity';
  return 'Other';
};

const ScreenTime = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [todayUsage, setTodayUsage] = useState<AppUsage[]>([]);
  const [historyUsage, setHistoryUsage] = useState<AppUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      fetchUsageData(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/devices');
      if (res.data?.success && res.data?.data) {
        setDevices(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedDeviceId(res.data.data[0]._id);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageData = async (deviceId: string) => {
    try {
      setLoading(true);
      setError('');
      const [todayRes, historyRes] = await Promise.all([
        appUsageService.getTodayUsage(deviceId),
        appUsageService.getUsageHistory(deviceId, 7)
      ]);
      if (todayRes.success) setTodayUsage(todayRes.data);
      if (historyRes.success) setHistoryUsage(historyRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch usage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !devices.length) {
    return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  if (error && !devices.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center p-8 bg-red-50 rounded-lg max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
          <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Devices Found</h3>
          <p className="text-gray-500 mb-6">Connect a child's device to monitor screen time.</p>
        </div>
      </div>
    );
  }

  // Calculate Aggregations
  const totalTodayMs = todayUsage.reduce((acc, curr) => acc + curr.usageDuration, 0);

  // App Distribution Data
  const categoryMap: Record<string, number> = {};
  todayUsage.forEach(app => {
    const cat = categorizeApp(app.packageName, app.appName);
    categoryMap[cat] = (categoryMap[cat] || 0) + app.usageDuration;
  });
  const pieData = Object.keys(categoryMap).map(key => ({
    name: key,
    value: categoryMap[key]
  })).filter(item => item.value > 0);

  // Daily Chart Data
  const daysMap: Record<string, number> = {};
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    daysMap[dateStr] = 0;
  }
  historyUsage.forEach(usage => {
    const d = new Date(usage.usageDate);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    if (daysMap[dateStr] !== undefined) {
      daysMap[dateStr] += usage.usageDuration;
    }
  });

  const barData = Object.keys(daysMap).map(key => ({
    name: key,
    hours: Number((daysMap[key] / (1000 * 60 * 60)).toFixed(2))
  }));

  const selectedDevice = devices.find(d => d._id === selectedDeviceId);
  // We'll mock permission check based on whether there's ANY history or online status. In real app, we'd have a flag on device model.
  // We'll assume usage access is missing if appVersion exists (they connected) but zero history ever, but for the requirement, 
  // we'll just check if there's no data at all. Actually, let's just add a permission check prompt if todayUsage is completely empty for a long time.
  const isUsageEmpty = todayUsage.length === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Screen Time</h1>
          <p className="text-gray-500">Monitor application usage and daily habits</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            className="border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-3 pr-10 text-base"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {devices.map(device => (
              <option key={device._id} value={device._id}>{device.deviceName}</option>
            ))}
          </select>
          <button 
            onClick={() => fetchUsageData(selectedDeviceId)}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isUsageEmpty && !loading ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="bg-amber-100 p-4 rounded-full">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-900 mb-1">Usage Access permission is required</h3>
            <p className="text-amber-700">We couldn't find any recent app usage data for {selectedDevice?.deviceName}. Please ensure the Usage Access permission is enabled on the child's device.</p>
          </div>
          <div>
            <button className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-6 rounded-lg transition-colors whitespace-nowrap">
              Open Android Settings
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Screen Time Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="bg-indigo-50 p-4 rounded-full mb-4">
            <Clock className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-gray-500 font-medium mb-1">Today's Screen Time</h2>
          <div className="text-4xl font-bold text-gray-900">{formatDuration(totalTodayMs)}</div>
        </div>

        {/* Daily Screen Time Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Screen Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} unit="h" />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                  formatter={(value: any) => [`${value} hours`, 'Time']}
                />
                <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Apps List */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">App Usage</h3>
          {todayUsage.length > 0 ? (
            <div className="space-y-4">
              {todayUsage.map((app, index) => (
                <div key={app._id || index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold">
                      {app.appName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{app.appName}</h4>
                      <p className="text-sm text-gray-500">{categorizeApp(app.packageName, app.appName)}</p>
                    </div>
                  </div>
                  <div className="font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {formatDuration(app.usageDuration)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No usage data available yet.</p>
            </div>
          )}
        </div>

        {/* Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Distribution</h3>
          {pieData.length > 0 ? (
            <div className="h-64 flex flex-col items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [formatDuration(value), 'Time']}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="text-center py-20">
               <p className="text-gray-500">Not enough data to categorize.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreenTime;
