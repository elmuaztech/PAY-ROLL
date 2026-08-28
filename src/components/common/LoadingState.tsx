import React from 'react';

export const LoadingState: React.FC = () => {
  return (
    <div className="p-8 space-y-4 animate-pulse">
      <div className="h-8 bg-slate-200 rounded-lg w-1/4" />
      <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-200 rounded-2xl pt-4" />
    </div>
  );
};
