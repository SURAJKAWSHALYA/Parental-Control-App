import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User, Smartphone, Activity, ShieldAlert, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface SearchResult {
  type: 'child' | 'device' | 'activity' | 'safety' | 'message';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        if (res.data.success) {
          setResults(res.data.data);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'child': return <User className="w-5 h-5 text-blue-400" />;
      case 'device': return <Smartphone className="w-5 h-5 text-indigo-400" />;
      case 'activity': return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'safety': return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-purple-400" />;
      default: return <Search className="w-5 h-5 text-neutral-400" />;
    }
  };

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(url);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-neutral-500" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-neutral-700 rounded-xl leading-5 bg-neutral-900 text-neutral-300 placeholder-neutral-500 focus:outline-none focus:bg-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors sm:text-sm"
          placeholder="Search family..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Loader2 className="h-4 w-4 text-neutral-500 animate-spin" />
          </div>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full lg:w-96 right-0 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl shadow-black/50 max-h-96 overflow-y-auto">
          {results.length === 0 && !isLoading ? (
            <div className="p-4 text-center text-sm text-neutral-500">
              No results found for "{query}"
            </div>
          ) : (
            <ul className="py-2">
              {results.map((item, idx) => (
                <li key={`${item.id}-${idx}`}>
                  <button
                    onClick={() => handleSelect(item.url)}
                    className="w-full text-left px-4 py-3 hover:bg-neutral-800 flex items-start gap-3 transition-colors"
                  >
                    <div className="mt-1 bg-neutral-800 p-2 rounded-lg">
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white line-clamp-1">{item.title}</p>
                      <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{item.subtitle}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
