import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  Clock, 
  Gamepad2, 
  Globe, 
  MapPin, 
  Activity,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  ShieldCheck,
  Phone,
  Map,
  Crosshair,
  Inbox,
  ShieldAlert
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import NotificationDropdown from '../components/NotificationDropdown';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Children', path: '/children', icon: Users },
  { name: 'Devices', path: '/devices', icon: Smartphone },
  { name: 'Screen Time', path: '/screen-time', icon: Clock },
  { name: 'Apps', path: '/apps', icon: Gamepad2 },
  { name: 'Downtime', path: '/downtime', icon: Clock },
  { name: 'Websites', path: '/websites', icon: Globe },
  { name: 'Location', path: '/location', icon: MapPin },
  { name: 'Places', path: '/places', icon: Map },
  { name: 'Geofences', path: '/geofences', icon: Crosshair },
  { name: 'Notifications', path: '/notifications', icon: Inbox },
  { name: 'Calls & SMS', path: '/calls', icon: Phone },
  { name: 'Safety Center', path: '/safety-center', icon: ShieldCheck },
  { name: 'Alerts', path: '/alerts', icon: ShieldAlert },
  { name: 'Activity', path: '/activity', icon: Activity },
  { name: 'Reports', path: '/reports', icon: LayoutDashboard },
  { name: 'Safety Settings', path: '/safety-settings', icon: ShieldCheck },
  { name: 'Family Chat', path: '/chat', icon: MessageSquare },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = () => {
      // Notification handled by NotificationDropdown internally if needed
    };
    socket.on('alert:new', handleNewNotification);
    return () => {
      socket.off('alert:new', handleNewNotification);
    };
  }, [socket]);

  return (
    <div className="flex h-screen bg-neutral-900 text-gray-100 font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-neutral-950 border-r border-neutral-800 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-16 border-b border-neutral-800 gap-3">
          <img src="/logo.png" alt="SafeNest Logo" className="w-8 h-8 rounded-lg shadow-sm" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            SafeNest
          </h1>
        </div>
        
        <div className="overflow-y-auto h-[calc(100vh-4rem)] pb-4">
          <nav className="px-4 mt-6 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-blue-600/10 text-blue-400' 
                      : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                  }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-400' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 z-10 sticky top-0">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 mr-3 -ml-2 text-neutral-400 rounded-lg lg:hidden hover:bg-neutral-800 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-neutral-100 hidden sm:block">
              {navItems.find(item => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)))?.name || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-neutral-200">{user?.fullName}</span>
              <span className="text-xs text-neutral-500">Parent Account</span>
            </div>
            <button 
              onClick={logout}
              className="flex items-center p-2 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-900 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
