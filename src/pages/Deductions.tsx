import React, { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { StatutoryWarningBanner } from '../components/common/StatutoryWarningBanner';
import { usePayroll } from '../context/PayrollContext';
import { formatNaira } from '../utils/formatters';
import { Plus, MinusCircle, Search, X } from 'lucide-react';
import { DeductionCategory } from '../types';

export const Deductions: React.FC = () => {
  const { deductions, addDeduction } = usePayroll();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<DeductionCategory>('ORGANIZATION');
  const [amountType, setAmountType] = useState<'Fixed' | 'Percentage'>('Fixed');
  const [value, setValue] = useState(5000);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredDeductions = deductions.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Deduction name is required.');
      return;
    }
    if (value <= 0) {
      setError('Deduction value must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await addDeduction({
        name: name.trim(),
        category,
        amountType,
        value,
        description: description.trim(),
        notes: notes.trim() || 'Configuration rule subject to organizational verification.',
        status: category === 'STATUTORY' ? 'Pending Verification' : 'Active'
      });
      setIsModalOpen(false);
      setName('');
      setValue(5000);
      setDescription('');
      setNotes('');
    } catch (err: any) {
      setError(err?.message || 'Failed to create deduction rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deductions Management"
        subtitle="Configure voluntary, organizational, and statutory payroll deductions"
        breadcrumb="Payroll / Deductions"
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Deduction Rule
          </button>
        }
      />

      <StatutoryWarningBanner />

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search deductions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <DataTable
        headers={['Deduction Name', 'Category', 'Calculation Method', 'Value / Rate', 'Status']}
        empty={filteredDeductions.length === 0}
        emptyNode={
          <EmptyState
            title={deductions.length === 0 ? 'No Deductions Defined' : 'No Matching Deductions'}
            description={
              deductions.length === 0
                ? 'Your deductions database starts from zero. Click "Add Deduction Rule" to define one.'
                : 'Try adjusting your search query.'
            }
            icon={MinusCircle}
            actionLabel={deductions.length === 0 ? 'Add First Deduction' : undefined}
            onAction={deductions.length === 0 ? () => setIsModalOpen(true) : undefined}
          />
        }
      >
        {filteredDeductions.map(item => (
          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-bold text-slate-900">
              {item.name}
              {item.notes && <span className="block text-[11px] text-slate-400 font-normal">{item.notes}</span>}
            </td>
            <td className="px-6 py-4">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                {item.category}
              </span>
            </td>
            <td className="px-6 py-4 font-medium text-slate-700">{item.amountType}</td>
            <td className="px-6 py-4 font-extrabold text-slate-900">
              {item.amountType === 'Fixed' ? formatNaira(item.value) : `${item.value}% of Basic`}
            </td>
            <td className="px-6 py-4">
              <StatusBadge status={item.status} />
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add New Deduction Rule</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deduction Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Staff Welfare, Salary Advance"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-semibold"
                >
                  <option value="ORGANIZATION">ORGANIZATION (Welfare, Union Dues)</option>
                  <option value="LOAN">LOAN (Staff Salary Advances)</option>
                  <option value="STATUTORY">STATUTORY (Tax/Pension Configuration Placeholder)</option>
                  <option value="OTHER">OTHER (Miscellaneous)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Calculation Type *</label>
                  <select
                    value={amountType}
                    onChange={e => setAmountType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Fixed">Fixed Amount (₦)</option>
                    <option value="Percentage">Percentage of Basic (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Value ({amountType === 'Fixed' ? '₦' : '%'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={e => setValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of deduction purpose..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
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
                  {isSubmitting ? 'Saving...' : 'Save Deduction Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
