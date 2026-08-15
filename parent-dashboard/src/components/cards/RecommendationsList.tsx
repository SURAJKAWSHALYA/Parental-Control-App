import { useState, useEffect } from 'react';
import { Lightbulb, Check, X, ArrowRight } from 'lucide-react';
import api from '../../services/api';

interface Recommendation {
  _id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  source: string;
}

export const RecommendationsList = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await api.get('/recommendations');
      setRecommendations(res.data.data);
    } catch (err) {
      console.error('Failed to load recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = async (id: string) => {
    try {
      await api.put(`/recommendations/${id}/dismiss`);
      setRecommendations(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      console.error('Failed to dismiss', err);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-neutral-500">Loading recommendations...</div>;
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          <Lightbulb className="w-6 h-6 text-neutral-500" />
        </div>
        <h3 className="text-white font-medium mb-1">No Recommendations</h3>
        <p className="text-sm text-neutral-400">Your current settings are well optimized based on recent activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map(rec => (
        <div key={rec._id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <div className="flex gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              rec.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-500' : 'bg-indigo-500/10 text-indigo-500'
            }`}>
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-white">{rec.title}</h4>
                <span className="text-[10px] uppercase font-bold bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                  {rec.source}
                </span>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-xl">{rec.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:ml-auto">
            <button 
              onClick={() => dismiss(rec._id)}
              className="px-3 py-1.5 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Dismiss
            </button>
            <button className="px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1">
              Review Settings
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
