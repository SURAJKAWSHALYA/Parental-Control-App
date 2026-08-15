import React, { useEffect, useState } from 'react';
import { Battery, Wifi, HardDrive, Smartphone, RefreshCw, MapPin, Shield, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import api from '../../services/api';

interface DeviceHealth {
  batteryLevel: number;
  isCharging: boolean;
  networkType: string;
  storageUsed: number;
  storageTotal: number;
  androidVersion: string;
  appVersion: string;
  lastSeen: string;
  syncStatus: string;
  locationStatus: string;
  permissionStatus: string;
}

interface Props {
  deviceId: string;
  deviceName: string;
}

export default function DeviceHealthCard({ deviceId, deviceName }: Props) {
  const [health, setHealth] = useState<DeviceHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (deviceId) fetchHealth();
  }, [deviceId]);

  const fetchHealth = async () => {
    try {
      const res = await api.get(`/device-health/${deviceId}`);
      if (res.data.success) {
        setHealth(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch device health');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 animate-pulse h-40"></div>;
  }

  if (!health) {
    return (
      <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800 text-center text-neutral-500">
        No health data available for this device.
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'SYNCED':
      case 'ENABLED':
      case 'GRANTED':
        return 'text-emerald-500';
      case 'SYNCING':
        return 'text-blue-500';
      case 'DISABLED':
      case 'MISSING':
      case 'FAILED':
        return 'text-red-500';
      default:
        return 'text-neutral-500';
    }
  };

  const isHealthy = health.batteryLevel > 20 && health.syncStatus === 'SYNCED' && health.permissionStatus === 'GRANTED';

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-500" />
            {deviceName} Health
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Last seen {new Date(health.lastSeen).toLocaleString()}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isHealthy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {isHealthy ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {isHealthy ? 'Healthy' : 'Needs Attention'}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <Battery className={`w-4 h-4 ${health.batteryLevel <= 20 && !health.isCharging ? 'text-red-500' : 'text-emerald-500'}`} />
            <span className="text-xs uppercase font-medium">Battery</span>
          </div>
          <p className="text-xl font-bold text-white">{health.batteryLevel}% {health.isCharging && '⚡'}</p>
        </div>

        <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <HardDrive className="w-4 h-4 text-blue-500" />
            <span className="text-xs uppercase font-medium">Storage</span>
          </div>
          <p className="text-xl font-bold text-white">{formatBytes(health.storageUsed)}</p>
          <p className="text-xs text-neutral-500 mt-1">of {formatBytes(health.storageTotal)}</p>
        </div>

        <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <RefreshCw className={`w-4 h-4 ${getStatusColor(health.syncStatus)}`} />
            <span className="text-xs uppercase font-medium">Sync Status</span>
          </div>
          <p className={`text-xl font-bold ${getStatusColor(health.syncStatus)}`}>{health.syncStatus}</p>
        </div>

        <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <Wifi className="w-4 h-4 text-indigo-500" />
            <span className="text-xs uppercase font-medium">Network</span>
          </div>
          <p className="text-xl font-bold text-white">{health.networkType}</p>
        </div>

        <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <MapPin className={`w-4 h-4 ${getStatusColor(health.locationStatus)}`} />
            <span className="text-xs uppercase font-medium">Location</span>
          </div>
          <p className={`text-sm font-bold ${getStatusColor(health.locationStatus)}`}>{health.locationStatus}</p>
        </div>

        <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <Shield className={`w-4 h-4 ${getStatusColor(health.permissionStatus)}`} />
            <span className="text-xs uppercase font-medium">Permissions</span>
          </div>
          <p className={`text-sm font-bold ${getStatusColor(health.permissionStatus)}`}>{health.permissionStatus}</p>
        </div>
        
        <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50 col-span-2">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase font-medium flex items-center gap-2"><Smartphone className="w-4 h-4"/> System Info</span>
          </div>
          <p className="text-sm font-medium text-white">Android {health.androidVersion}</p>
          <p className="text-xs text-neutral-500 mt-1">App v{health.appVersion}</p>
        </div>

      </div>
    </div>
  );
}
