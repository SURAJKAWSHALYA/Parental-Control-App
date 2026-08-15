import { Shield, Smartphone, MessageSquare, Image as ImageIcon, Bell, Loader2 } from 'lucide-react';
import { AlertConfigForm } from '../components/forms/AlertConfigForm';
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function SafetySettings() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  useEffect(() => {
    api.get('/children').then(res => {
      const data = res.data.data;
      setChildren(data);
      if (data.length > 0) setSelectedChildId(data[0]._id);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-500" />
          Safety Settings
        </h1>
        <p className="text-neutral-400 mt-1">
          Configure what is monitored and analyzed by the Safety Engine.
        </p>
      </div>

      <div className="space-y-4">
        
        {/* Real-time Alerts */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex justify-between items-center">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-indigo-500/10 rounded-lg shrink-0"><Bell className="w-6 h-6 text-indigo-500" /></div>
            <div>
              <h3 className="text-white font-medium mb-1">Real-Time Alerts</h3>
              <p className="text-sm text-neutral-400 max-w-lg">
                Receive immediate global notifications when High or Critical severity safety events are detected. Requires active dashboard session.
              </p>
            </div>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex justify-between items-center">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-emerald-500/10 rounded-lg shrink-0"><Smartphone className="w-6 h-6 text-emerald-500" /></div>
            <div>
              <h3 className="text-white font-medium mb-1">Notification Safety Analysis</h3>
              <p className="text-sm text-neutral-400 max-w-lg">
                Scans incoming notifications from WhatsApp, Instagram, Discord, and other apps for threats, bullying, and explicit keywords. 
                <span className="block mt-1 text-xs text-indigo-400">Requires: Android Notification Access Permission</span>
              </p>
            </div>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* SMS */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex justify-between items-center">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-blue-500/10 rounded-lg shrink-0"><MessageSquare className="w-6 h-6 text-blue-500" /></div>
            <div>
              <h3 className="text-white font-medium mb-1">SMS Safety Analysis</h3>
              <p className="text-sm text-neutral-400 max-w-lg">
                Monitors standard SMS messages for scam indicators, harassment, and harmful content.
                <span className="block mt-1 text-xs text-indigo-400">Requires: Android SMS Permission</span>
              </p>
            </div>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>

        {/* Image */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex justify-between items-center">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-pink-500/10 rounded-lg shrink-0"><ImageIcon className="w-6 h-6 text-pink-500" /></div>
            <div>
              <h3 className="text-white font-medium mb-1">Image Safety Detection</h3>
              <p className="text-sm text-neutral-400 max-w-lg">
                Scans explicitly shared images in Family Chat for explicit or graphic violence markers.
              </p>
            </div>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>
        </div>

        {/* Video */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex justify-between items-center">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-purple-500/10 rounded-lg shrink-0"><Shield className="w-6 h-6 text-purple-500" /></div>
            <div>
              <h3 className="text-white font-medium mb-1">Video Safety Detection</h3>
              <p className="text-sm text-neutral-400 max-w-lg">
                Scans explicitly shared videos in Family Chat by sampling frames for inappropriate content.
              </p>
            </div>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>
        </div>

        {/* Message Safety */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex justify-between items-center">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-cyan-500/10 rounded-lg shrink-0"><MessageSquare className="w-6 h-6 text-cyan-500" /></div>
            <div>
              <h3 className="text-white font-medium mb-1">Message Safety Detection</h3>
              <p className="text-sm text-neutral-400 max-w-lg">
                Scans Family Chat messages for bullying, explicit content, or dangerous behavior.
              </p>
            </div>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
        </div>

        {/* Notification Preview */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex justify-between items-center mb-8">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-orange-500/10 rounded-lg shrink-0"><Bell className="w-6 h-6 text-orange-500" /></div>
            <div>
              <h3 className="text-white font-medium mb-1">Notification Preview</h3>
              <p className="text-sm text-neutral-400 max-w-lg">
                Allow raw text snippets or media previews inside parent dashboard notifications. Disable for strict privacy.
              </p>
            </div>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        </div>

        {/* Advanced Alert Rules */}
        <div className="pt-8 border-t border-neutral-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Advanced Alert Configuration</h2>
            {children.length > 0 && (
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none"
              >
                {children.map(child => (
                  <option key={child._id} value={child._id}>{child.name}</option>
                ))}
              </select>
            )}
          </div>
          
          {selectedChildId ? (
            <AlertConfigForm childId={selectedChildId} />
          ) : (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
