import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({ rows = 3, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-10 bg-slate-200/70 rounded-lg w-full" />
      ))}
    </div>
  );
};
