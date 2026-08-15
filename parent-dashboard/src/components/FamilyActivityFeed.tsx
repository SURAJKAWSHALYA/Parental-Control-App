import React, { useState, useEffect } from 'react';
import { StateWrapper } from './cards/StateWrapper';
import api from '../services/api';
import { ShieldAlert, Globe, MapPin, Smartphone, Activity as ActivityIcon, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export const FamilyActivityFeed = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        // Fetch latest activities directly from activity API (or create an aggregated one if needed)
        // Since we want family wide, we assume /activity without childId returns all for parent
        const res = await api.get('/activity');
        if (res.data.success) {
          setActivities(res.data.data || []);
        } else {
          setIsError(true);
        }
      } catch (err) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const getFilteredActivities = () => {
    if (filter === 'All') return activities;
    return activities.filter((a) => {
      if (filter === 'Apps' && a.type.startsWith('APP_')) return true;
      if (filter === 'Websites' && a.type === 'WEB_VISIT') return true;
      if (filter === 'Location' && (a.type === 'LOCATION_CHANGE' || a.type.startsWith('GEOFENCE_'))) return true;
      if (filter === 'Communication' && a.type === 'CHAT_SAFETY_EVENT') return true; // Expand as needed
      if (filter === 'Safety' && (a.type === 'SAFETY' || a.type === 'MEDIA_FLAGGED')) return true;
      if (filter === 'Device' && (a.type === 'DEVICE_ONLINE' || a.type === 'DEVICE_OFFLINE')) return true;
      return false;
    });
  };

  const filtered = getFilteredActivities();

  const getActivityIcon = (type: string) => {
    if (type.startsWith('APP_')) return <Smartphone className="w-4 h-4 text-indigo-400" />;
    if (type === 'WEB_VISIT') return <Globe className="w-4 h-4 text-blue-400" />;
    if (type.includes('LOCATION') || type.includes('GEOFENCE')) return <MapPin className="w-4 h-4 text-emerald-400" />;
    if (type.includes('SAFETY') || type === 'MEDIA_FLAGGED') return <ShieldAlert className="w-4 h-4 text-red-400" />;
    if (type.includes('CHAT')) return <MessageSquare className="w-4 h-4 text-purple-400" />;
    return <ActivityIcon className="w-4 h-4 text-neutral-400" />;
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-semibold text-white">Family Activity</h3>
        <div className="flex flex-wrap gap-2">
          {['All', 'Apps', 'Websites', 'Location', 'Safety', 'Device'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <StateWrapper 
          isLoading={isLoading} 
          isError={isError} 
          isEmpty={filtered.length === 0}
          emptyMessage="No recent activity"
          emptySubmessage="Everything looks normal. There's no activity to show for this filter."
        >
          <div className="space-y-4">
            {filtered.map((activity) => (
              <div key={activity._id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="w-px h-full bg-neutral-800 mt-2"></div>
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-white">{activity.title}</p>
                  <p className="text-sm text-neutral-400 mt-1">{activity.description}</p>
                  <p className="text-xs text-neutral-500 mt-2">
                    {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </StateWrapper>
      </div>
    </div>
  );
};
