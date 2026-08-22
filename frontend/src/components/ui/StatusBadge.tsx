import React from 'react';

type BadgeType = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ADMIN' | 'HR' | 'EMPLOYEE';

interface StatusBadgeProps {
  status: BadgeType | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = (status || '').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (normalized === 'PRESENT' || normalized === 'APPROVED') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (normalized === 'ABSENT' || normalized === 'REJECTED') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (normalized === 'HALF_DAY' || normalized === 'PENDING') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (normalized === 'LEAVE') {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-500';
  } else if (normalized === 'ADMIN') {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
    dotColor = 'bg-indigo-600';
  } else if (normalized === 'HR') {
    styles = 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
    dotColor = 'bg-purple-600';
  } else if (normalized === 'EMPLOYEE') {
    styles = 'bg-slate-100 text-slate-700 border-slate-200';
    dotColor = 'bg-slate-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full border ${styles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};
