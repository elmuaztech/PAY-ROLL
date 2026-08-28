import React, { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { usePayroll } from '../context/PayrollContext';
import { formatNaira } from '../utils/formatters';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Building2,
  RefreshCw
} from 'lucide-react';

export const Employees: React.FC = () => {
  const {
    employees,
    departments,
    isLoadingEmployees,
    apiError,
    refreshAllData,
    setActivePage,
    setSelectedEmployeeId,
    deleteEmployee
  } = usePayroll();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filtering logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      `${emp.firstName} ${emp.lastName} ${emp.employeeId} ${emp.email}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept ? emp.department === selectedDept : true;
    const matchesStatus = selectedStatus ? emp.status === selectedStatus : true;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteEmployee(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoadingEmployees) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Employee Directory"
          subtitle="Loading persistent staff records from database..."
          breadcrumb="Employee Management"
        />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        subtitle="Manage academic, administrative, and technical staff records"
        breadcrumb="Employee Management"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={refreshAllData}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs"
              title="Refresh Directory Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActivePage('add_employee')}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Add New Employee
            </button>
          </div>
        }
      />

      {apiError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center justify-between">
          <span>{apiError}</span>
          <button onClick={refreshAllData} className="underline text-amber-800">
            Retry Connection
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Employees Table or Empty State */}
      <DataTable
        headers={[
          'Employee ID',
          'Full Name',
          'Department & Cadre',
          'Basic Salary',
          'Status',
          'Actions'
        ]}
        empty={filteredEmployees.length === 0}
        emptyNode={
          <EmptyState
            title={employees.length === 0 ? 'No Employees Registered' : 'No Matching Staff Found'}
            description={
              employees.length === 0
                ? 'Your employee database starts from zero. Register your first staff member to begin.'
                : 'Try adjusting your search query or department filter.'
            }
            icon={Users}
            actionLabel={employees.length === 0 ? 'Add First Employee' : undefined}
            onAction={employees.length === 0 ? () => setActivePage('add_employee') : undefined}
          />
        }
      >
        {filteredEmployees.map(emp => (
          <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
            <td className="px-6 py-4 font-mono font-bold text-xs text-brand-700">
              {emp.employeeId}
            </td>

            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {emp.firstName[0]}
                  {emp.lastName[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {emp.firstName} {emp.lastName} {emp.otherName && `(${emp.otherName})`}
                  </p>
                  <p className="text-xs text-slate-500">{emp.email}</p>
                </div>
              </div>
            </td>

            <td className="px-6 py-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {emp.department}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{emp.position}</p>
            </td>

            <td className="px-6 py-4 font-extrabold text-slate-900">
              {formatNaira(emp.basicSalary)}
              <span className="text-[10px] text-slate-400 block font-normal">/ month</span>
            </td>

            <td className="px-6 py-4">
              <StatusBadge status={emp.status} />
            </td>

            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedEmployeeId(emp.id);
                    setActivePage('employee_details');
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedEmployeeId(emp.id);
                    setActivePage('edit_employee');
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100"
                  title="Edit Record"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(emp.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  title="Deactivate Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Deactivate Employee Record"
        message="Are you sure you want to deactivate this employee record? Historical records will be preserved."
        confirmLabel="Deactivate Employee"
      />
    </div>
  );
};
