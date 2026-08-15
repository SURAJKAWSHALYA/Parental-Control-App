import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon: LucideIcon;
  colorClass: string;
  link?: string;
  isLoading?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  colorClass, 
  link,
  isLoading
}) => {
  const content = (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-6 transition-colors group ${link ? 'hover:border-neutral-700 cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white">
            {isLoading ? <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" /> : value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
};
