import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Inbox, Filter, ShieldAlert, BellOff, Settings } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [counts, setCounts] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterDays, setFilterDays] = useState<string>('7');
  const [loading, setLoading] = useState(false);
  
  const { socket } = useSocket();

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedDevice, filterCategory, filterDays]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotification = (record: any) => {
      // If the new notification belongs to the currently viewed device/filter, add it
      if (selectedDevice && record.deviceId !== selectedDevice) return;
      if (filterCategory !== 'All' && record.category !== filterCategory) return;
      
      setNotifications(prev => [record, ...prev].slice(0, 100)); // Keep recent 100
      
      // Update counts incrementally
      setCounts(prevCounts => {
        const newCounts = [...prevCounts];
        const existing = newCounts.find(c => c.appName === record.appName);
        if (existing) {
          existing.count += 1;
        } else {
          newCounts.push({ appName: record.appName, count: 1 });
        }
        return newCounts.sort((a, b) => b.count - a.count);
      });
    };

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, selectedDevice, filterCategory]);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/devices');
      if (res.data.success) {
        setDevices(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch devices', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDevice) params.append('deviceId', selectedDevice);
      if (filterCategory !== 'All') params.append('category', filterCategory);
      if (filterDays) params.append('days', filterDays);

      const [notifRes, countRes] = await Promise.all([
        api.get(`/notifications?${params.toString()}`),
        api.get(`/notifications/counts?${selectedDevice ? `deviceId=${selectedDevice}` : ''}`)
      ]);

      if (notifRes.data.success) setNotifications(notifRes.data.data);
      if (countRes.data.success) setCounts(countRes.data.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Inbox className="w-6 h-6 text-indigo-500" />
            Notifications
          </h1>
          <p className="text-neutral-400 mt-1">
            Monitor device notifications to detect concerning activity.
          </p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Devices</option>
            {devices.map(device => (
              <option key={device._id} value={device._id}>
                {device.deviceName}
              </option>
            ))}
          </select>
          <button className="p-2 bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-700 transition" title="Notification Settings">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Summary & Filters */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-neutral-200 font-medium">
              <Filter className="w-4 h-4" /> Filters
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Category</label>
                <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {['All', 'Social', 'Messaging', 'Email', 'System', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Time Range</label>
                <select 
                  value={filterDays}
                  onChange={(e) => setFilterDays(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="1">Today</option>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="">All Time</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-neutral-200 font-medium mb-4">Volume by App</h3>
            {counts.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-4">No data</p>
            ) : (
              <div className="space-y-3">
                {counts.slice(0, 8).map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400 truncate pr-2">{c.appName}</span>
                    <span className="bg-neutral-800 text-neutral-300 text-xs px-2 py-1 rounded-full font-medium">
                      {c.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Notification Feed */}
        <div className="lg:col-span-3">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm h-[calc(100vh-200px)] flex flex-col">
            <div className="p-4 border-b border-neutral-800 bg-neutral-800/30">
              <h2 className="font-semibold text-white">Recent Notifications</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
                  <BellOff className="w-12 h-12 mb-3 text-neutral-600" />
                  <p>No notification data available.</p>
                  <p className="text-sm mt-1">Try adjusting your filters or verify device permissions.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(notif => (
                    <div key={notif._id} className={`p-4 rounded-xl border ${
                      notif.isSensitive 
                        ? 'bg-red-500/5 border-red-500/20' 
                        : 'bg-neutral-800/50 border-neutral-800 hover:border-neutral-700'
                    } transition-colors`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-200">{notif.appName}</span>
                          <span className="text-xs px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded">
                            {notif.category}
                          </span>
                          {notif.isSensitive && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded font-medium">
                              <ShieldAlert className="w-3 h-3" /> Sensitive
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-neutral-500 whitespace-nowrap">
                          {new Date(notif.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        {notif.notificationTitle && (
                          <p className="text-neutral-300 font-medium">{notif.notificationTitle}</p>
                        )}
                        {notif.notificationText ? (
                          <p className="text-neutral-400 line-clamp-2">{notif.notificationText}</p>
                        ) : (
                          <p className="text-neutral-600 italic">No content available</p>
                        )}
                      </div>
                      
                      {/* Device badge if showing all devices */}
                      {!selectedDevice && notif.deviceId && (
                        <div className="mt-3 text-xs text-neutral-500 flex items-center gap-1">
                           {notif.deviceId.deviceName || 'Unknown Device'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
