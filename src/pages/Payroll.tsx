import React, { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { StatutoryWarningBanner } from '../components/common/StatutoryWarningBanner';
import { usePayroll } from '../context/PayrollContext';
import {
  Calendar,
  Play,
  Plus,
  Eye,
  Search,
  X
} from 'lucide-react';

export const Payroll: React.FC = () => {
  const {
    payrollPeriods,
    addPayrollPeriod,
    setActivePage,
    setSelectedPayrollId
  } = usePayroll();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [periodName, setPeriodName] = useState('August 2026');
  const [periodStart, setPeriodStart] = useState('2026-08-01');
  const [periodEnd, setPeriodEnd] = useState('2026-08-28');
  const [payDate, setPayDate] = useState('2026-08-28');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPeriods = payrollPeriods.filter(p =>
    (p.name || `${p.month || ''} ${p.year || ''}`).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodName.trim()) {
      setError('Payroll period name is required.');
      return;
    }
    if (new Date(periodStart) >= new Date(periodEnd)) {
      setError('Start date must precede end date.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await addPayrollPeriod({
        name: periodName.trim(),
        periodStart,
        periodEnd,
        payDate
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create payroll period');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Cycle & Batch Processing"
        subtitle="Manage monthly payroll cycles, batch runs, and preview calculations"
        breadcrumb="Payroll Management"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Period
            </button>
            <button
              onClick={() => setActivePage('run_payroll')}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              New Payroll Run
            </button>
          </div>
        }
      />

      <StatutoryWarningBanner />

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search payroll cycles..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <DataTable
        headers={['Payroll Period', 'Date Range', 'Scheduled Pay Date', 'Status', 'Actions']}
        empty={filteredPeriods.length === 0}
        emptyNode={
          <EmptyState
            title={payrollPeriods.length === 0 ? 'No Payroll Cycles' : 'No Matching Cycles'}
            description={
              payrollPeriods.length === 0
                ? 'Your payroll database starts from zero. Create a period or initialize a batch run.'
                : 'Try adjusting your search query.'
            }
            icon={Calendar}
            actionLabel="Create First Period"
            onAction={() => setIsModalOpen(true)}
          />
        }
      >
        {filteredPeriods.map(period => (
          <tr key={period.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-bold text-slate-900">
              {period.name || `${period.month || ''} ${period.year || ''}`}
            </td>
            <td className="px-6 py-4 text-xs font-semibold text-slate-600">
              {period.startDate || period.periodStart} &rarr; {period.endDate || period.periodEnd}
            </td>
            <td className="px-6 py-4 text-xs font-medium text-slate-600">
              {period.processedDate || period.payDate || 'Scheduled End of Month'}
            </td>
            <td className="px-6 py-4">
              <StatusBadge status={period.status} />
            </td>
            <td className="px-6 py-4">
              <button
                onClick={() => {
                  setSelectedPayrollId(period.id);
                  setActivePage('payroll_details');
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 flex items-center gap-1 text-xs font-bold"
              >
                <Eye className="w-4 h-4" /> View Runs
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Create Period Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Create Payroll Period</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800">
                {error}
              </div>
            )}

            <form onSubmit={handleCreatePeriod} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Period Title *</label>
                <input
                  type="text"
                  placeholder="e.g. August 2026"
                  value={periodName}
                  onChange={e => setPeriodName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={e => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={e => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pay Date *</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Create Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
