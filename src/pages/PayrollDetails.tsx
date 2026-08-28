import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { StatutoryWarningBanner } from '../components/common/StatutoryWarningBanner';
import { usePayroll } from '../context/PayrollContext';
import { formatNaira } from '../utils/formatters';
import { fetchPayrollRunByIdApi } from '../services/api';
import {
  FileText,
  User,
  Building2,
  Briefcase,
  Calendar,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowLeft
} from 'lucide-react';

export const PayrollDetails: React.FC = () => {
  const { selectedPayrollId, setActivePage } = usePayroll();

  const [runDetails, setRunDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPayrollId) {
      loadRunDetails(selectedPayrollId);
    } else {
      setIsLoading(false);
    }
  }, [selectedPayrollId]);

  const loadRunDetails = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPayrollRunByIdApi(id);
      setRunDetails(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load historical payroll record');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title="Payroll Payslip Detail"
          subtitle="Loading historical payslip record..."
          breadcrumb="Payroll / Historical Record"
        />
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center font-semibold text-slate-500">
          Loading payslip items...
        </div>
      </div>
    );
  }

  if (!runDetails) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title="Payroll Payslip Detail"
          subtitle="Historical record not found"
          breadcrumb="Payroll / Details"
        />
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
          <p className="text-sm text-slate-600 font-semibold">No persistent payroll run record selected.</p>
          <button
            onClick={() => setActivePage('payroll_history')}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
          >
            Back to Payroll History
          </button>
        </div>
      </div>
    );
  }

  const { employee, period, items = [] } = runDetails;

  const allowanceItems = items.filter((it: any) => it.itemType === 'ALLOWANCE' || it.itemType === 'BASIC');
  const deductionItems = items.filter((it: any) => it.itemType === 'DEDUCTION' || it.itemType === 'TAX');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Payroll Payslip - ${period ? period.name : 'Period'}`}
        subtitle={`Historical record created on ${new Date(runDetails.calculatedAt || runDetails.createdAt).toLocaleDateString()}`}
        breadcrumb="Payroll History / Payslip Detail"
        actions={
          <button
            onClick={() => setActivePage('payroll_history')}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to History
          </button>
        }
      />

      <StatutoryWarningBanner />

      {/* Payslip Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="flex items-center gap-4 md:col-span-2">
          <div className="w-14 h-14 rounded-full bg-slate-900 text-white text-lg font-bold flex items-center justify-center">
            {employee ? `${employee.firstName[0]}${employee.lastName[0]}` : 'EMP'}
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              {employee ? `${employee.firstName} ${employee.lastName}` : 'Staff Member'}
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              ID: {employee?.employeeId} • {employee?.departmentName || employee?.department}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusBadge status={runDetails.status} />
              {runDetails.isPreview && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                  PREVIEW
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Net Pay Payable</span>
          <p className="font-black text-2xl text-brand-700">{formatNaira(runDetails.netPay)}</p>
        </div>
      </div>

      {/* Items Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Earnings Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Gross Earnings</span>
            <span className="text-emerald-700 font-black text-base">{formatNaira(runDetails.grossPay)}</span>
          </h4>

          <div className="space-y-3 text-xs">
            {allowanceItems.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">{item.itemName}</p>
                  <p className="text-[10px] text-slate-500">{item.calculationMethodSnapshot || item.sourceType}</p>
                </div>
                <span className="font-extrabold text-slate-900">{formatNaira(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deductions Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Total Deductions</span>
            <span className="text-rose-700 font-black text-base">-{formatNaira(runDetails.totalDeductions)}</span>
          </h4>

          <div className="space-y-3 text-xs">
            {deductionItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No deductions applied to this record.</p>
            ) : (
              deductionItems.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-bold text-slate-800">{item.itemName}</p>
                    <p className="text-[10px] text-slate-500">{item.calculationMethodSnapshot || item.sourceType}</p>
                  </div>
                  <span className="font-extrabold text-rose-700">-{formatNaira(item.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-100 rounded-2xl text-[11px] text-slate-500 text-center font-medium">
        <Lock className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> This historical payslip is locked and preserved. Future updates to employee salary or global allowance rules will not modify this record.
      </div>
    </div>
  );
};
