import { useState, useEffect } from 'react';
import { Plus, Trash2, Globe, AlertCircle, RefreshCw, Edit2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { websiteService } from '../services/website.service';
import type { WebsiteRule, WebsiteCategoryRule } from '../services/website.service';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

interface Device {
  _id: string;
  deviceName: string;
}

const Websites = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [rules, setRules] = useState<WebsiteRule[]>([]);
  const [categories, setCategories] = useState<WebsiteCategoryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'BLOCKED' | 'ALLOWED'>('CATEGORIES');
  
  const { socket } = useSocket();

  // Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleType, setRuleType] = useState<'BLOCK' | 'ALLOW'>('BLOCK');
  const [editingRule, setEditingRule] = useState<WebsiteRule | null>(null);
  const [domainInput, setDomainInput] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      fetchData(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    if (!socket || !selectedDeviceId) return;

    const handleSync = (data: any) => {
      if (data.deviceId === selectedDeviceId) {
        fetchData(selectedDeviceId); 
      }
    };

    socket.on('website:rule:create', handleSync);
    socket.on('website:rule:update', handleSync);
    socket.on('website:rule:delete', handleSync);
    socket.on('website:category:update', handleSync);
    socket.on('website:rules:sync', handleSync);

    return () => {
      socket.off('website:rule:create', handleSync);
      socket.off('website:rule:update', handleSync);
      socket.off('website:rule:delete', handleSync);
      socket.off('website:category:update', handleSync);
      socket.off('website:rules:sync', handleSync);
    };
  }, [socket, selectedDeviceId]);

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
      const [rulesRes, catsRes] = await Promise.all([
        websiteService.getRules(deviceId),
        websiteService.getCategories(deviceId)
      ]);
      setRules(rulesRes);
      setCategories(catsRes);
    } catch (err: any) {
      setError('Failed to fetch website data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = async (cat: WebsiteCategoryRule) => {
    try {
      await websiteService.updateCategory(selectedDeviceId, cat.category, !cat.blocked);
      fetchData(selectedDeviceId);
    } catch (err: any) {
      setError('Failed to update category');
    }
  };

  const handleSaveRule = async () => {
    if (!domainInput.trim() || !selectedDeviceId) return;
    try {
      if (editingRule) {
        await websiteService.updateRule(selectedDeviceId, editingRule._id, { domain: domainInput, type: ruleType });
      } else {
        await websiteService.createRule(selectedDeviceId, { domain: domainInput, type: ruleType });
      }
      setIsRuleModalOpen(false);
      setDomainInput('');
      setEditingRule(null);
      fetchData(selectedDeviceId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await websiteService.deleteRule(selectedDeviceId, id);
      fetchData(selectedDeviceId);
    } catch (err: any) {
      setError('Failed to delete rule');
    }
  };

  const handleToggleRuleStatus = async (rule: WebsiteRule) => {
    try {
      await websiteService.updateRule(selectedDeviceId, rule._id, { enabled: !rule.enabled });
      fetchData(selectedDeviceId);
    } catch (err: any) {
      setError('Failed to update rule status');
    }
  };

  const openModal = (type: 'BLOCK' | 'ALLOW', rule?: WebsiteRule) => {
    setRuleType(type);
    if (rule) {
      setEditingRule(rule);
      setDomainInput(rule.domain);
    } else {
      setEditingRule(null);
      setDomainInput('');
    }
    setIsRuleModalOpen(true);
  };

  if (loading && !devices.length) {
    return <div className="flex h-full items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const blockedRules = rules.filter(r => r.type === 'BLOCK');
  const allowedRules = rules.filter(r => r.type === 'ALLOW');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Restrictions</h1>
          <p className="text-gray-500">Manage web filters, blocked sites, and allowed domains</p>
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
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'CATEGORIES' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('CATEGORIES')}
        >
          Categories
        </button>
        <button
          className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'BLOCKED' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('BLOCKED')}
        >
          Blocked Websites
        </button>
        <button
          className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'ALLOWED' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('ALLOWED')}
        >
          Allowed Websites
        </button>
      </div>

      {activeTab === 'CATEGORIES' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-600 mb-6">Select which categories of websites should be blocked on this device. Specific domain rules (Allowed or Blocked) will override these category settings.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{cat.category}</span>
                  <span className={`text-xs ${cat.blocked ? 'text-red-600' : 'text-green-600'}`}>
                    {cat.blocked ? 'Blocked' : 'Allowed'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={cat.blocked} onChange={() => handleToggleCategory(cat)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === 'BLOCKED' || activeTab === 'ALLOWED') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="font-medium text-gray-900">
              {activeTab === 'BLOCKED' ? 'Always Blocked Websites' : 'Always Allowed Websites'}
            </h3>
            <button
              onClick={() => openModal(activeTab === 'BLOCKED' ? 'BLOCK' : 'ALLOW')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Website
            </button>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3 text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(activeTab === 'BLOCKED' ? blockedRules : allowedRules).length > 0 ? (
                (activeTab === 'BLOCKED' ? blockedRules : allowedRules).map(rule => (
                  <tr key={rule._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {rule.type === 'BLOCK' ? <ShieldAlert className="w-5 h-5 text-red-500 mr-3" /> : <ShieldCheck className="w-5 h-5 text-green-500 mr-3" />}
                        <div className="text-sm font-medium text-gray-900">{rule.domain}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => handleToggleRuleStatus(rule)} className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.enabled ? (rule.type === 'BLOCK' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800') : 'bg-gray-100 text-gray-800'}`}>
                        {rule.enabled ? (rule.type === 'BLOCK' ? 'BLOCKED' : 'ALLOWED') : 'DISABLED'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openModal(rule.type, rule)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteRule(rule._id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>No {activeTab.toLowerCase()} websites added yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingRule ? 'Edit Website' : `Add ${ruleType === 'BLOCK' ? 'Blocked' : 'Allowed'} Website`}
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain (e.g., youtube.com)
              </label>
              <input 
                type="text" 
                placeholder="example.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsRuleModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveRule}
                disabled={!domainInput.trim()}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Websites;
