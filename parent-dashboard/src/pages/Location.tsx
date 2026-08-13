import { useState, useEffect } from 'react';
import { MapPin, AlertCircle, RefreshCw, History, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { locationService } from '../services/location.service';
import type { LocationRecord } from '../services/location.service';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow, format } from 'date-fns';

// Fix leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Device {
  _id: string;
  deviceName: string;
}

const Location = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<LocationRecord | null>(null);
  const [history, setHistory] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | '7days'>('today');
  
  const { socket } = useSocket();

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      fetchData(selectedDeviceId);
    }
  }, [selectedDeviceId, timeFilter]);

  useEffect(() => {
    if (!socket || !selectedDeviceId) return;

    const handleLocationUpdated = (data: any) => {
      if (data.deviceId === selectedDeviceId) {
        setCurrentLocation(data.location);
        // Also prepend to history if it's today
        if (timeFilter === 'today') {
            setHistory(prev => [data.location, ...prev]);
        }
      }
    };

    socket.on('location:updated', handleLocationUpdated);

    return () => {
      socket.off('location:updated', handleLocationUpdated);
    };
  }, [socket, selectedDeviceId, timeFilter]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/devices');
      if (res.data?.success && res.data?.data) {
        setDevices(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedDeviceId(res.data.data[0]._id);
        }
      }
    } catch (err: any) {
      setError('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (deviceId: string) => {
    try {
      setLoading(true);
      setError('');
      
      let start = new Date();
      start.setHours(0,0,0,0);
      let end = new Date();
      
      if (timeFilter === 'yesterday') {
          start.setDate(start.getDate() - 1);
          end.setHours(0,0,0,0);
          end.setDate(end.getDate() - 1);
      } else if (timeFilter === '7days') {
          start.setDate(start.getDate() - 7);
      }
      
      const [currentRes, historyRes] = await Promise.all([
        locationService.getCurrentLocation(deviceId),
        locationService.getLocationHistory(deviceId, { 
            startDate: start.toISOString(),
            endDate: timeFilter === 'yesterday' ? end.toISOString() : undefined,
            limit: 200 // reasonable max for map render
        })
      ]);
      
      if (currentRes) {
        setCurrentLocation(currentRes);
      }
      if (historyRes?.data) {
          setHistory(historyRes.data);
      }
    } catch (err: any) {
      setError('Failed to fetch location data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !devices.length) {
    return <div className="flex h-full items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const center: [number, number] = currentLocation 
    ? [currentLocation.latitude, currentLocation.longitude] 
    : [37.7749, -122.4194]; // Default to SF if no location

  const polylinePositions = history.map(h => [h.latitude, h.longitude] as [number, number]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location Tracking</h1>
          <p className="text-gray-500">Live map and location history</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            className="border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-3 pr-10"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {devices.map(device => (
              <option key={device._id} value={device._id}>{device.deviceName}</option>
            ))}
          </select>
          <button 
            onClick={() => fetchData(selectedDeviceId)}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-red-700 shrink-0">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Map View */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative z-0">
          <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {currentLocation && (
              <Marker position={[currentLocation.latitude, currentLocation.longitude]}>
                <Popup>
                  <div className="font-sans">
                    <strong className="block text-sm mb-1">{devices.find(d => d._id === selectedDeviceId)?.deviceName || 'Device'}</strong>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Updated: {formatDistanceToNow(new Date(currentLocation.timestamp))} ago</div>
                      <div>Accuracy: {Math.round(currentLocation.accuracy)}m</div>
                      {currentLocation.battery && <div>Battery: {currentLocation.battery}%</div>}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
            {polylinePositions.length > 1 && (
              <Polyline positions={polylinePositions} color="#4F46E5" weight={3} opacity={0.6} />
            )}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col shrink-0 min-h-0">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-500" />
                    Timeline
                </h3>
                <select 
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as any)}
                    className="text-sm border-gray-300 rounded-md"
                >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="7days">Last 7 Days</option>
                </select>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.length > 0 ? (
                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                        {history.map((record) => (
                            <div key={record._id} className="relative pl-6">
                                <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-indigo-500"></span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-900">Location Record</span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" /> {format(new Date(record.timestamp), 'MMM d, h:mm a')}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">
                                        Acc: {Math.round(record.accuracy)}m 
                                        {record.battery && ` • Bat: ${record.battery}%`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <MapPin className="w-12 h-12 text-gray-300 mb-2" />
                        <p>No location data available.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Location;
