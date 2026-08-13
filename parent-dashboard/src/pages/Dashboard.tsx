import { Users, Smartphone, ShieldAlert, Clock, Activity, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

const StatCard = ({ title, value, icon: Icon, colorClass, link }: any) => (
  <Link to={link} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-colors group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-neutral-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </Link>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    children: 0,
    devices: 0,
    alerts: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [childRes, deviceRes, alertRes] = await Promise.all([
          api.get('/children'),
          api.get('/devices'),
          api.get('/alerts')
        ]);
        
        setStats({
          children: childRes.data.success ? childRes.data.data.length : 0,
          devices: deviceRes.data.success ? deviceRes.data.data.length : 0,
          alerts: alertRes.data.success ? alertRes.data.data.filter((a: any) => !a.isRead).length : 0,
          loading: false
        });
      } catch (err) {
        console.error(err);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Overview</h2>
        <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm font-medium border border-blue-500/20">
          System Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Children" 
          value={stats.loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.children} 
          icon={Users} 
          colorClass="bg-blue-500 shadow-lg shadow-blue-500/20" 
          link="/children"
        />
        <StatCard 
          title="Active Devices" 
          value={stats.loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.devices} 
          icon={Smartphone} 
          colorClass="bg-indigo-500 shadow-lg shadow-indigo-500/20" 
          link="/devices"
        />
        <StatCard 
          title="Unread Alerts" 
          value={stats.loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.alerts} 
          icon={ShieldAlert} 
          colorClass="bg-red-500 shadow-lg shadow-red-500/20" 
          link="/alerts"
        />
        <StatCard 
          title="View Activity" 
          value="Log" 
          icon={Activity} 
          colorClass="bg-emerald-500 shadow-lg shadow-emerald-500/20" 
          link="/activity"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-neutral-500" />
            </div>
            <p className="text-neutral-300 font-medium">No activity yet</p>
            <p className="text-neutral-500 text-sm mt-1">Connect a child's device to start monitoring.</p>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/children" className="w-full flex items-center p-4 bg-neutral-950 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors">
              <div className="bg-blue-500/10 p-2 rounded-lg mr-4">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white">Add a Child</p>
                <p className="text-xs text-neutral-500">Create a profile for your child</p>
              </div>
            </Link>
            
            <Link to="/devices" className="w-full flex items-center p-4 bg-neutral-950 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors">
              <div className="bg-indigo-500/10 p-2 rounded-lg mr-4">
                <Smartphone className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-white flex items-center justify-between">
                  Manage Devices
                </p>
                <p className="text-xs text-neutral-500">View or pair new devices</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
