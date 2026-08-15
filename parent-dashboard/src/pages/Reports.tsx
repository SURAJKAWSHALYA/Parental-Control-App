import { useState, useEffect } from 'react';
import { BarChart3, MapPin, ShieldAlert, Navigation, Phone, MessageSquare, Bell, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const Reports = () => {
  const [report, setReport] = useState<any>(null);
  const [safetyReport, setSafetyReport] = useState<any>(null);
  const [commReport, setCommReport] = useState<any>(null);
  
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [filterDays, setFilterDays] = useState<string>('7');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (devices.length > 0) {
      // If no device is selected, just use the first one for the specific device endpoints
      const deviceIdToFetch = selectedDevice || devices[0]?._id;
      if (deviceIdToFetch) {
        fetchAllReports(deviceIdToFetch);
      }
    }
  }, [devices, selectedDevice, filterDays]);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/devices');
      if (res.data.success) {
        setDevices(res.data.data);
      }
    } catch (err) {
      setError('Failed to load devices');
    }
  };

  const fetchAllReports = async (deviceId: string) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (selectedDevice) params.append('deviceId', selectedDevice);
      if (filterDays) params.append('days', filterDays);

      const [weeklyRes, safetyRes, commRes] = await Promise.all([
        api.get(`/reports/weekly?${params.toString()}`),
        api.get(`/reports/${deviceId}/safety?days=${filterDays}`),
        api.get(`/reports/${deviceId}/communications?days=${filterDays}`)
      ]);

      if (weeklyRes.data?.success) setReport(weeklyRes.data.data);
      if (safetyRes.data?.success) setSafetyReport(safetyRes.data.data);
      if (commRes.data?.success) setCommReport(commRes.data.data);
      
    } catch (err) {
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !report) return <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!report) return <div className="p-8 text-center text-neutral-500">No data available</div>;

  const { statistics } = report;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            Advanced Reports
          </h1>
          <p className="text-neutral-400 mt-1">Comprehensive summary of device and safety activity.</p>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Devices (General stats)</option>
            {devices.map(device => (
              <option key={device._id} value={device._id}>
                {device.deviceName}
              </option>
            ))}
          </select>

          <select
            value={filterDays}
            onChange={(e) => setFilterDays(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="1">Today</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* General Activity Summary */}
      <h2 className="text-lg font-semibold text-white mt-8 mb-4">Activity Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-400">Location Updates</p>
            <h3 className="text-2xl font-bold text-white">{statistics.locationUpdates}</h3>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-400">Places Visited</p>
            <h3 className="text-2xl font-bold text-white">{statistics.placesVisited}</h3>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-400">Geofence Events</p>
            <h3 className="text-2xl font-bold text-white">{statistics.geofenceEvents}</h3>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800 flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-400">Blocked Websites</p>
            <h3 className="text-2xl font-bold text-white">{statistics.blockedWebsites}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Communications Summary */}
        {commReport && (
          <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              Communication Summary
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-neutral-800/50 rounded-lg">
                <span className="text-neutral-300 flex items-center gap-2"><Bell className="w-4 h-4 text-emerald-500" /> App Notifications</span>
                <span className="text-white font-medium">{commReport.notifications}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-neutral-800/50 rounded-lg">
                <span className="text-neutral-300 flex items-center gap-2"><Phone className="w-4 h-4 text-blue-500" /> Phone Calls</span>
                <span className="text-white font-medium">{commReport.calls}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-neutral-800/50 rounded-lg">
                <span className="text-neutral-300 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-indigo-500" /> SMS Messages</span>
                <span className="text-white font-medium">{commReport.sms}</span>
              </div>
            </div>
          </div>
        )}

        {/* Safety Summary */}
        {safetyReport && (
          <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-500" />
              Safety Summary
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-neutral-800/50 rounded-lg">
                <span className="text-neutral-300 flex items-center gap-2">Total Safety Events</span>
                <span className="text-white font-bold">{safetyReport.total}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-1">
                <span className="text-sm text-red-400 font-medium uppercase">Critical Risk</span>
                <span className="text-white font-medium">{safetyReport.CRITICAL}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-1">
                <span className="text-sm text-orange-400 font-medium uppercase">High Risk</span>
                <span className="text-white font-medium">{safetyReport.HIGH}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-1">
                <span className="text-sm text-yellow-400 font-medium uppercase">Medium Risk</span>
                <span className="text-white font-medium">{safetyReport.MEDIUM}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-1">
                <span className="text-sm text-blue-400 font-medium uppercase">Low Risk / Info</span>
                <span className="text-white font-medium">{safetyReport.LOW}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;
