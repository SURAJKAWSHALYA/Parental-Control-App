import { useState, useEffect } from 'react';
import { Activity as ActivityIcon, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

interface Device {
  _id: string;
  deviceName: string;
}

interface ActivityItem {
  _id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

const Activity = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { socket } = useSocket();

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      setPage(1);
      fetchActivity(selectedDeviceId, 1, true);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    if (!socket || !selectedDeviceId) return;

    const handleNewActivity = (activity: ActivityItem) => {
      // Prepend to top of list
      setActivities(prev => [activity, ...prev]);
    };

    socket.on('activity:new', handleNewActivity);
    return () => {
      socket.off('activity:new', handleNewActivity);
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async (deviceId: string, targetPage: number, reset: boolean = false) => {
    try {
      setLoading(true);
      const res = await api.get(`/activity/${deviceId}?page=${targetPage}&limit=50`);
      if (res.data.success) {
        if (reset) {
          setActivities(res.data.data);
        } else {
          setActivities(prev => [...prev, ...res.data.data]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch activity', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivity(selectedDeviceId, nextPage, false);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Group by date
  const groupedActivities: { [date: string]: ActivityItem[] } = {};
  activities.forEach(item => {
    const date = formatDate(item.timestamp);
    if (!groupedActivities[date]) groupedActivities[date] = [];
    groupedActivities[date].push(item);
  });

  if (loading && !devices.length) {
    return <div className="flex h-full items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Timeline</h1>
          <p className="text-gray-500">Historical events and usage logs</p>
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
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {Object.keys(groupedActivities).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
            <ActivityIcon className="w-12 h-12 text-gray-300 mb-4" />
            <p>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedActivities).map(([date, items]) => (
              <div key={date}>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                  {date}
                </h3>
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
                  {items.map((item) => (
                    <div key={item._id} className="relative pl-6">
                      <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-400" />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <span className="text-xs font-semibold text-gray-400 whitespace-nowrap ml-4">
                          {formatTime(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="text-center pt-4">
              <button 
                onClick={loadMore}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                {loading ? 'Loading...' : 'Load older activity'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;
