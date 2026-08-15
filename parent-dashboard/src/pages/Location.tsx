import { useState, useEffect } from 'react';
import { MapPin, AlertCircle, RefreshCw, History, Clock, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { locationService } from '../services/location.service';
import type { LocationRecord } from '../services/location.service';
import { placeService } from '../services/place.service';
import type { Place } from '../services/place.service';
import { geofenceService } from '../services/geofence.service';
import type { Geofence } from '../services/geofence.service';
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

// Map Event Component for picking a location
function LocationPicker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

const Location = () => {
  const [activeTab, setActiveTab] = useState<'LIVE' | 'HISTORY' | 'PLACES' | 'GEOFENCES'>('LIVE');
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  // Data State
  const [currentLocation, setCurrentLocation] = useState<LocationRecord | null>(null);
  const [history, setHistory] = useState<LocationRecord[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | '7days'>('today');
  
  const { socket } = useSocket();

  // Place Modal State
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [placeForm, setPlaceForm] = useState({ name: '', address: '', radiusMeters: 150 });
  const [placePosition, setPlacePosition] = useState<L.LatLng | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      fetchData();
    }
  }, [selectedDeviceId, timeFilter, activeTab]);

  useEffect(() => {
    if (!socket || !selectedDeviceId) return;

    const handleLocationUpdated = (data: any) => {
      if (data.deviceId === selectedDeviceId) {
        setCurrentLocation(data.location);
        if (timeFilter === 'today') {
            setHistory(prev => [data.location, ...prev]);
        }
      }
    };

    const handleGeofenceUpdate = (data: any) => {
      if (data.deviceId === selectedDeviceId && activeTab === 'GEOFENCES') {
         fetchData();
      }
    };

    socket.on('location:updated', handleLocationUpdated);
    socket.on('geofence:update', handleGeofenceUpdate);

    return () => {
      socket.off('location:updated', handleLocationUpdated);
      socket.off('geofence:update', handleGeofenceUpdate);
    };
  }, [socket, selectedDeviceId, timeFilter, activeTab]);

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

  const fetchData = async () => {
    if (!selectedDeviceId) return;
    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'LIVE' || activeTab === 'HISTORY') {
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
          locationService.getCurrentLocation(selectedDeviceId),
          locationService.getLocationHistory(selectedDeviceId, { 
              startDate: start.toISOString(),
              endDate: timeFilter === 'yesterday' ? end.toISOString() : undefined,
              limit: 200 
          })
        ]);
        
        if (currentRes) setCurrentLocation(currentRes);
        if (historyRes?.data) setHistory(historyRes.data);
      } else if (activeTab === 'PLACES') {
        const placesRes = await placeService.getPlaces();
        setPlaces(placesRes);
      } else if (activeTab === 'GEOFENCES') {
        const [placesRes, geoRes] = await Promise.all([
          placeService.getPlaces(),
          geofenceService.getGeofences(selectedDeviceId)
        ]);
        setPlaces(placesRes);
        setGeofences(geoRes);
      }
      
    } catch (err: any) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlace = async () => {
    if (!placeForm.name || !placePosition) return;
    try {
      await placeService.createPlace({
        name: placeForm.name,
        address: placeForm.address || 'Selected on map',
        latitude: placePosition.lat,
        longitude: placePosition.lng,
        radiusMeters: placeForm.radiusMeters
      });
      setIsPlaceModalOpen(false);
      setPlaceForm({ name: '', address: '', radiusMeters: 150 });
      setPlacePosition(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving place');
    }
  };

  const handleDeletePlace = async (id: string) => {
    if (!confirm('Delete this place? Associated geofences will also be deleted.')) return;
    try {
      await placeService.deletePlace(id);
      fetchData();
    } catch (err: any) {
      alert('Error deleting place');
    }
  };

  const handleToggleGeofence = async (placeId: string, currentGeofence: Geofence | undefined) => {
    try {
      if (currentGeofence) {
        await geofenceService.updateGeofence(selectedDeviceId, currentGeofence._id, { enabled: !currentGeofence.enabled });
      } else {
        await geofenceService.createGeofence(selectedDeviceId, { placeId, enabled: true, enterAlert: true, exitAlert: true });
      }
      fetchData();
    } catch (err: any) {
      alert('Error toggling geofence');
    }
  };

  if (loading && !devices.length) {
    return <div className="flex h-full items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const center: [number, number] = currentLocation 
    ? [currentLocation.latitude, currentLocation.longitude] 
    : [37.7749, -122.4194]; 

  const polylinePositions = history.map(h => [h.latitude, h.longitude] as [number, number]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location & Places</h1>
          <p className="text-gray-500">Live map, history, and geofencing rules</p>
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
            onClick={() => fetchData()}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 shrink-0">
        {(['LIVE', 'HISTORY', 'PLACES', 'GEOFENCES'] as const).map((tab) => (
          <button
            key={tab}
            className={`py-3 px-6 text-sm font-medium border-b-2 ${activeTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-red-700 shrink-0">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 min-h-0 relative">
        
        {/* LIVE & HISTORY Map View */}
        {(activeTab === 'LIVE' || activeTab === 'HISTORY') && (
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative z-0">
              <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {currentLocation && activeTab === 'LIVE' && (
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
                {activeTab === 'HISTORY' && polylinePositions.length > 1 && (
                  <Polyline positions={polylinePositions} color="#4F46E5" weight={3} opacity={0.6} />
                )}
              </MapContainer>
            </div>

            {/* Sidebar Timeline */}
            <div className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col shrink-0 min-h-0">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-500" /> Timeline
                    </h3>
                    <select 
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value as any)}
                        className="text-sm border-gray-300 rounded-md py-1"
                    >
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="7days">7 Days</option>
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
        )}

        {/* PLACES View */}
        {activeTab === 'PLACES' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium">Important Places</h2>
              <button 
                onClick={() => setIsPlaceModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                + Add Place
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {places.map(place => (
                <div key={place._id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <MapIcon className="w-4 h-4 text-indigo-500" /> {place.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{place.address}</p>
                    <p className="text-xs text-gray-400 mt-2">Radius: {place.radiusMeters}m</p>
                  </div>
                  <button onClick={() => handleDeletePlace(place._id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                    Delete
                  </button>
                </div>
              ))}
              {places.length === 0 && <p className="text-gray-500">No places added yet.</p>}
            </div>
          </div>
        )}

        {/* GEOFENCES View */}
        {activeTab === 'GEOFENCES' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full overflow-y-auto">
            <h2 className="text-lg font-medium mb-2">Geofence Rules</h2>
            <p className="text-gray-500 mb-6">Enable tracking for specific places and configure entry/exit alerts for this device.</p>
            
            <div className="space-y-4">
              {places.map(place => {
                const geo = geofences.find(g => g.placeId === place._id);
                const isEnabled = geo?.enabled || false;

                return (
                  <div key={place._id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{place.name}</h3>
                      <p className="text-sm text-gray-500">Alerts: {geo?.enterAlert ? 'Enter' : ''} {geo?.exitAlert ? 'Exit' : ''}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={() => handleToggleGeofence(place._id, geo)} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                );
              })}
              {places.length === 0 && <p className="text-gray-500">Add places first to create geofences.</p>}
            </div>
          </div>
        )}

      </div>

      {/* Add Place Modal */}
      {isPlaceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Add New Place</h3>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Place Name</label>
                <input 
                  type="text" value={placeForm.name} onChange={e => setPlaceForm({...placeForm, name: e.target.value})}
                  className="w-full border-gray-300 rounded-lg shadow-sm" placeholder="e.g. School"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input 
                    type="text" value={placeForm.address} onChange={e => setPlaceForm({...placeForm, address: e.target.value})}
                    className="w-full border-gray-300 rounded-lg shadow-sm" placeholder="Optional"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Radius (m)</label>
                  <input 
                    type="number" value={placeForm.radiusMeters} onChange={e => setPlaceForm({...placeForm, radiusMeters: Number(e.target.value)})}
                    className="w-full border-gray-300 rounded-lg shadow-sm" min="50" max="10000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Location on Map</label>
                <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                  <MapContainer center={[37.7749, -122.4194]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker position={placePosition} setPosition={setPlacePosition} />
                    {placePosition && <Circle center={placePosition} radius={placeForm.radiusMeters} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }} />}
                  </MapContainer>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsPlaceModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
              <button onClick={handleSavePlace} disabled={!placeForm.name || !placePosition} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium disabled:opacity-50">Save Place</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Location;
