import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { usePayroll } from '../context/PayrollContext';
import { formatNaira } from '../utils/formatters';
import { fetchPayrollRunsApi } from '../services/api';
import { History, Eye, Calendar, RefreshCw, Filter } from 'lucide-react';

export const PayrollHistory: React.FC = () => {
  const { payrollPeriods, employees, setActivePage, setSelectedPayrollId } = usePayroll();

  const [runs, setRuns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  const loadRuns = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPayrollRunsApi(selectedPeriodFilter || undefined);
      setRuns(data);
    } catch (err) {
      console.warn('Failed to load payroll runs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, [selectedPeriodFilter]);

  const filteredRuns = runs.filter(r => {
    if (selectedStatusFilter && r.status !== selectedStatusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Run History Archive"
        subtitle="Immutable historical snapshots of past monthly payroll calculations and runs"
        breadcrumb="Payroll Management / History"
        actions={
          <button
            onClick={loadRuns}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs"
            title="Refresh History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Calendar className="w-5 h-5 text-slate-400" />
          <select
            value={selectedPeriodFilter}
            onChange={e => setSelectedPeriodFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
          >
            <option value="">All Payroll Cycles</option>
            {payrollPeriods.map(p => (
              <option key={p.id} value={p.id}>
                {p.name || `${p.month || ''} ${p.year || ''}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="PREVIEW">PREVIEW</option>
            <option value="CALCULATED">CALCULATED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PAID">PAID</option>
            <option value="VOID">VOID</option>
          </select>
        </div>
      </div>

      <DataTable
        headers={[
          'Run ID / Employee',
          'Period',
          'Gross Earnings',
          'Total Deductions',
          'Net Salary',
          'Status',
          'Actions'
        ]}
        empty={filteredRuns.length === 0}
        emptyNode={
          <EmptyState
            title={runs.length === 0 ? 'No Persistent Payroll Runs' : 'No Matching Runs'}
            description={
              runs.length === 0
                ? 'Your payroll history database starts from zero. Run a payroll calculation to generate persistent records.'
                : 'Try adjusting your period or status filter.'
            }
            icon={History}
            actionLabel="Run Payroll Engine"
            onAction={() => setActivePage('run_payroll')}
          />
        }
      >
        {filteredRuns.map(run => {
          const emp = employees.find(e => e.id === run.employeeId);
          const period = payrollPeriods.find(p => p.id === run.payrollPeriodId);
          return (
            <tr key={run.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-6 py-4">
                <p className="font-bold text-slate-900 text-sm">
                  {emp ? `${emp.firstName} ${emp.lastName}` : `Employee ID: ${run.employeeId}`}
                </p>
                <p className="text-[11px] font-mono text-brand-700">{run.id.slice(0, 8)}...</p>
              </td>

              <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                {period ? period.name || `${period.month} ${period.year}` : 'Cycle Period'}
              </td>

              <td className="px-6 py-4 font-bold text-slate-900 text-xs">
                {formatNaira(run.grossPay)}
              </td>

              <td className="px-6 py-4 font-semibold text-rose-700 text-xs">
                -{formatNaira(run.totalDeductions)}
              </td>

              <td className="px-6 py-4 font-extrabold text-brand-700 text-sm">
                {formatNaira(run.netPay)}
              </td>

              <td className="px-6 py-4">
                <StatusBadge status={run.status} />
              </td>

              <td className="px-6 py-4">
                <button
                  onClick={() => {
                    setSelectedPayrollId(run.id);
                    setActivePage('payroll_details');
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 flex items-center gap-1 text-xs font-bold"
                >
                  <Eye className="w-4 h-4" /> View Snapshot
                </button>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
};
