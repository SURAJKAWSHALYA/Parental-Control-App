import { useState, useEffect } from 'react';
import api from '../services/api';
import { Smartphone, Battery, Trash2, CheckCircle2, Loader2, ArrowRight, ChevronRight, Activity, Moon } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';

interface Device {
  _id: string;
  childId: { _id: string; name: string };
  deviceName: string;
  manufacturer: string;
  model: string;
  isOnline: boolean;
  batteryLevel: number;
  lastSeen: string;
  appVersion: string;
  androidVersion: string;
  permissions?: {
    usageAccess: boolean;
    notifications: boolean;
    location: boolean;
  };
}

const Devices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { socket } = useSocket();

  const fetchDevices = async () => {
    try {
      const res = await api.get('/devices');
      setDevices(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleOnline = (data: any) => {
      setDevices(prev => prev.map(d => d._id === data.deviceId ? { ...d, isOnline: true, lastSeen: data.lastSeen } : d));
    };
    
    const handleOffline = (data: any) => {
      setDevices(prev => prev.map(d => d._id === data.deviceId ? { ...d, isOnline: false, lastSeen: data.lastSeen } : d));
    };

    socket.on('device:online', handleOnline);
    socket.on('device:offline', handleOffline);
    return () => {
      socket.off('device:online', handleOnline);
      socket.off('device:offline', handleOffline);
    };
  }, [socket]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this device? This will break the connection.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/devices/${id}`);
      setDevices(devices.filter(d => d._id !== id));
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Connected Devices</h1>
      
      {devices.length === 0 ? (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-12 text-center">
          <Smartphone className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No devices connected</h3>
          <p className="text-neutral-400 max-w-md mx-auto">
            To connect a device, go to a child's profile and generate a pairing code.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <div key={device._id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-colors group relative">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Smartphone className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${device.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>
                    {device.isOnline && <CheckCircle2 className="w-3 h-3" />}
                    {device.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-white truncate">{device.deviceName}</h3>
                <p className="text-sm text-neutral-400 mb-4">{device.manufacturer} {device.model}</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Assigned to</span>
                    <Link to={`/children/${device.childId?._id}`} className="text-blue-400 hover:underline">{device.childId?.name || 'Unknown'}</Link>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 flex items-center gap-1"><Battery className="w-4 h-4" /> Battery</span>
                    <span className="text-neutral-300">{device.batteryLevel}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Android Version</span>
                    <span className="text-neutral-300">{device.androidVersion || '14'}</span>
                  </div>
                  
                  <Link to={`/downtime`} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Moon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Downtime</p>
                        <p className="text-xs text-neutral-400">Manage device sleep schedules</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  </Link>

                  <Link to={`/screen-time`} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Screen Time</p>
                        <p className="text-xs text-neutral-400">View usage statistics</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  </Link>

                  <div className="flex justify-between text-sm pt-4 border-t border-neutral-800">
                    <span className="text-neutral-500">Usage Access</span>
                    <span className={device.permissions?.usageAccess ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
                      {device.permissions?.usageAccess ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Notifications</span>
                    <span className={device.permissions?.notifications ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
                      {device.permissions?.notifications ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Location</span>
                    <span className={device.permissions?.location ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
                      {device.permissions?.location ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-neutral-500">Last Seen</span>
                    <span className="text-neutral-300">{new Date(device.lastSeen).toLocaleTimeString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleDelete(device._id)}
                    disabled={deletingId === device._id}
                    className="flex-1 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-red-400/20"
                  >
                    {deletingId === device._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Remove
                  </button>
                  <Link to={`/children/${device.childId?._id}`} className="flex-1 py-2 text-sm text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center justify-center">
                    Manage <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Devices;
