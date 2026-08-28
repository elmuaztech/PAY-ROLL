import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { EmployeeForm } from '../components/employee/EmployeeForm';
import { usePayroll } from '../context/PayrollContext';

export const AddEmployee: React.FC = () => {
  const { addEmployee, setActivePage, setSelectedEmployeeId } = usePayroll();

  const handleSubmit = async (data: any) => {
    const newEmp = await addEmployee(data);
    if (newEmp && newEmp.id) {
      setSelectedEmployeeId(newEmp.id);
      setActivePage('employee_details');
    } else {
      setActivePage('employees');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Register New Employee"
        subtitle="Fill in employee personal, official designation, basic salary, and bank details"
        breadcrumb="Employee Management / New Record"
      />

      <EmployeeForm
        onSubmit={handleSubmit}
        onCancel={() => setActivePage('employees')}
      />
    </div>
  );
};
