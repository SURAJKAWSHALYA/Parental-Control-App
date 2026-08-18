import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

interface Alert {
  _id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewAlert = (alert: Alert) => {
      setAlerts(prev => [alert, ...prev]);
    };

    socket.on('alert:new', handleNewAlert);
    return () => {
      socket.off('alert:new', handleNewAlert);
    };
  }, [socket]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alerts');
      if (res.data.success) {
        const payload = res.data.data;
        const alertsArray = payload.data && Array.isArray(payload.data) ? payload.data : 
                            Array.isArray(payload) ? payload : [];
        setAlerts(alertsArray);
      }
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/alerts/${id}/read`);
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/alerts/read-all');
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString();
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading && !alerts.length) {
    return <div className="flex h-full items-center justify-center text-gray-500">Loading alerts...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-500">System notifications and restriction breaches</p>
        </div>
        
        {alerts.some(a => !a.isRead) && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="text-gray-500 max-w-sm mt-1">You have no alerts at this time.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {alerts.map(alert => (
              <li 
                key={alert._id} 
                className={`p-4 sm:px-6 transition-colors ${alert.isRead ? 'bg-white' : 'bg-blue-50/30'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${alert.isRead ? 'bg-transparent' : 'bg-blue-600'}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityColor(alert.severity)}`}>
                        {alert.type.replace(/_/g, ' ')}
                      </span>
                      <span className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(alert.createdAt)}
                      </span>
                    </div>
                    <p className={`text-sm font-medium ${alert.isRead ? 'text-gray-900' : 'text-blue-900'}`}>
                      {alert.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {alert.message}
                    </p>
                  </div>
                  
                  {!alert.isRead && (
                    <button 
                      onClick={() => markAsRead(alert._id)}
                      className="flex-shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Alerts;
