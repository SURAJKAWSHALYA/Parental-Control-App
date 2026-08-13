import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Smartphone, ShieldAlert, Settings, Trash2, ArrowLeft, KeySquare, Loader2, CheckCircle2, RefreshCw, Clock } from 'lucide-react';

interface Child {
  _id: string;
  name: string;
  dateOfBirth: string;
}

interface Device {
  _id: string;
  deviceName: string;
  model: string;
  batteryLevel: number;
  isOnline: boolean;
  lastSeen: string;
}

const ChildProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [child, setChild] = useState<Child | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [childRes, devicesRes] = await Promise.all([
          api.get(`/children/${id}`),
          api.get('/devices') // In a real app we'd filter this on backend or pass query param
        ]);
        setChild(childRes.data.data);
        
        // Filter devices for this child
        const allDevices = devicesRes.data.data as any[];
        // Note: Our devices API returns all devices for all children, we filter here for simplicity
        // But ideally the API should be /api/children/:id/devices
        // Assuming the backend Device model has childId
        const childDevices = allDevices.filter(d => d.childId === id);
        setDevices(childDevices);

      } catch (error) {
        console.error('Error fetching child data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    const handleDeviceOnline = (data: any) => {
      setDevices(prev => prev.map(d => 
        d._id === data.deviceId ? { ...d, isOnline: true, lastSeen: data.lastSeen } : d
      ));
    };

    const handleDeviceOffline = (data: any) => {
      setDevices(prev => prev.map(d => 
        d._id === data.deviceId ? { ...d, isOnline: false, lastSeen: data.lastSeen } : d
      ));
    };

    socket.on('device:online', handleDeviceOnline);
    socket.on('device:offline', handleDeviceOffline);

    return () => {
      socket.off('device:online', handleDeviceOnline);
      socket.off('device:offline', handleDeviceOffline);
    };
  }, [socket]);

  const handleSyncCommand = (deviceId: string) => {
    if (!socket) return;
    setSyncing(deviceId);
    socket.emit('parent:command', {
      childId: id,
      deviceId,
      commandType: 'request_sync'
    }, (response: any) => {
      console.log('Command sent:', response);
      setTimeout(() => setSyncing(null), 1000);
    });
  };

  const generatePairingCode = async () => {
    setGeneratingCode(true);
    try {
      const response = await api.post('/pairing/create', { childId: id });
      setPairingCode(response.data.data.code);
    } catch (error) {
      console.error('Error generating pairing code:', error);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleDeleteChild = async () => {
    if (window.confirm('Are you sure you want to delete this child profile? This will disconnect all devices.')) {
      try {
        await api.delete(`/children/${id}`);
        navigate('/children');
      } catch (error) {
        console.error('Error deleting child:', error);
      }
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  if (!child) return <div className="text-white">Child not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/children')}
            className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white">{child.name}'s Profile</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={handleDeleteChild}
            className="p-2 text-neutral-400 hover:text-red-400 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-red-400/10 hover:border-red-500/20 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Device Management */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-800 bg-neutral-950/50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                Connected Devices
              </h3>
            </div>
            
            <div className="p-6">
              {devices.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-8 h-8 text-neutral-500" />
                  </div>
                  <h4 className="text-white font-medium mb-1">No devices connected</h4>
                  <p className="text-neutral-500 text-sm mb-6">Pair an Android device to start monitoring.</p>
                  
                  {!pairingCode ? (
                    <button
                      onClick={generatePairingCode}
                      disabled={generatingCode}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                    >
                      {generatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeySquare className="w-4 h-4" />}
                      Generate Pairing Code
                    </button>
                  ) : (
                    <div className="bg-neutral-950 border border-indigo-500/30 rounded-xl p-6 inline-block">
                      <p className="text-sm text-neutral-400 mb-2">Enter this code on the child's device:</p>
                      <div className="text-4xl font-mono font-bold tracking-widest text-indigo-400 mb-3 select-all">
                        {pairingCode}
                      </div>
                      <p className="text-xs text-neutral-500 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires in 15 minutes
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {devices.map(device => (
                    <div key={device._id} className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-neutral-900 rounded-lg">
                          <Smartphone className="w-6 h-6 text-neutral-300" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{device.deviceName}</h4>
                          <p className="text-xs text-neutral-500">{device.model} • Battery: {device.batteryLevel}%</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${device.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>
                          {device.isOnline ? <CheckCircle2 className="w-3 h-3" /> : null}
                          {device.isOnline ? 'Online' : 'Offline'}
                        </span>
                        <span className="text-[10px] text-neutral-600 mt-1">Last seen: {new Date(device.lastSeen).toLocaleTimeString()}</span>
                        {device.isOnline && (
                          <button 
                            onClick={() => handleSyncCommand(device._id)}
                            disabled={syncing === device._id}
                            className="mt-2 text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300"
                          >
                            <RefreshCw className={`w-3 h-3 ${syncing === device._id ? 'animate-spin' : ''}`} />
                            Sync Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 mt-2 border-t border-neutral-800 flex justify-center">
                     <button
                      onClick={generatePairingCode}
                      className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      + Pair another device
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Alerts Placeholder */}
           <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-800 bg-neutral-950/50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                Recent Alerts
              </h3>
            </div>
            <div className="p-6 text-center py-8">
               <p className="text-neutral-500 text-sm">No alerts triggered recently.</p>
               <span className="inline-block mt-3 px-2 py-1 bg-neutral-800 text-neutral-400 text-[10px] uppercase font-bold rounded">Coming in Phase 2</span>
            </div>
           </div>
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-inner mb-4">
                {child.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-xl font-bold text-white">{child.name}</h3>
              <p className="text-neutral-500">{new Date().getFullYear() - new Date(child.dateOfBirth).getFullYear()} years old</p>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Status</span>
                <span className="text-emerald-400 text-sm font-medium">Protected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Rules Profile</span>
                <span className="text-white text-sm font-medium">Standard</span>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
             <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">Quick Stats</h3>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-sm mb-1">
                   <span className="text-white">Screen Time</span>
                   <span className="text-neutral-400">0h 0m</span>
                 </div>
                 <div className="w-full bg-neutral-800 rounded-full h-1.5">
                   <div className="bg-blue-500 h-1.5 rounded-full w-0"></div>
                 </div>
               </div>
               <div className="pt-2 text-center">
                 <span className="inline-block px-2 py-1 bg-neutral-800 text-neutral-400 text-[10px] uppercase font-bold rounded">Coming in Phase 2</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildProfile;
