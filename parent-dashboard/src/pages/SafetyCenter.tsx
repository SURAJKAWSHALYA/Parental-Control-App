import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import SafetyEventCard from '../components/SafetyEventCard';

export default function SafetyCenter() {
  const [events, setEvents] = useState<any[]>([]);
  const [overview, setOverview] = useState({ CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const { socket } = useSocket();

  useEffect(() => {
    fetchDevices();
    fetchOverview();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [sourceFilter]);

  const [activeScreenSession, setActiveScreenSession] = useState<string | null>(null);
  const [screenFrame, setScreenFrame] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;
    const handleNewSafety = (event: any) => {
      setEvents(prev => [event, ...prev]);
      fetchOverview();
    };
    const handleUpdatedSafety = (event: any) => {
      setEvents(prev => prev.map(e => e._id === event._id ? event : e));
      fetchOverview();
    };
    const handleScreenFrame = (data: any) => {
      if (data.deviceId === activeScreenSession) {
        setScreenFrame(data.image);
      }
    };
    const handleScreenSessionStarted = (data: any) => {
      if (data.deviceId === activeScreenSession) {
        // optionally update state
      }
    };
    const handleScreenSessionStopped = (data: any) => {
      if (data.deviceId === activeScreenSession) {
        setActiveScreenSession(null);
        setScreenFrame(null);
        alert('Screen session was terminated by the child device.');
      }
    };

    socket.on('safety:alert', handleNewSafety); // Changed from safety:new to safety:alert to match backend
    socket.on('safety:updated', handleUpdatedSafety);
    socket.on('screen:frame', handleScreenFrame);
    socket.on('screen:session:started', handleScreenSessionStarted);
    socket.on('screen:session:stopped', handleScreenSessionStopped);
    return () => {
      socket.off('safety:alert', handleNewSafety);
      socket.off('safety:updated', handleUpdatedSafety);
      socket.off('screen:frame', handleScreenFrame);
      socket.off('screen:session:started', handleScreenSessionStarted);
      socket.off('screen:session:stopped', handleScreenSessionStopped);
    };
  }, [socket, activeScreenSession]);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/devices');
      const mappedDevices = res.data.data.map((d: any) => ({
        ...d,
        status: d.isOnline ? 'ONLINE' : 'OFFLINE'
      }));
      setDevices(mappedDevices);
    } catch (err) {
      console.error('Failed to fetch devices', err);
    }
  };

  const fetchOverview = async () => {
    try {
      const res = await api.get('/safety/overview');
      if (res.data.success) {
        setOverview({
          CRITICAL: res.data.data.CRITICAL || 0,
          HIGH: res.data.data.HIGH || 0,
          MEDIUM: res.data.data.MEDIUM || 0,
          LOW: res.data.data.LOW || 0,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let query = '/safety?limit=20';
      if (sourceFilter === 'Notifications') query += '&source=Notification';
      if (sourceFilter === 'Images') query += '&source=Image'; 
      const res = await api.get(query);
      if (res.data.success) {
        let filtered = res.data.data;
        if (sourceFilter === 'Notifications') filtered = filtered.filter((e: any) => e.source === 'Notification');
        if (sourceFilter === 'Images') filtered = filtered.filter((e: any) => e.source === 'Image');
        setEvents(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = (updated: any) => {
    setEvents(prev => prev.map(e => e._id === updated._id ? updated : e));
    fetchOverview();
  };

  const requestScreenSession = (deviceId: string) => {
    if (socket) {
      setActiveScreenSession(deviceId);
      socket.emit('screen:session:request', { deviceId });
      alert('Screen sharing request sent. Waiting for child to accept...');
    }
  };

  const stopScreenSession = (deviceId: string) => {
    if (socket) {
      socket.emit('screen:session:stop', { deviceId });
      setActiveScreenSession(null);
      setScreenFrame(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            Safety Center
          </h1>
          <p className="text-neutral-400 mt-1">
            Review safety detection alerts and manage device health.
          </p>
        </div>
        <div className="flex bg-neutral-800/50 p-1 rounded-xl border border-neutral-700/50 overflow-x-auto">
          {(['All', 'Notifications', 'Images'] as const).map(f => (
            <button
              key={f}
              onClick={() => setSourceFilter(f)}
              className={`px-3 py-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-colors ${
                sourceFilter === f
                  ? 'bg-neutral-700 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-red-500/20 rounded-lg"><ShieldAlert className="w-6 h-6 text-red-500" /></div>
          <div><p className="text-sm text-neutral-400 font-medium uppercase">Critical</p><p className="text-2xl font-bold text-white">{overview.CRITICAL}</p></div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-orange-500/20 rounded-lg"><AlertTriangle className="w-6 h-6 text-orange-500" /></div>
          <div><p className="text-sm text-neutral-400 font-medium uppercase">High Risk</p><p className="text-2xl font-bold text-white">{overview.HIGH}</p></div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-yellow-500/20 rounded-lg"><AlertTriangle className="w-6 h-6 text-yellow-500" /></div>
          <div><p className="text-sm text-neutral-400 font-medium uppercase">Medium</p><p className="text-2xl font-bold text-white">{overview.MEDIUM}</p></div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg"><Info className="w-6 h-6 text-blue-500" /></div>
          <div><p className="text-sm text-neutral-400 font-medium uppercase">Low / Info</p><p className="text-2xl font-bold text-white">{overview.LOW}</p></div>
        </div>
      </div>

      {activeScreenSession && (
        <div className="bg-neutral-900 border border-emerald-500/50 rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Screen Session Active
            </h3>
            <button 
              onClick={() => stopScreenSession(activeScreenSession)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg"
            >
              Stop Session
            </button>
          </div>
          <div className="bg-black rounded-lg aspect-[9/16] sm:aspect-video flex items-center justify-center overflow-hidden border border-neutral-800">
            {screenFrame ? (
              <img src={screenFrame} alt="Live Screen" className="max-h-full object-contain" />
            ) : (
              <p className="text-neutral-500 animate-pulse">Waiting for child's consent and first frame...</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white">Recent Safety Events</h2>
          {loading ? (
             <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>
          ) : events.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-neutral-500">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
              <p>No recent safety events to display.</p>
              <p className="text-sm mt-1">Your child's digital environment is currently clear.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <SafetyEventCard key={event._id} event={event} onUpdate={handleUpdateEvent} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4">Live Monitoring</h3>
            <div className="space-y-3">
              {devices.length === 0 && <p className="text-sm text-neutral-500">No devices connected.</p>}
              {devices.map(device => (
                <div key={device._id} className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-neutral-200">{device.deviceName}</span>
                    <span className={`w-2 h-2 rounded-full ${device.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  </div>
                  {device.status === 'ONLINE' && activeScreenSession !== device._id && (
                    <button 
                      onClick={() => requestScreenSession(device._id)}
                      className="w-full mt-2 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-sm font-medium rounded-lg transition-colors border border-emerald-500/20"
                    >
                      Request Live Screen
                    </button>
                  )}
                  <div className="text-xs space-y-1 mt-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Notification Access</span>
                      <span className={device.permissions?.notification ? 'text-emerald-400' : 'text-red-400'}>
                        {device.permissions?.notification ? 'GRANTED' : 'DENIED'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
