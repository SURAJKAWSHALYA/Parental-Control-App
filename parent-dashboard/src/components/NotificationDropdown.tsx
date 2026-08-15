import { useState, useEffect, useRef } from 'react';
import { Bell, ShieldAlert, CheckCircle, Info, Activity } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewSafety = (event: any) => {
      setNotifications(prev => [event, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    };

    socket.on('safety:new', handleNewSafety);
    return () => {
      socket.off('safety:new', handleNewSafety);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      // For global dropdown, fetch recent unread safety events + some alerts.
      // To simplify, we fetch recent SafetyEvents.
      const res = await api.get('/safety?status=NEW&limit=10');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.data.filter((n: any) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/safety/read-all', {});
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/safety/${id}`, { isRead: true });
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) markAsRead(n._id);
    setIsOpen(false);
    navigate('/dashboard/safety-center');
  };

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'HIGH': return <ShieldAlert className="w-5 h-5 text-orange-500" />;
      case 'MEDIUM': return <Info className="w-5 h-5 text-yellow-500" />;
      default: return <Activity className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-neutral-900 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="flex justify-between items-center p-4 border-b border-neutral-800">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-neutral-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {notifications.map(n => (
                  <div 
                    key={n._id} 
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 hover:bg-neutral-800/50 cursor-pointer transition-colors flex gap-3 ${!n.isRead ? 'bg-neutral-800/20' : ''}`}
                  >
                    <div className="mt-1">
                      {getIcon(n.severity)}
                    </div>
                    <div>
                      <p className={`text-sm ${!n.isRead ? 'text-white font-medium' : 'text-neutral-300'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                        {n.description}
                      </p>
                      <p className="text-[10px] text-neutral-600 mt-2 uppercase font-medium">
                        {new Date(n.timestamp).toTimeString().substring(0,5)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 ml-auto shrink-0"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-neutral-800 text-center">
            <button 
              onClick={() => { setIsOpen(false); navigate('/dashboard/safety-center'); }}
              className="text-sm text-neutral-400 hover:text-white transition-colors"
            >
              View Safety Center
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
