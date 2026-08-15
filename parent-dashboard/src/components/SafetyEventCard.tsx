import { ShieldAlert, AlertTriangle, Info, Check, X, Shield, Clock } from 'lucide-react';
import api from '../services/api';

interface SafetyEventCardProps {
  event: any;
  onUpdate: (updatedEvent: any) => void;
}

export default function SafetyEventCard({ event, onUpdate }: SafetyEventCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'HIGH': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'LOW': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      default: return 'bg-neutral-500/20 text-neutral-400 border-neutral-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'HIGH': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'MEDIUM': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'LOW': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Shield className="w-5 h-5 text-neutral-400" />;
    }
  };

  const handleAction = async (decision: string, status: string) => {
    try {
      if (decision) {
        await api.post(`/safety/${event._id}/feedback`, { decision });
      } else {
        await api.put(`/safety/${event._id}`, { status });
      }
      
      const updated = { ...event, status };
      onUpdate(updated);
    } catch (err) {
      console.error('Failed to update event', err);
    }
  };

  const isResolved = event.status === 'RESOLVED' || event.status === 'DISMISSED';

  return (
    <div className={`p-5 rounded-xl border transition-all ${isResolved ? 'opacity-70 border-neutral-800 bg-neutral-900/50' : 'border-neutral-700 bg-neutral-900 shadow-md'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {getSeverityIcon(event.severity)}
          <div>
            <h3 className="text-white font-medium">{event.title}</h3>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
              <span className={`px-2 py-0.5 rounded border ${getSeverityColor(event.severity)}`}>
                {event.severity}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(event.timestamp).toLocaleString()}
              </span>
              <span>•</span>
              <span>Child: {event.childId?.name || 'Unknown'}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Confidence</div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${event.confidence > 80 ? 'bg-emerald-500' : event.confidence > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${event.confidence}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium text-neutral-300">{event.confidence}%</span>
          </div>
        </div>
      </div>

      <div className="bg-neutral-800/50 rounded-lg p-3 mb-4 border border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-400 uppercase">Category: {event.category}</span>
          <span className="text-xs text-neutral-500">Source: {event.source}</span>
        </div>
        <p className="text-sm text-neutral-300 italic">
          "{event.description}"
        </p>
      </div>

      {!isResolved && (
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-neutral-800">
          <button 
            onClick={() => handleAction('DISMISSED', 'DISMISSED')}
            className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Dismiss (Safe)
          </button>
          
          <button 
            onClick={() => handleAction('INCORRECT', 'DISMISSED')}
            className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Mark Incorrect
          </button>

          <button 
            onClick={() => handleAction('CONFIRMED', 'REVIEWED')}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Needs Review
          </button>

          <button 
            onClick={() => handleAction('RESOLVED', 'RESOLVED')}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
          >
            Resolve Issue
          </button>
        </div>
      )}
      
      {isResolved && (
        <div className="flex justify-between items-center mt-2 pt-3 border-t border-neutral-800 text-sm">
          <span className="text-neutral-500">Status: <span className="text-neutral-400 font-medium">{event.status}</span></span>
          <button 
            onClick={() => handleAction('', 'NEW')}
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Reopen
          </button>
        </div>
      )}
    </div>
  );
}
