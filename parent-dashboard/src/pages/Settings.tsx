import React, { useState, useEffect } from 'react';
import { Shield, Users, Database, Trash2, Key, AlertTriangle, Eye, Server } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Family');
  const [members, setMembers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (activeTab === 'Family') fetchMembers();
    if (activeTab === 'Audit') fetchAuditLogs();
  }, [activeTab]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/family/members');
      setMembers(res.data.data);
    } catch (err) {
      console.error('Failed to load members', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit');
      setAuditLogs(res.data.data.logs);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      await api.post('/family/invite', { email: inviteEmail, permissions: ['VIEW_ONLY'] });
      setInviteEmail('');
      fetchMembers();
    } catch (err) {
      console.error('Failed to invite', err);
      alert('Failed to invite co-parent. Make sure you are the OWNER and email is unique.');
    }
  };

  const handleDeleteData = async () => {
    if (window.confirm('Are you sure you want to delete all family data? This action cannot be undone.')) {
      try {
        await api.delete('/family/delete-data');
        alert('Family data scheduled for deletion. You will be logged out shortly.');
      } catch (err) {
        alert('Failed to delete data. Make sure you have OWNER permissions.');
      }
    }
  };

  const tabs = [
    { id: 'Family', icon: <Users className="w-5 h-5" /> },
    { id: 'Audit', icon: <Server className="w-5 h-5" /> },
    { id: 'Data', icon: <Database className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-500" />
          Settings
        </h1>
        <p className="text-neutral-400 mt-1">Manage family roles, data retention, and system audit logs.</p>
      </div>

      <div className="border-b border-neutral-800">
        <nav className="flex space-x-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 font-medium transition-colors border-b-2 ${
                activeTab === tab.id 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.icon}
              {tab.id}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {/* Family Tab */}
        {activeTab === 'Family' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Family Members</h2>
              <div className="space-y-4">
                {members.map(member => (
                  <div key={member._id} className="flex justify-between items-center p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold">
                        {member.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{member.email} {member._id === user?._id ? '(You)' : ''}</p>
                        <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                          <Key className="w-3 h-3" />
                          {member.role}
                        </p>
                      </div>
                    </div>
                    {member.role !== 'OWNER' && user?.role === 'OWNER' && (
                      <button className="text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-md">
                        Manage
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {user?.role === 'OWNER' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-2">Invite Co-Parent</h2>
                <p className="text-sm text-neutral-400 mb-4">Invite a co-parent or guardian to help monitor activity.</p>
                <form onSubmit={handleInvite} className="flex gap-4">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Email Address"
                    required
                    className="flex-1 bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium">
                    Send Invite
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'Audit' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">System Audit Log</h2>
              <button onClick={fetchAuditLogs} className="text-sm text-indigo-400 hover:text-indigo-300">Refresh</button>
            </div>
            {loading ? (
              <div className="p-8 text-center text-neutral-500">Loading logs...</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">No audit logs found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-neutral-400">
                  <thead className="bg-neutral-950 text-neutral-500 uppercase">
                    <tr>
                      <th className="px-6 py-3 font-medium">Timestamp</th>
                      <th className="px-6 py-3 font-medium">Action</th>
                      <th className="px-6 py-3 font-medium">Actor</th>
                      <th className="px-6 py-3 font-medium">Target</th>
                      <th className="px-6 py-3 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {auditLogs.map(log => (
                      <tr key={log._id} className="hover:bg-neutral-800/50">
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4 font-medium text-white">{log.action}</td>
                        <td className="px-6 py-4">
                          <span className="bg-neutral-800 px-2 py-1 rounded text-xs">{log.actorRole}</span>
                        </td>
                        <td className="px-6 py-4">{log.targetType}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => alert(JSON.stringify(log.metadata, null, 2))} className="text-neutral-500 hover:text-indigo-400">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'Data' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 border-l-4 border-l-red-500">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Danger Zone
              </h2>
              <p className="text-sm text-neutral-400 mb-6">
                Deleting family data will permanently remove all child profiles, connected devices, settings, activity logs, and media assets. This action cannot be reversed.
              </p>
              <button 
                onClick={handleDeleteData}
                disabled={user?.role !== 'OWNER'}
                className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors border border-red-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete All Family Data
              </button>
              {user?.role !== 'OWNER' && (
                <p className="text-xs text-red-500 mt-2">Only the Family Owner can perform this action.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
