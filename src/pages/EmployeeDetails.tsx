import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { usePayroll } from '../context/PayrollContext';
import { formatNaira } from '../utils/formatters';
import {
  User,
  Building2,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Plus,
  Trash2,
  Gift,
  MinusCircle,
  X
} from 'lucide-react';
import { Employee } from '../types';

export const EmployeeDetails: React.FC = () => {
  const {
    selectedEmployeeId,
    employees,
    allowances,
    deductions,
    setActivePage,
    setSelectedEmployeeId
  } = usePayroll();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [empAllowances, setEmpAllowances] = useState<any[]>([]);
  const [empDeductions, setEmpDeductions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [assignModalType, setAssignModalType] = useState<'allowance' | 'deduction' | null>(null);
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [overrideVal, setOverrideVal] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedEmployeeId) {
      const found = employees.find(e => e.id === selectedEmployeeId);
      setEmployee(found || null);
      fetchAssignments(selectedEmployeeId);
    } else {
      setIsLoading(false);
    }
  }, [selectedEmployeeId, employees]);

  const fetchAssignments = async (empId: string) => {
    setIsLoading(true);
    try {
      const [allowRes, dedRes] = await Promise.all([
        fetch(`/api/employee-allowances?employeeId=${encodeURIComponent(empId)}`),
        fetch(`/api/employee-deductions?employeeId=${encodeURIComponent(empId)}`)
      ]);
      const allowData = await allowRes.json();
      const dedData = await dedRes.json();
      setEmpAllowances(allowData.data || []);
      setEmpDeductions(dedData.data || []);
    } catch (err) {
      console.warn('Failed to fetch assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRuleId || !employee) {
      setModalError('Please select a rule to assign.');
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      const endpoint = assignModalType === 'allowance' ? '/api/employee-allowances' : '/api/employee-deductions';
      const bodyPayload = assignModalType === 'allowance'
        ? { employeeId: employee.id, allowanceId: selectedRuleId, overrideValue: overrideVal || undefined }
        : { employeeId: employee.id, deductionId: selectedRuleId, overrideValue: overrideVal || undefined };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error?.message || 'Failed to assign rule');

      setAssignModalType(null);
      setSelectedRuleId('');
      setOverrideVal('');
      fetchAssignments(employee.id);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to assign rule');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeactivateAssignment = async (id: string, type: 'allowance' | 'deduction') => {
    if (!window.confirm(`Deactivate this ${type} assignment?`)) return;
    try {
      const endpoint = type === 'allowance' ? '/api/employee-allowances' : '/api/employee-deductions';
      await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (employee) fetchAssignments(employee.id);
    } catch (err: any) {
      alert(err?.message || 'Failed to deactivate assignment');
    }
  };

  if (!employee) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title="Employee Profile"
          subtitle="Staff detailed record not found"
          breadcrumb="Employee Directory / Details"
        />
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
          <p className="text-sm font-semibold text-slate-600">No employee selected or employee record missing.</p>
          <button
            onClick={() => setActivePage('employees')}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
          >
            Back to Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        subtitle={`Employee ID: ${employee.employeeId}`}
        breadcrumb="Employee Directory / Profile"
        actions={
          <button
            onClick={() => {
              setSelectedEmployeeId(employee.id);
              setActivePage('edit_employee');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Edit Profile
          </button>
        }
      />

      {/* Profile Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div className="flex items-center gap-4 md:col-span-2">
          <div className="w-16 h-16 rounded-full bg-slate-900 text-white text-xl font-bold flex items-center justify-center shadow-md">
            {employee.firstName[0]}
            {employee.lastName[0]}
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">
              {employee.firstName} {employee.lastName} {employee.otherName && `(${employee.otherName})`}
            </h3>
            <p className="text-xs text-slate-500 font-semibold">{employee.email}</p>
            <div className="mt-2">
              <StatusBadge status={employee.status} />
            </div>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Department & Position</span>
          <p className="font-bold text-slate-800 text-sm">{employee.department}</p>
          <p className="text-xs text-slate-600 font-medium">{employee.position}</p>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Monthly Basic Salary</span>
          <p className="font-extrabold text-lg text-brand-700">{formatNaira(employee.basicSalary)}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal & Official Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-600" /> Personal & Official Details
          </h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold">Phone Number</span>
              <p className="font-bold text-slate-800 mt-0.5">{employee.phoneNumber}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Employment Type</span>
              <p className="font-bold text-slate-800 mt-0.5">{employee.employmentType}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Employment Date</span>
              <p className="font-bold text-slate-800 mt-0.5">{employee.dateOfEmployment}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Bank Name</span>
              <p className="font-bold text-slate-800 mt-0.5">{employee.bankName}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">NUBAN Account Number</span>
              <p className="font-bold text-slate-800 font-mono mt-0.5">{employee.accountNumber}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Account Name</span>
              <p className="font-bold text-slate-800 mt-0.5">{employee.accountName}</p>
            </div>
          </div>
        </div>

        {/* Assigned Allowances */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-600" /> Assigned Allowances ({empAllowances.length})
            </h4>
            <button
              onClick={() => {
                setAssignModalType('allowance');
                setSelectedRuleId(allowances[0]?.id || '');
                setOverrideVal('');
                setModalError(null);
              }}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Assign
            </button>
          </div>

          <div className="space-y-2">
            {empAllowances.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No specific allowances assigned yet.</p>
            ) : (
              empAllowances.map(a => {
                const rule = allowances.find(item => item.id === a.allowanceId);
                return (
                  <div key={a.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{rule ? rule.name : 'Allowance Rule'}</p>
                      <p className="text-slate-500">
                        {a.overrideValue ? `Override: ₦${a.overrideValue}` : rule ? `${rule.amountType === 'Fixed' ? `₦${rule.value}` : `${rule.value}%`}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeactivateAssignment(a.id, 'allowance')}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Deactivate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Assigned Deductions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 md:col-span-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MinusCircle className="w-4 h-4 text-rose-600" /> Assigned Deductions ({empDeductions.length})
            </h4>
            <button
              onClick={() => {
                setAssignModalType('deduction');
                setSelectedRuleId(deductions[0]?.id || '');
                setOverrideVal('');
                setModalError(null);
              }}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Assign
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {empDeductions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No specific deductions assigned yet.</p>
            ) : (
              empDeductions.map(d => {
                const rule = deductions.find(item => item.id === d.deductionId);
                return (
                  <div key={d.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{rule ? rule.name : 'Deduction Rule'}</p>
                      <p className="text-slate-500">
                        {d.overrideValue ? `Override: ₦${d.overrideValue}` : rule ? `${rule.amountType === 'Fixed' ? `₦${rule.value}` : `${rule.value}%`}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeactivateAssignment(d.id, 'deduction')}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Deactivate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ASSIGN MODAL */}
      {assignModalType && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 capitalize">
                Assign {assignModalType} to Employee
              </h3>
              <button onClick={() => setAssignModalType(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Rule *</label>
                <select
                  value={selectedRuleId}
                  onChange={e => setSelectedRuleId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-semibold"
                  required
                >
                  {assignModalType === 'allowance'
                    ? allowances.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.amountType === 'Fixed' ? `₦${a.value}` : `${a.value}%`})
                        </option>
                      ))
                    : deductions.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.amountType === 'Fixed' ? `₦${d.value}` : `${d.value}%`})
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Custom Value Override (₦)
                </label>
                <input
                  type="number"
                  placeholder="Leave empty to use default rule value"
                  value={overrideVal}
                  onChange={e => setOverrideVal(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAssignModalType(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs"
                >
                  {modalLoading ? 'Assigning...' : 'Assign Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
