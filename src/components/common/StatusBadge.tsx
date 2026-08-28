import React from 'react';

type StatusType =
  | 'Active'
  | 'Inactive'
  | 'Suspended'
  | 'On Leave'
  | 'Draft'
  | 'Processing'
  | 'Approved'
  | 'Finalized'
  | 'Pending'
  | 'Paid';

interface StatusBadgeProps {
  status: StatusType | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyles = (s: string) => {
    switch (s.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'finalized':
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'inactive':
      case 'suspended':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'draft':
      case 'pending':
      case 'processing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'on leave':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStyles(
        status
      )}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status.toLowerCase() === 'active' || status.toLowerCase() === 'paid'
            ? 'bg-emerald-500'
            : status.toLowerCase() === 'draft' || status.toLowerCase() === 'pending'
            ? 'bg-amber-500'
            : 'bg-slate-400'
        }`}
      />
      {status}
    </span>
  );
};
