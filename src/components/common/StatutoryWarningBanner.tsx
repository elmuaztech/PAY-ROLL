import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const StatutoryWarningBanner: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
      <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="text-xs text-amber-900 leading-relaxed">
        <p className="font-extrabold text-sm mb-0.5">Statutory Calculation Disclaimer</p>
        <p>
          Statutory rates (PAYE Tax, Pension, NHF) are configuration placeholders. Official Nigerian statutory formulas must be verified against current Federal Inland Revenue Service (FIRS) and National Pension Commission (PenCom) regulations prior to legal payroll approval.
        </p>
      </div>
    </div>
  );
};
