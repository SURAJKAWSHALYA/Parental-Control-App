import { Shield, Smartphone, MessageSquare, Image as ImageIcon, Bell } from 'lucide-react';

export default function SafetySettings() {
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
                Scans images handled naturally by the device (e.g. screenshots or downloaded images) for explicit or graphic violence markers.
                <span className="block mt-1 text-xs text-yellow-500">Warning: May consume additional device battery to run local heuristics.</span>
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

      </div>
    </div>
  );
}
