import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Phone, MessageSquare, Filter, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, ShieldAlert, AlertTriangle, MessageCircle } from 'lucide-react';
import FamilyChat from '../components/FamilyChat';

export default function Communication() {
  const [activeTab, setActiveTab] = useState<'calls' | 'sms' | 'chat'>('calls');
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [filterDays, setFilterDays] = useState<string>('7');
  
  // Calls State
  const [calls, setCalls] = useState<any[]>([]);
  const [callStats, setCallStats] = useState({ incoming: 0, outgoing: 0, missed: 0, duration: 0 });
  
  // SMS State
  const [sms, setSms] = useState<any[]>([]);
  const [filterSafety, setFilterSafety] = useState<string>('All');
  
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (activeTab === 'calls') {
      fetchCalls();
    } else {
      fetchSms();
    }
  }, [activeTab, selectedDevice, filterDays, filterSafety]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewCall = (record: any) => {
      if (selectedDevice && record.deviceId !== selectedDevice) return;
      setCalls(prev => [record, ...prev].slice(0, 100));
      updateCallStats(record);
    };

    const handleNewSms = (record: any) => {
      if (selectedDevice && record.deviceId !== selectedDevice) return;
      if (filterSafety !== 'All') {
        if (filterSafety === 'Flagged' && !['MEDIUM', 'HIGH'].includes(record.safetyClassification.severity)) return;
        if (filterSafety !== 'Flagged' && record.safetyClassification.category !== filterSafety) return;
      }
      setSms(prev => [record, ...prev].slice(0, 100));
    };

    socket.on('call:new', handleNewCall);
    socket.on('sms:new', handleNewSms);

    return () => {
      socket.off('call:new', handleNewCall);
      socket.off('sms:new', handleNewSms);
    };
  }, [socket, selectedDevice, filterSafety]);

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

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDevice) params.append('deviceId', selectedDevice);
      if (filterDays) params.append('days', filterDays);

      const res = await api.get(`/communication/calls?${params.toString()}`);
      if (res.data.success) {
        setCalls(res.data.data);
        calculateCallStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch calls', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDevice) params.append('deviceId', selectedDevice);
      if (filterDays) params.append('days', filterDays);
      if (filterSafety !== 'All') params.append('safetyStatus', filterSafety);

      const res = await api.get(`/communication/sms?${params.toString()}`);
      if (res.data.success) {
        setSms(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch SMS', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateCallStats = (data: any[]) => {
    const stats = { incoming: 0, outgoing: 0, missed: 0, duration: 0 };
    data.forEach(c => {
      if (c.type === 'INCOMING') stats.incoming++;
      if (c.type === 'OUTGOING') stats.outgoing++;
      if (c.type === 'MISSED') stats.missed++;
      if (c.duration) stats.duration += c.duration;
    });
    setCallStats(stats);
  };

  const updateCallStats = (record: any) => {
    setCallStats(prev => {
      const stats = { ...prev };
      if (record.type === 'INCOMING') stats.incoming++;
      if (record.type === 'OUTGOING') stats.outgoing++;
      if (record.type === 'MISSED') stats.missed++;
      if (record.duration) stats.duration += record.duration;
      return stats;
    });
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'INCOMING': return <PhoneIncoming className="w-4 h-4 text-green-500" />;
      case 'OUTGOING': return <PhoneOutgoing className="w-4 h-4 text-blue-500" />;
      case 'MISSED': return <PhoneMissed className="w-4 h-4 text-red-500" />;
      case 'REJECTED': return <PhoneOff className="w-4 h-4 text-orange-500" />;
      default: return <Phone className="w-4 h-4 text-neutral-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Phone className="w-6 h-6 text-emerald-500" />
            Calls & SMS
          </h1>
          <p className="text-neutral-400 mt-1">
            Monitor communication activity and safety alerts.
          </p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">All Devices</option>
            {devices.map(device => (
              <option key={device._id} value={device._id}>
                {device.deviceName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex border-b border-neutral-800 mb-6">
        <button
          onClick={() => setActiveTab('calls')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'calls' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
          }`}
        >
          <Phone className="w-4 h-4" /> Calls
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'sms' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> SMS
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'chat' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
          }`}
        >
          <MessageCircle className="w-4 h-4" /> Family Chat
        </button>
      </div>

      {activeTab === 'chat' ? (
        <div className="h-[600px]">
          <FamilyChat selectedDevice={selectedDevice} deviceStatus={devices.find(d => d._id === selectedDevice)?.isOnline ? 'online' : 'offline'} />
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Filters Panel */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-neutral-200 font-medium">
              <Filter className="w-4 h-4" /> Filters
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Time Range</label>
                <select 
                  value={filterDays}
                  onChange={(e) => setFilterDays(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="1">Today</option>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="">All Time</option>
                </select>
              </div>

              {activeTab === 'sms' && (
                <div>
                  <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Safety Status</label>
                  <select 
                    value={filterSafety}
                    onChange={(e) => setFilterSafety(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All">All SMS</option>
                    <option value="Flagged">Flagged (Medium/High Risk)</option>
                    <option value="Normal">Normal</option>
                    <option value="Unknown">Needs Review / Unknown</option>
                    <option value="Scam Indicator">Scam Indicator</option>
                    <option value="Explicit Content Indicator">Explicit Content</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {activeTab === 'calls' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-neutral-200 font-medium mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400 flex items-center gap-2"><PhoneIncoming className="w-4 h-4 text-green-500"/> Incoming</span>
                  <span className="text-white font-medium">{callStats.incoming}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400 flex items-center gap-2"><PhoneOutgoing className="w-4 h-4 text-blue-500"/> Outgoing</span>
                  <span className="text-white font-medium">{callStats.outgoing}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400 flex items-center gap-2"><PhoneMissed className="w-4 h-4 text-red-500"/> Missed</span>
                  <span className="text-white font-medium">{callStats.missed}</span>
                </div>
                <div className="pt-3 mt-3 border-t border-neutral-800 flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Total Duration</span>
                  <span className="text-emerald-400 font-medium">{formatDuration(callStats.duration)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm h-[calc(100vh-200px)] flex flex-col">
            <div className="p-4 border-b border-neutral-800 bg-neutral-800/30">
              <h2 className="font-semibold text-white">
                {activeTab === 'calls' ? 'Call History' : 'SMS Feed'}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : activeTab === 'calls' ? (
                // CALLS LIST
                calls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
                    <PhoneOff className="w-12 h-12 mb-3 text-neutral-600" />
                    <p>No call data available.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800">
                    {calls.map(call => (
                      <div key={call._id} className="py-3 px-2 flex justify-between items-center hover:bg-neutral-800/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-neutral-800 rounded-full">
                            {getCallIcon(call.type)}
                          </div>
                          <div>
                            <p className="text-white font-medium capitalize">
                              {call.type.toLowerCase()}
                            </p>
                            <p className="text-sm text-neutral-400">
                              {call.contactLabel || `Contact: ${call.numberHash.substring(0,8)}...`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-neutral-300 font-medium">
                            {call.duration > 0 ? formatDuration(call.duration) : '--'}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {new Date(call.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // SMS LIST
                sms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
                    <MessageSquare className="w-12 h-12 mb-3 text-neutral-600" />
                    <p>No SMS data available.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sms.map(msg => {
                      const isHighRisk = msg.safetyClassification.severity === 'HIGH';
                      const isMediumRisk = msg.safetyClassification.severity === 'MEDIUM';
                      
                      return (
                        <div key={msg._id} className={`p-4 rounded-xl border ${
                          isHighRisk ? 'bg-red-500/5 border-red-500/20' : 
                          isMediumRisk ? 'bg-yellow-500/5 border-yellow-500/20' : 
                          'bg-neutral-800/50 border-neutral-800 hover:border-neutral-700'
                        } transition-colors`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-neutral-200">
                                {msg.type === 'INCOMING' ? 'From: ' : 'To: '} 
                                {msg.senderHash.substring(0,8)}...
                              </span>
                              
                              {(isHighRisk || isMediumRisk) && (
                                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${
                                  isHighRisk ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {isHighRisk ? <ShieldAlert className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                  {msg.safetyClassification.category}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-neutral-500 whitespace-nowrap">
                              {new Date(msg.timestamp).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="text-sm">
                            {msg.messagePreview ? (
                              <p className={`${isHighRisk || isMediumRisk ? 'text-neutral-300' : 'text-neutral-400'}`}>
                                "{msg.messagePreview}{msg.messagePreview.length >= 100 ? '...' : ''}"
                              </p>
                            ) : (
                              <p className="text-neutral-600 italic">Content hidden or unavailable</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
        
      </div>
      )}
    </div>
  );
}
