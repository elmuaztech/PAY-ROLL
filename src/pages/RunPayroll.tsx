import React, { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatutoryWarningBanner } from '../components/common/StatutoryWarningBanner';
import { usePayroll } from '../context/PayrollContext';
import { formatNaira } from '../utils/formatters';
import { generatePayrollPreviewApi, persistPayrollRunsApi } from '../services/api';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Users,
  RefreshCw,
  Save,
  ArrowRight
} from 'lucide-react';

export const RunPayroll: React.FC = () => {
  const { payrollPeriods, employees, setActivePage, setSelectedPayrollId } = usePayroll();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(payrollPeriods[0]?.id || '');
  const [selectedEmpId, setSelectedEmpId] = useState<string>(''); // All or specific employee

  const [previewResults, setPreviewResults] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGeneratePreview = async () => {
    if (!selectedPeriodId) {
      setApiError('Please select a payroll period.');
      return;
    }

    setIsLoadingPreview(true);
    setApiError(null);
    setSuccessMsg(null);
    try {
      const result = await generatePayrollPreviewApi(selectedPeriodId, selectedEmpId || undefined);
      const arrayRes = Array.isArray(result) ? result : [result];
      setPreviewResults(arrayRes);
    } catch (err: any) {
      setApiError(err?.message || 'Failed to generate payroll preview.');
      setPreviewResults([]);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handlePersistRun = async () => {
    if (!selectedPeriodId) return;
    if (!window.confirm('Confirm and save this payroll calculation run to records?')) return;

    setIsPersisting(true);
    setApiError(null);
    try {
      await persistPayrollRunsApi(selectedPeriodId, selectedEmpId || undefined, false);
      setSuccessMsg('Payroll run calculated and saved successfully!');
      setTimeout(() => {
        setSelectedPayrollId(selectedPeriodId);
        setActivePage('payroll_history');
      }, 1500);
    } catch (err: any) {
      setApiError(err?.message || 'Failed to save payroll run.');
    } finally {
      setIsPersisting(false);
    }
  };

  // Calculate batch summary totals
  const batchBasic = previewResults.reduce((acc, curr) => acc + (curr.basicSalary || 0), 0);
  const batchAllowances = previewResults.reduce((acc, curr) => acc + (curr.totalAllowances || 0), 0);
  const batchGross = previewResults.reduce((acc, curr) => acc + (curr.grossPay || 0), 0);
  const batchDeductions = previewResults.reduce((acc, curr) => acc + (curr.totalDeductions || 0), 0);
  const batchNet = previewResults.reduce((acc, curr) => acc + (curr.netPay || 0), 0);

  // Gather warnings across preview items
  const allWarnings: any[] = [];
  previewResults.forEach(r => {
    if (r.warnings && r.warnings.length > 0) {
      r.warnings.forEach((w: any) => allWarnings.push({ empName: `${r.employee.firstName} ${r.employee.lastName}`, ...w }));
    }
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Payroll Processing Engine"
        subtitle="Generate payroll previews and finalize verified calculation runs"
        breadcrumb="Payroll Management / Process Payroll"
      />

      <StatutoryWarningBanner />

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          {apiError}
        </div>
      )}

      {/* Control Configuration Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Play className="w-4 h-4 text-brand-600 fill-brand-600" /> Configure Calculation Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Payroll Period *</label>
            <select
              value={selectedPeriodId}
              onChange={e => setSelectedPeriodId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white font-semibold text-slate-800"
            >
              {payrollPeriods.length === 0 ? (
                <option value="">No Periods Created Yet</option>
              ) : (
                payrollPeriods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name || `${p.month || ''} ${p.year || ''}`} ({p.status})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee Selection *</label>
            <select
              value={selectedEmpId}
              onChange={e => setSelectedEmpId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white font-semibold text-slate-800"
            >
              <option value="">All Active Employees ({employees.filter(e => e.status === 'Active').length})</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <button
            onClick={handleGeneratePreview}
            disabled={isLoadingPreview || !selectedPeriodId}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoadingPreview ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Calculating Preview...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Run Calculation Preview
              </>
            )}
          </button>
        </div>
      </div>

      {/* Warnings & Notices */}
      {allWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
          <h4 className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-700" /> Calculation Warnings & Notices ({allWarnings.length})
          </h4>
          <ul className="text-xs text-amber-800 space-y-1 pl-5 list-disc">
            {allWarnings.map((w, idx) => (
              <li key={idx}>
                <span className="font-bold">{w.empName}:</span> {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Output & Summary */}
      {previewResults.length > 0 && (
        <div className="space-y-6 animate-in fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Total Staff</span>
              <p className="font-black text-xl text-slate-900 mt-1">{previewResults.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Basic Salary</span>
              <p className="font-black text-sm text-slate-800 mt-1">{formatNaira(batchBasic)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Total Allowances</span>
              <p className="font-black text-sm text-emerald-700 mt-1">+{formatNaira(batchAllowances)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Total Deductions</span>
              <p className="font-black text-sm text-rose-700 mt-1">-{formatNaira(batchDeductions)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-brand-200 bg-brand-50/50 shadow-xs col-span-2 md:col-span-1">
              <span className="text-[11px] font-bold text-brand-900 block uppercase">Net Payroll Payable</span>
              <p className="font-black text-lg text-brand-700 mt-1">{formatNaira(batchNet)}</p>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Calculation Results Preview (Preview Only)
              </h4>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full">
                PREVIEW - NOT FINAL
              </span>
            </div>

            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/50 border-b border-slate-200 font-bold uppercase text-[11px] text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Basic Salary</th>
                  <th className="px-6 py-3.5">Allowances</th>
                  <th className="px-6 py-3.5">Gross Earnings</th>
                  <th className="px-6 py-3.5">Deductions</th>
                  <th className="px-6 py-3.5">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewResults.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 font-medium">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{r.employee.firstName} {r.employee.lastName}</p>
                      <p className="text-[11px] text-slate-500">{r.employee.department} • {r.employee.position}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{formatNaira(r.basicSalary)}</td>
                    <td className="px-6 py-4 text-emerald-700 font-semibold">+{formatNaira(r.totalAllowances)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{formatNaira(r.grossPay)}</td>
                    <td className="px-6 py-4 text-rose-700 font-semibold">-{formatNaira(r.totalDeductions)}</td>
                    <td className="px-6 py-4 font-extrabold text-brand-700 text-sm">{formatNaira(r.netPay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Commit Button */}
          <div className="flex justify-end gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setPreviewResults([])}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200"
            >
              Clear Preview
            </button>
            <button
              onClick={handlePersistRun}
              disabled={isPersisting}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isPersisting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving Run...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Finalize & Save Payroll Run <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
