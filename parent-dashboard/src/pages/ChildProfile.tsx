import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Smartphone, ShieldAlert, Settings, Trash2, ArrowLeft, Loader2, Clock, Globe, MapPin, CheckCircle2, RefreshCw, KeySquare } from 'lucide-react';
import { StateWrapper } from '../components/cards/StateWrapper';

interface Child {
  _id: string;
  name: string;
  dateOfBirth: string;
}

const tabs = ['Overview', 'Apps', 'Screen Time', 'Websites', 'Location', 'Notifications', 'Calls & SMS', 'Safety', 'Chat', 'Media', 'Reports', 'Device'];

const ChildProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [child, setChild] = useState<Child | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [childRes, overviewRes, devicesRes] = await Promise.all([
          api.get(`/children/${id}`),
          api.get(`/analytics/child-overview/${id}`),
          api.get('/devices')
        ]);
        setChild(childRes.data.data);
        setOverview(overviewRes.data.data);
        
        const allDevices = devicesRes.data.data as any[];
        setDevices(allDevices.filter(d => d.childId === id));
      } catch (error) {
        console.error('Error fetching child data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchData();
  }, [id]);

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

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  if (!child) return <div className="text-white">Child not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/children')}
            className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-inner">
              {child.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white leading-tight">{child.name}</h2>
              <p className="text-sm text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-800">
        <nav className="flex space-x-1 overflow-x-auto custom-scrollbar pb-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-3 px-4 font-medium text-sm transition-colors border-b-2 ${
                activeTab === tab 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'Overview' && overview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-neutral-400 font-medium">Screen Time</h3>
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-white">{overview.screenTime}</p>
              <p className="text-sm text-neutral-500 mt-2">Today across all devices</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-neutral-400 font-medium">Apps & Websites</h3>
                <Smartphone className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-3xl font-bold text-white">{overview.appsCount} <span className="text-lg font-medium text-neutral-500">apps used</span></p>
              <p className="text-sm text-neutral-500 mt-2">{overview.websitesBlocked} websites blocked</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-neutral-400 font-medium">Safety</h3>
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-3xl font-bold text-white">{overview.safetyAlerts} <span className="text-lg font-medium text-neutral-500">alerts</span></p>
              <p className="text-sm text-neutral-500 mt-2">{overview.messages} messages processed</p>
            </div>

            <div className="md:col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Current Location</h3>
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-xl font-medium text-neutral-300">{overview.location}</p>
            </div>
          </div>
        )}

        {activeTab === 'Device' && (
           <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden max-w-2xl">
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
                       </div>
                     </div>
                   ))}
                   
                   <div className="pt-4 mt-2 border-t border-neutral-800 flex justify-center">
                      <button onClick={generatePairingCode} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
                        + Pair another device
                      </button>
                   </div>
                 </div>
               )}
             </div>
           </div>
        )}

        {activeTab !== 'Overview' && activeTab !== 'Device' && (
          <div className="flex flex-col items-center justify-center py-20 bg-neutral-900 border border-neutral-800 rounded-2xl">
            <h3 className="text-xl font-medium text-white mb-2">{activeTab}</h3>
            <p className="text-neutral-400 mb-6">Manage {activeTab.toLowerCase()} settings and view details.</p>
            <button 
              onClick={() => {
                 const routes: Record<string, string> = {
                   'Apps': '/apps',
                   'Screen Time': '/screen-time',
                   'Websites': '/websites',
                   'Location': '/location',
                   'Notifications': '/notifications',
                   'Calls & SMS': '/calls',
                   'Safety': '/safety-center',
                   'Chat': '/chat',
                   'Media': '/media',
                   'Reports': '/reports'
                 };
                 navigate(routes[activeTab] || '/');
              }}
              className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
            >
              Go to {activeTab}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildProfile;
