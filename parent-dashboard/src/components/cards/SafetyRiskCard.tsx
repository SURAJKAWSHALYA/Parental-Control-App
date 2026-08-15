import { ShieldAlert, Activity, AlertTriangle, ShieldCheck, Shield } from 'lucide-react';
import { StateWrapper } from './StateWrapper';

interface SafetyRiskCardProps {
  score: number;
  level: string;
  factors: string[];
  isLoading?: boolean;
}

export const SafetyRiskCard = ({ score, level, factors, isLoading }: SafetyRiskCardProps) => {
  const getLevelColor = (l: string) => {
    switch (l.toLowerCase()) {
      case 'low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'moderate': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'elevated': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'critical': return 'text-red-600 bg-red-600/10 border-red-600/20';
      default: return 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20';
    }
  };

  const getLevelIcon = (l: string) => {
    switch (l.toLowerCase()) {
      case 'low': return <ShieldCheck className="w-8 h-8 text-emerald-500" />;
      case 'critical':
      case 'high': return <ShieldAlert className="w-8 h-8 text-red-500" />;
      default: return <Shield className="w-8 h-8 text-yellow-500" />;
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          AI-Assisted Safety Risk
        </h3>
      </div>

      <StateWrapper isLoading={isLoading} isEmpty={false}>
        <div className="flex flex-col items-center justify-center py-4 mb-6">
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-neutral-800"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={getLevelColor(level).split(' ')[0]}
                strokeWidth="3"
                strokeDasharray={`${score}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              {getLevelIcon(level)}
              <span className="text-2xl font-bold text-white mt-1">{score}</span>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider ${getLevelColor(level)}`}>
            {level} Risk
          </div>
          <p className="text-xs text-neutral-500 mt-3 text-center px-4">
            * This score is a probabilistic AI-assisted indicator and not a definitive diagnosis.
          </p>
        </div>

        <div className="flex-1 bg-neutral-950/50 rounded-xl p-4 border border-neutral-800/50">
          <h4 className="text-sm font-semibold text-white mb-3">Main Contributing Signals:</h4>
          {factors.length > 0 ? (
            <ul className="space-y-2">
              {factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-neutral-300">
                  <AlertTriangle className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500 flex items-center justify-center py-2">
              No elevated risk signals detected.
            </p>
          )}
        </div>
      </StateWrapper>
    </div>
  );
};
