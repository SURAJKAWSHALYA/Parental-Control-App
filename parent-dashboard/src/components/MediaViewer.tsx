import React, { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';
import api from '../services/api';

interface MediaViewerProps {
  mediaId: string;
  type: 'IMAGE' | 'VIDEO';
  onClose: () => void;
}

export default function MediaViewer({ mediaId, type, onClose }: MediaViewerProps) {
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // To securely view media, we fetch it via an authenticated API request and create an object URL.
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/media/${mediaId}`, {
          responseType: 'blob'
        });
        
        const url = URL.createObjectURL(response.data);
        setMediaUrl(url);
      } catch (err: any) {
        console.error('Failed to load media:', err);
        setError('Failed to load media. It may have been deleted or expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();

    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-neutral-800/50 rounded-full hover:bg-neutral-800 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center">
        {loading && (
          <div className="text-white/70 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>Loading secure media...</p>
          </div>
        )}
        
        {error && (
          <div className="text-red-400 bg-red-400/10 p-4 rounded-lg">
            {error}
          </div>
        )}

        {mediaUrl && !loading && type === 'IMAGE' && (
          <img 
            src={mediaUrl} 
            alt="Secure Media" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        )}

        {mediaUrl && !loading && type === 'VIDEO' && (
          <video 
            src={mediaUrl} 
            controls 
            autoPlay
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        )}
      </div>
    </div>
  );
}
