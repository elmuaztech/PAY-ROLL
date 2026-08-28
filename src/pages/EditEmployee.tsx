import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { EmployeeForm } from '../components/employee/EmployeeForm';
import { usePayroll } from '../context/PayrollContext';

export const EditEmployee: React.FC = () => {
  const {
    employees,
    selectedEmployeeId,
    updateEmployee,
    setActivePage
  } = usePayroll();

  const employee = employees.find(e => e.id === selectedEmployeeId);

  if (!employee) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Employee Record Not Selected</h3>
        <button
          onClick={() => setActivePage('employees')}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold"
        >
          Return to Employee Directory
        </button>
      </div>
    );
  }

  const handleSubmit = (data: any) => {
    updateEmployee(employee.id, data);
    setActivePage('employee_details');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title={`Edit Record: ${employee.firstName} ${employee.lastName}`}
        subtitle={`Update official profile information for ID ${employee.employeeId}`}
        breadcrumb="Employee Directory / Edit Record"
      />

      <EmployeeForm
        initialValues={employee}
        onSubmit={handleSubmit}
        onCancel={() => setActivePage('employee_details')}
      />
    </div>
  );
};
