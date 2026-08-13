import { useState, useEffect } from 'react';
import { Moon, Clock, RefreshCw, AlertCircle, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import { appUsageService } from '../services/appUsage.service';
import type { AppUsage } from '../services/appUsage.service';

interface Device {
  _id: string;
  deviceName: string;
}

interface DowntimeSchedule {
  _id: string;
  name: string;
  days: number[];
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface AllowedApp {
  _id: string;
  packageName: string;
  appName: string;
  allowedDuringDowntime: boolean;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Downtime = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [schedules, setSchedules] = useState<DowntimeSchedule[]>([]);
  const [allowedApps, setAllowedApps] = useState<AllowedApp[]>([]);
  const [allApps, setAllApps] = useState<AppUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      fetchData(selectedDeviceId);
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
    } catch (err) {
      setError('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (deviceId: string) => {
    try {
      setLoading(true);
      const [schedulesRes, allowedRes, usageRes] = await Promise.all([
        api.get(`/downtime/${deviceId}`),
        api.get(`/allowed-apps/${deviceId}`),
        appUsageService.getTodayUsage(deviceId)
      ]);
      if (schedulesRes.data.success) setSchedules(schedulesRes.data.data);
      if (allowedRes.data.success) setAllowedApps(allowedRes.data.data);
      if (usageRes.success) setAllApps(usageRes.data);
    } catch (err) {
      setError('Failed to fetch downtime data');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (schedule: DowntimeSchedule, dayIndex: number) => {
    const newDays = schedule.days.includes(dayIndex)
      ? schedule.days.filter(d => d !== dayIndex)
      : [...schedule.days, dayIndex].sort();
    updateSchedule(schedule._id, { days: newDays });
  };

  const addSchedule = async () => {
    try {
      await api.post('/downtime', {
        deviceId: selectedDeviceId,
        name: 'New Schedule',
        days: [1, 2, 3, 4, 5],
        startTime: '22:00',
        endTime: '07:00',
        enabled: true
      });
      fetchData(selectedDeviceId);
    } catch (err) {
      setError('Failed to create schedule');
    }
  };

  const updateSchedule = async (id: string, updates: Partial<DowntimeSchedule>) => {
    try {
      await api.put(`/downtime/${id}`, updates);
      fetchData(selectedDeviceId);
    } catch (err) {
      setError('Failed to update schedule');
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      await api.delete(`/downtime/${id}`);
      fetchData(selectedDeviceId);
    } catch (err) {
      setError('Failed to delete schedule');
    }
  };

  const toggleAllowedApp = async (app: AppUsage) => {
    try {
      const existing = allowedApps.find(a => a.packageName === app.packageName);
      if (existing) {
        await api.delete(`/allowed-apps/${existing._id}`);
      } else {
        await api.post('/allowed-apps', {
          deviceId: selectedDeviceId,
          packageName: app.packageName,
          appName: app.appName,
          allowedDuringDowntime: true
        });
      }
      fetchData(selectedDeviceId);
    } catch (err) {
      setError('Failed to update allowed apps');
    }
  };

  if (loading && !devices.length) {
    return <div className="flex h-full items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Downtime & Exceptions</h1>
          <p className="text-gray-500">Block device access during specific hours</p>
        </div>
        
        <select 
          className="border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-3 pr-10"
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
        >
          {devices.map(device => (
            <option key={device._id} value={device._id}>{device.deviceName}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Schedules Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-600" />
            Downtime Schedules
          </h2>
          <button 
            onClick={addSchedule}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Schedule
          </button>
        </div>

        {schedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No downtime schedules configured.
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map(schedule => (
              <div key={schedule._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={schedule.name}
                      onChange={(e) => updateSchedule(schedule._id, { name: e.target.value })}
                      className="text-lg font-semibold bg-transparent border-none focus:ring-0 p-0 text-gray-900 mb-1"
                    />
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <input 
                          type="time" 
                          value={schedule.startTime}
                          onChange={(e) => updateSchedule(schedule._id, { startTime: e.target.value })}
                          className="bg-transparent border-none p-0 focus:ring-0 text-sm"
                        />
                        <span>to</span>
                        <input 
                          type="time" 
                          value={schedule.endTime}
                          onChange={(e) => updateSchedule(schedule._id, { endTime: e.target.value })}
                          className="bg-transparent border-none p-0 focus:ring-0 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={schedule.enabled}
                        onChange={() => updateSchedule(schedule._id, { enabled: !schedule.enabled })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                    <button 
                      onClick={() => deleteSchedule(schedule._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Days selection */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {DAYS_OF_WEEK.map((day, index) => {
                    const isSelected = schedule.days.includes(index);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(schedule, index)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                          isSelected 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {day.charAt(0)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Allowed Apps Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Allowed Apps During Downtime</h2>
          <p className="text-sm text-gray-500">Select which apps can always be accessed (e.g. Phone, Messages).</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {allApps.map(app => {
            const isAllowed = allowedApps.some(a => a.packageName === app.packageName);
            return (
              <button
                key={app.packageName}
                onClick={() => toggleAllowedApp(app)}
                className={`flex items-center p-3 rounded-lg border text-left transition-colors ${
                  isAllowed 
                    ? 'border-green-500 bg-green-50 text-green-900' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex-1 truncate">{app.appName}</div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  isAllowed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                }`}>
                  {isAllowed && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </button>
            );
          })}
          
          {allApps.length === 0 && (
            <div className="col-span-full text-center py-4 text-gray-500 text-sm">
              No apps recorded for this device yet. Wait for initial sync.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Downtime;
