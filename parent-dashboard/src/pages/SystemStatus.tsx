import { useState, useEffect } from 'react';
import { Activity, Database, Server, Cpu, HardDrive, ShieldAlert, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import api from '../services/api';

interface HealthData {
  api: string;
  database: string;
  socketIO: string;
  storage: string;
  queue: string;
  aiService: string;
  timestamp: string;
  uptimeSeconds: number;
}

export default function SystemStatus() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      setError(null);
      const res = await api.get('/health');
      setHealth(res.data.data);
    } catch (err: any) {
      setError('Unable to fetch system status. The backend might be unreachable.');
      if (err.response?.data?.data) {
        setHealth(err.response.data.data); // It might still return degraded data
      }
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'OK') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (status === 'DEGRADED') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  if (loading && !health) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-500" />
          System Status
        </h1>
        <p className="text-neutral-400 mt-1">
          Monitor the real-time health of core infrastructure services.
        </p>
      </div>

      {error && !health && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-lg"><Server className="w-5 h-5 text-indigo-500" /></div>
              <div>
                <h3 className="text-white font-medium">Core API Service</h3>
                <p className="text-sm text-neutral-500">REST endpoints & auth</p>
              </div>
            </div>
            <StatusIcon status={health.api} />
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-lg"><Database className="w-5 h-5 text-blue-500" /></div>
              <div>
                <h3 className="text-white font-medium">Database (MongoDB)</h3>
                <p className="text-sm text-neutral-500">Primary data store</p>
              </div>
            </div>
            <StatusIcon status={health.database} />
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-lg"><Activity className="w-5 h-5 text-emerald-500" /></div>
              <div>
                <h3 className="text-white font-medium">Real-Time Messaging</h3>
                <p className="text-sm text-neutral-500">Socket.IO Server</p>
              </div>
            </div>
            <StatusIcon status={health.socketIO} />
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 rounded-lg"><HardDrive className="w-5 h-5 text-cyan-500" /></div>
              <div>
                <h3 className="text-white font-medium">Media Storage</h3>
                <p className="text-sm text-neutral-500">S3 / MinIO Object Storage</p>
              </div>
            </div>
            <StatusIcon status={health.storage} />
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-lg"><ShieldAlert className="w-5 h-5 text-purple-500" /></div>
              <div>
                <h3 className="text-white font-medium">AI Safety Engine</h3>
                <p className="text-sm text-neutral-500">Content moderation & intelligence</p>
              </div>
            </div>
            <StatusIcon status={health.aiService} />
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-neutral-800 rounded-lg"><Cpu className="w-5 h-5 text-neutral-400" /></div>
              <div>
                <h3 className="text-white font-medium">System Uptime</h3>
                <p className="text-sm text-neutral-500">Backend process</p>
              </div>
            </div>
            <div className="text-sm font-medium text-white">
              {formatUptime(health.uptimeSeconds)}
            </div>
          </div>
        </div>
      )}

      {health && (
        <p className="text-xs text-neutral-500 text-right mt-4">
          Last checked: {new Date(health.timestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
