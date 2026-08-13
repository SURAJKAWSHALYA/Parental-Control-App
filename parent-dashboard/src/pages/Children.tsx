import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Smartphone, MoreVertical, Loader2 } from 'lucide-react';

interface Child {
  _id: string;
  name: string;
  dateOfBirth: string;
}

const Children = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildDob, setNewChildDob] = useState('');

  const fetchChildren = async () => {
    try {
      const response = await api.get('/children');
      setChildren(response.data.data);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/children', { name: newChildName, dateOfBirth: newChildDob });
      setIsModalOpen(false);
      setNewChildName('');
      setNewChildDob('');
      fetchChildren();
    } catch (error) {
      console.error('Error adding child:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Children</h2>
          <p className="text-neutral-400 text-sm mt-1">Manage profiles and connected devices</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Child
        </button>
      </div>

      {children.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-neutral-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No children added yet</h3>
          <p className="text-neutral-400 mb-6">Create a profile for your child to start monitoring their devices.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Child
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <Link key={child._id} to={`/children/${child._id}`} className="block group">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-inner">
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{child.name}</h3>
                      <p className="text-sm text-neutral-500">
                        {new Date().getFullYear() - new Date(child.dateOfBirth).getFullYear()} years old
                      </p>
                    </div>
                  </div>
                  <button className="text-neutral-500 hover:text-white p-1">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-sm">0 Devices</span>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-neutral-800 text-neutral-300 rounded-md">Setup Needed</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Child Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50">
              <h3 className="text-lg font-bold text-white">Add Child Profile</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleAddChild} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5 ml-1">Child's Name</label>
                  <input
                    type="text"
                    required
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1.5 ml-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={newChildDob}
                    onChange={(e) => setNewChildDob(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Needed to fix missing Users import in Children component scope for the Empty State
import { Users } from 'lucide-react';

export default Children;
