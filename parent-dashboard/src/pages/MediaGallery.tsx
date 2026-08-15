import { useState, useEffect } from 'react';
import api from '../services/api';
import { Image, Video, ShieldAlert, Image as ImageIcon, Trash2 } from 'lucide-react';
import MediaViewer from '../components/MediaViewer';

export default function MediaGallery() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Photos' | 'Videos' | 'Safety'>('All');
  const [selectedMedia, setSelectedMedia] = useState<{ id: string, type: 'IMAGE' | 'VIDEO' } | null>(null);

  useEffect(() => {
    fetchMedia(true);
  }, [filter]);

  const fetchMedia = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.append('limit', '50');
      
      if (filter === 'Photos') params.append('type', 'IMAGE');
      if (filter === 'Videos') params.append('type', 'VIDEO');
      if (filter === 'Safety') params.append('safetyStatus', 'FLAGGED');

      if (!reset && media.length > 0) {
        params.append('cursor', media[media.length - 1].createdAt);
      }

      const res = await api.get(`/media/gallery?${params.toString()}`);
      if (res.data.success) {
        const fetched = res.data.data;
        if (fetched.length < 50) setHasMore(false);
        
        if (reset) {
          setMedia(fetched);
        } else {
          setMedia(prev => [...prev, ...fetched]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch media gallery', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this media permanently?')) return;
    
    try {
      const res = await api.delete(`/media/${id}`);
      if (res.data.success) {
        setMedia(prev => prev.filter(m => m._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete media', err);
      alert('Failed to delete media. You may not have authorization.');
    }
  };

  const filteredMedia = media; // Already filtered server-side now

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col justify-between sm:flex-row items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-pink-500" />
            Media Gallery
          </h1>
          <p className="text-neutral-400 mt-1">
            View shared images and videos from Family Chat.
          </p>
        </div>

        <div className="flex bg-neutral-800/50 p-1 rounded-xl border border-neutral-700/50">
          {(['All', 'Photos', 'Videos', 'Safety'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-neutral-700 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading gallery...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed">
          <ImageIcon className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No media found</h3>
          <p className="text-neutral-400">No images or videos match the current filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMedia.map(m => (
            <div 
              key={m._id}
              onClick={() => setSelectedMedia({ id: m._id, type: m.type })}
              className="group relative aspect-square bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700/50 hover:border-pink-500/50 transition-colors cursor-pointer"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {m.type === 'VIDEO' ? (
                  <Video className="w-12 h-12 text-neutral-600" />
                ) : (
                  <Image className="w-12 h-12 text-neutral-600" />
                )}
              </div>
              
              {/* Overlay info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="flex justify-end">
                  <button 
                    onClick={(e) => handleDelete(e, m._id)}
                    className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <p className="text-xs text-neutral-300">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-medium text-white">
                    {(m.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && !loading && media.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => fetchMedia(false)}
            disabled={loadingMore}
            className="px-6 py-2 bg-neutral-800 text-white rounded-xl font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loadingMore ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Loading...</>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {selectedMedia && (
        <MediaViewer 
          mediaId={selectedMedia.id}
          type={selectedMedia.type}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </div>
  );
}
