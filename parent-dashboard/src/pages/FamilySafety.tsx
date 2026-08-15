import { useState, useEffect } from 'react';
import { ShieldCheck, Smartphone, MapPin, Globe, Bell } from 'lucide-react';
import api from '../services/api';

export default function FamilySafety() {
  const [device, setDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeviceConfig();
  }, []);

  const fetchDeviceConfig = async () => {
    try {
      setLoading(true);
      // Fetch devices owned by this child or parent
      const res = await api.get('/devices');
      if (res.data.success && res.data.data.length > 0) {
        // Just show the first device for the child view
        setDevice(res.data.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  if (!device) return <div className="p-12 text-center text-neutral-400">No device found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-4">
          <ShieldCheck className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Family Safety</h1>
        <p className="text-neutral-400">
          This device is protected by Parental Controls. We believe in transparency. 
          Here is what is currently active on your device to keep you safe.
        </p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-500" />
          Device Protection Status
        </h2>

        <div className="space-y-4">
          {/* App Protection */}
          <div className="flex justify-between items-center p-4 bg-neutral-800/50 rounded-lg border border-neutral-800">
            <div>
              <p className="text-white font-medium">App Protection & Limits</p>
              <p className="text-sm text-neutral-400">Usage time limits and app blocking.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Active</span>
            </div>
          </div>

          {/* Internet Protection */}
          <div className="flex justify-between items-center p-4 bg-neutral-800/50 rounded-lg border border-neutral-800">
            <div className="flex gap-3">
              <Globe className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <p className="text-white font-medium">Internet Protection</p>
                <p className="text-sm text-neutral-400">Web filtering to block inappropriate content.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Active</span>
            </div>
          </div>

          {/* Location Sharing */}
          <div className="flex justify-between items-center p-4 bg-neutral-800/50 rounded-lg border border-neutral-800">
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-purple-500 mt-1" />
              <div>
                <p className="text-white font-medium">Location Sharing</p>
                <p className="text-sm text-neutral-400">Parents can see where this device is located.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Active</span>
            </div>
          </div>

          {/* Safety Monitoring */}
          <div className="flex justify-between items-center p-4 bg-neutral-800/50 rounded-lg border border-neutral-800">
            <div className="flex gap-3">
              <Bell className="w-5 h-5 text-orange-500 mt-1" />
              <div>
                <p className="text-white font-medium">Safety Monitoring</p>
                <p className="text-sm text-neutral-400">Detects cyberbullying, explicit content, and scams in messages.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Active</span>
            </div>
          </div>

        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Underlying Permissions</h2>
        <p className="text-sm text-neutral-400 mb-4">These are the actual Android permissions granted by this device.</p>
        
        <div className="grid grid-cols-2 gap-4">
          {device.permissions?.map((p: any, i: number) => (
            <div key={i} className="p-3 bg-neutral-800/30 rounded-lg border border-neutral-800 flex justify-between items-center">
              <span className="text-sm text-neutral-300">{p.feature}</span>
              <span className={`text-xs font-bold uppercase ${p.status === 'ENABLED' || p.status === 'GRANTED' ? 'text-emerald-500' : 'text-red-500'}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
