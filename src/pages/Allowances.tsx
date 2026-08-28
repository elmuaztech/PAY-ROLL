import React, { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { usePayroll } from '../context/PayrollContext';
import { formatNaira } from '../utils/formatters';
import { Plus, Gift, Search, X } from 'lucide-react';

export const Allowances: React.FC = () => {
  const { allowances, addAllowance } = usePayroll();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [amountType, setAmountType] = useState<'Fixed' | 'Percentage'>('Fixed');
  const [value, setValue] = useState(25000);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredAllowances = allowances.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Allowance name is required.');
      return;
    }
    if (value <= 0) {
      setError('Allowance value must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await addAllowance({
        name: name.trim(),
        type: 'Recurring',
        amountType,
        value,
        description: description.trim(),
        isTaxable: true,
        status: 'Active'
      });
      setIsModalOpen(false);
      setName('');
      setValue(25000);
      setDescription('');
    } catch (err: any) {
      setError(err?.message || 'Failed to create allowance rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Allowances Management"
        subtitle="Configure restaurant salary allowances and benefits"
        breadcrumb="Payroll / Allowances"
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Allowance Rule
          </button>
        }
      />

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search allowances..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <DataTable
        headers={['Allowance Name', 'Calculation Method', 'Value / Rate', 'Description', 'Status']}
        empty={filteredAllowances.length === 0}
        emptyNode={
          <EmptyState
            title={allowances.length === 0 ? 'No Allowances Defined' : 'No Matching Allowances'}
            description={
              allowances.length === 0
                ? 'Your allowances database starts from zero. Click "Add Allowance Rule" to define one.'
                : 'Try adjusting your search query.'
            }
            icon={Gift}
            actionLabel={allowances.length === 0 ? 'Add First Allowance' : undefined}
            onAction={allowances.length === 0 ? () => setIsModalOpen(true) : undefined}
          />
        }
      >
        {filteredAllowances.map(item => (
          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
            <td className="px-6 py-4 font-medium text-slate-700">{item.amountType}</td>
            <td className="px-6 py-4 font-extrabold text-slate-900">
              {item.amountType === 'Fixed' ? formatNaira(item.value) : `${item.value}% of Basic`}
            </td>
            <td className="px-6 py-4 text-slate-500 text-xs">{item.description || 'N/A'}</td>
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
              <h3 className="font-bold text-base text-slate-900">Add New Allowance Rule</h3>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Allowance Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Shift Allowance, Housing Allowance"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  required
                />
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
                  rows={3}
                  placeholder="Brief description of allowance entitlement..."
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
                  {isSubmitting ? 'Saving...' : 'Save Allowance Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
