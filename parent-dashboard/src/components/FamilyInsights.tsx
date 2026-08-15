import React, { useState, useEffect } from 'react';
import { StateWrapper } from './cards/StateWrapper';
import api from '../services/api';

export const FamilyInsights = () => {
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await api.get('/analytics/insights');
        if (res.data.success) {
          setInsights(res.data.data);
        } else {
          setIsError(true);
        }
      } catch (err) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, []);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-white mb-6">Family Insights</h3>
      <StateWrapper 
        isLoading={isLoading} 
        isError={isError} 
        isEmpty={insights.length === 0}
        emptyMessage="No family data"
        emptySubmessage="Add children to view family comparisons and insights."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-sm">
                <th className="pb-3 font-medium">Child</th>
                <th className="pb-3 font-medium">Screen Time</th>
                <th className="pb-3 font-medium">Apps Used</th>
                <th className="pb-3 font-medium">Websites Blocked</th>
                <th className="pb-3 font-medium">Safety Events</th>
                <th className="pb-3 font-medium">Messages</th>
              </tr>
            </thead>
            <tbody>
              {insights.map((child) => (
                <tr key={child.childId} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                  <td className="py-4 text-white font-medium">{child.name}</td>
                  <td className="py-4 text-neutral-300">{child.screenTime}</td>
                  <td className="py-4 text-neutral-300">{child.appsUsedCount}</td>
                  <td className="py-4 text-neutral-300">{child.websitesBlocked}</td>
                  <td className="py-4 text-neutral-300">{child.safetyEvents}</td>
                  <td className="py-4 text-neutral-300">{child.messages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StateWrapper>
    </div>
  );
};
