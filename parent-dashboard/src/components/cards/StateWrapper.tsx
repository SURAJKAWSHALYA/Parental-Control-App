import React from 'react';
import { Loader2, AlertCircle, FileBox } from 'lucide-react';

interface StateWrapperProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  emptySubmessage?: string;
  children: React.ReactNode;
}

export const StateWrapper: React.FC<StateWrapperProps> = ({
  isLoading,
  isError,
  isEmpty,
  errorMessage = 'Something went wrong while fetching data.',
  emptyMessage = 'No data available',
  emptySubmessage = 'There is no data to display for the selected criteria.',
  children
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 w-full h-full min-h-[150px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-neutral-400 font-medium">Loading data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 w-full h-full min-h-[150px] bg-red-500/5 rounded-xl border border-red-500/20">
        <AlertCircle className="w-8 h-8 text-red-400 mb-4" />
        <p className="text-red-300 font-medium">{errorMessage}</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 w-full h-full min-h-[150px]">
        <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          <FileBox className="w-8 h-8 text-neutral-500" />
        </div>
        <p className="text-neutral-300 font-medium">{emptyMessage}</p>
        <p className="text-neutral-500 text-sm mt-1 max-w-sm text-center">{emptySubmessage}</p>
      </div>
    );
  }

  return <>{children}</>;
};
