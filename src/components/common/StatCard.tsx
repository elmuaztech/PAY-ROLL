import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: string;
  variant?: 'emerald' | 'navy' | 'amber' | 'sky';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  subtext,
  trend,
  variant = 'emerald'
}) => {
  const iconVariants = {
    emerald: 'bg-emerald-100 text-emerald-700',
    navy: 'bg-slate-100 text-slate-800',
    amber: 'bg-amber-100 text-amber-700',
    sky: 'bg-sky-100 text-sky-700'
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconVariants[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {trend && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {trend}
            </span>
          )}
          {subtext && <p className="text-xs text-slate-500 font-medium">{subtext}</p>}
        </div>
      </div>
    </div>
  );
};
