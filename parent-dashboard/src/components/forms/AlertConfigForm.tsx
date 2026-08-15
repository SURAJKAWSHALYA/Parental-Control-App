import React, { useState, useEffect } from 'react';
import { Bell, Clock, Save, Loader2, Info } from 'lucide-react';
import api from '../../services/api';

interface AlertRule {
  _id: string;
  type: string;
  enabled: boolean;
  severity: string;
  cooldownMinutes: number;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    ignoreCritical: boolean;
  };
}

export const AlertConfigForm = ({ childId }: { childId: string }) => {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, [childId]);

  const fetchRules = async () => {
    try {
      const res = await api.get(`/alert-rules/child/${childId}`);
      setRules(res.data.data);
    } catch (err) {
      console.error('Failed to fetch alert rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<AlertRule>) => {
    try {
      setSaving(id);
      const res = await api.put(`/alert-rules/${id}`, updates);
      setRules(rules.map(r => r._id === id ? res.data.data : r));
    } catch (err) {
      console.error('Failed to update alert rule', err);
    } finally {
      setSaving(null);
    }
  };

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) return <div className="p-4 text-center text-neutral-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          Advanced Alert Configuration
        </h3>
        <p className="text-sm text-neutral-400 mb-6">
          Manage how and when alerts are generated. Configure cooldowns to prevent duplicate notifications.
        </p>

        <div className="space-y-6">
          {rules.map(rule => (
            <div key={rule._id} className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-white">{formatType(rule.type)}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      rule.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                      rule.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
                      rule.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-emerald-500/20 text-emerald-500'
                    }`}>
                      {rule.severity}
                    </span>
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Cooldown: {rule.cooldownMinutes} min
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={rule.enabled}
                    onChange={(e) => handleUpdate(rule._id, { enabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>

              {rule.enabled && (
                <div className="pt-4 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Cooldown (Minutes)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={rule.cooldownMinutes}
                      onChange={(e) => handleUpdate(rule._id, { cooldownMinutes: parseInt(e.target.value) || 0 })}
                      className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-sm"
                    />
                    <p className="text-[10px] text-neutral-500 mt-1 flex gap-1">
                      <Info className="w-3 h-3 shrink-0" />
                      Prevents identical alerts for this duration.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-neutral-400">
                      <input 
                        type="checkbox" 
                        checked={rule.quietHours.enabled}
                        onChange={(e) => handleUpdate(rule._id, { quietHours: { ...rule.quietHours, enabled: e.target.checked } })}
                        className="rounded border-neutral-700 bg-neutral-900 text-indigo-500"
                      />
                      Enable Quiet Hours
                    </label>
                    
                    {rule.quietHours.enabled && (
                      <div className="flex gap-2 items-center">
                        <input 
                          type="time" 
                          value={rule.quietHours.start}
                          onChange={(e) => handleUpdate(rule._id, { quietHours: { ...rule.quietHours, start: e.target.value } })}
                          className="bg-neutral-900 border border-neutral-700 text-white rounded-lg px-2 py-1 text-sm"
                        />
                        <span className="text-neutral-500 text-xs">to</span>
                        <input 
                          type="time" 
                          value={rule.quietHours.end}
                          onChange={(e) => handleUpdate(rule._id, { quietHours: { ...rule.quietHours, end: e.target.value } })}
                          className="bg-neutral-900 border border-neutral-700 text-white rounded-lg px-2 py-1 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {rules.length === 0 && (
            <div className="text-center p-6 bg-neutral-950 rounded-xl border border-neutral-800">
              <p className="text-neutral-500 text-sm">No alert rules configured yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
