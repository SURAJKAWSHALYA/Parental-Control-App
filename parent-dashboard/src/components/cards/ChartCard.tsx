import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { StateWrapper } from './StateWrapper';

interface ChartCardProps {
  title: string;
  data: any[];
  xKey: string;
  yKey: string;
  type: 'area' | 'bar';
  color?: string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  valueFormatter?: (val: number) => string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  data,
  xKey,
  yKey,
  type,
  color = '#3b82f6', // blue-500
  isLoading,
  isError,
  isEmpty,
  valueFormatter
}) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col h-full">
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
      <div className="flex-1 min-h-[250px]">
        <StateWrapper 
          isLoading={isLoading} 
          isError={isError} 
          isEmpty={isEmpty || data.length === 0}
          emptyMessage="No data to display"
          emptySubmessage={`There's no trend data available for ${title.toLowerCase()} in the selected time range.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            {type === 'area' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`color-${yKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey={xKey} stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} tickFormatter={valueFormatter} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={valueFormatter ? (value: number) => [valueFormatter(value), ''] : undefined}
                />
                <Area type="monotone" dataKey={yKey} stroke={color} fillOpacity={1} fill={`url(#color-${yKey})`} />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey={xKey} stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} tickFormatter={valueFormatter} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: '#262626' }}
                  formatter={valueFormatter ? (value: number) => [valueFormatter(value), ''] : undefined}
                />
                <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </StateWrapper>
      </div>
    </div>
  );
};
