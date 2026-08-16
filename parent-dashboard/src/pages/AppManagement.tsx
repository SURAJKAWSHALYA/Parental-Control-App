import { useState, useEffect } from 'react';
import { Smartphone, AlertCircle, RefreshCw } from 'lucide-react';
import { appUsageService } from '../services/appUsage.service';
import type { AppUsage } from '../services/appUsage.service';
import { appLimitService } from '../services/appLimit.service';
import type { AppLimit } from '../services/appLimit.service';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

interface Device {
  _id: string;
  deviceName: string;
}

const AppManagement = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [usages, setUsages] = useState<AppUsage[]>([]);
  const [limits, setLimits] = useState<AppLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { socket } = useSocket();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<{ packageName: string, appName: string } | null>(null);
  const [limitMinutes, setLimitMinutes] = useState(60);

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      fetchData(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    if (!socket || !selectedDeviceId) return;

    const handleUsageUpdated = (data: any) => {
      if (data.deviceId === selectedDeviceId) {
        // Optimistically update usage if we get a real-time event from the device
        fetchData(selectedDeviceId); 
      }
    };
    
    const handleRestrictionUpdated = (data: any) => {
      if (data.deviceId === selectedDeviceId) {
        fetchData(selectedDeviceId);
      }
    };

    socket.on('device:usage:updated', handleUsageUpdated);
    socket.on('restriction:updated', handleRestrictionUpdated);

    return () => {
      socket.off('device:usage:updated', handleUsageUpdated);
      socket.off('restriction:updated', handleRestrictionUpdated);
    };
  }, [socket, selectedDeviceId]);

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
      setError('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (deviceId: string) => {
    try {
      setLoading(true);
      setError('');
      const [usageRes, limitsRes] = await Promise.all([
        appUsageService.getTodayUsage(deviceId),
        appLimitService.getLimits(deviceId)
      ]);
      if (usageRes.success) setUsages(usageRes.data);
      if (limitsRes.success) setLimits(limitsRes.data);
    } catch (err: any) {
      setError('Failed to fetch app data');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleSaveLimit = async () => {
    if (!editingApp || !selectedDeviceId) return;
    try {
      await appLimitService.setLimit({
        deviceId: selectedDeviceId,
        packageName: editingApp.packageName,
        appName: editingApp.appName,
        dailyLimitMinutes: limitMinutes,
        enabled: true
      });
      setIsModalOpen(false);
      fetchData(selectedDeviceId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save limit');
    }
  };

  const handleToggleLimit = async (limit: AppLimit) => {
    try {
      await appLimitService.updateLimit(limit._id, { enabled: !limit.enabled });
      fetchData(selectedDeviceId);
    } catch (err: any) {
      console.error(err);
    }
  };
  
  const handleRemoveLimit = async (limitId: string) => {
    try {
      await appLimitService.deleteLimit(limitId);
      fetchData(selectedDeviceId);
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading && !devices.length) {
    return <div className="flex h-full items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  // Combine usages and limits to create the view model
  const appListMap = new Map<string, any>();
  usages.forEach(u => {
    appListMap.set(u.packageName, {
      packageName: u.packageName,
      appName: u.appName,
      usageMs: u.usageDuration,
      limit: null
    });
  });
  limits.forEach(l => {
    if (appListMap.has(l.packageName)) {
      appListMap.get(l.packageName).limit = l;
    } else {
      appListMap.set(l.packageName, {
        packageName: l.packageName,
        appName: l.appName,
        usageMs: 0,
        limit: l
      });
    }
  });

  const combinedApps = Array.from(appListMap.values()).sort((a, b) => b.usageMs - a.usageMs);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">App Management</h1>
          <p className="text-gray-500">Configure daily limits and view restrictions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            className="border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-3 pr-10"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {devices.map(device => (
              <option key={device._id} value={device._id}>{device.deviceName}</option>
            ))}
          </select>
          <button 
            onClick={() => fetchData(selectedDeviceId)}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">App</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Limit</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {combinedApps.length > 0 ? combinedApps.map((app) => {
              const limitMs = app.limit?.enabled ? app.limit.dailyLimitMinutes * 60 * 1000 : null;
              let remainingMs = limitMs ? limitMs - app.usageMs : null;
              if (remainingMs !== null && remainingMs < 0) remainingMs = 0;
              
              const isReached = remainingMs === 0;

              return (
                <tr key={app.packageName} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">
                        {app.appName.charAt(0)}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{app.appName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(app.usageMs)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {app.limit ? `${app.limit.dailyLimitMinutes}m` : <span className="text-gray-400">No limit</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {remainingMs !== null ? formatDuration(remainingMs) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {!app.limit?.enabled ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Active
                      </span>
                    ) : isReached ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Limit Reached
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => {
                        setEditingApp({ packageName: app.packageName, appName: app.appName });
                        setLimitMinutes(app.limit?.dailyLimitMinutes || 60);
                        setIsModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      {app.limit ? 'Edit Limit' : 'Set Limit'}
                    </button>
                    {app.limit && (
                      <button 
                        onClick={() => handleToggleLimit(app.limit)}
                        className={`${app.limit.enabled ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {app.limit.enabled ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>No applications found for this device yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Set Limit Modal */}
      {isModalOpen && editingApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Set Limit for {editingApp.appName}</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Limit (Minutes)
              </label>
              <input 
                type="number" 
                min="1"
                value={limitMinutes}
                onChange={(e) => setLimitMinutes(parseInt(e.target.value) || 0)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              {limits.find(l => l.packageName === editingApp.packageName) && (
                <button 
                  onClick={() => {
                    const limit = limits.find(l => l.packageName === editingApp.packageName);
                    if (limit) handleRemoveLimit(limit._id);
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg mr-auto"
                >
                  Remove Limit
                </button>
              )}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveLimit}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppManagement;
