import React, { useState } from 'react';
import { PayrollProvider, usePayroll } from './context/PayrollContext';
import { DashboardLayout } from './layouts/DashboardLayout';

import { LoginForm } from './components/auth/LoginForm';
import { SetupAdminForm } from './components/auth/SetupAdminForm';

// Page Imports
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { AddEmployee } from './pages/AddEmployee';
import { EmployeeDetails } from './pages/EmployeeDetails';
import { EditEmployee } from './pages/EditEmployee';
import { Payroll } from './pages/Payroll';
import { RunPayroll } from './pages/RunPayroll';
import { PayrollDetails } from './pages/PayrollDetails';
import { Allowances } from './pages/Allowances';
import { Deductions } from './pages/Deductions';
import { PayrollHistory } from './pages/PayrollHistory';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activePage, currentUser, isAuthLoading } = usePayroll();
  const [isSetupMode, setIsSetupMode] = useState(false);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
        <p className="text-sm font-bold tracking-wide">Loading Payroll Security Portal...</p>
      </div>
    );
  }

  if (!currentUser) {
    if (isSetupMode) {
      return <SetupAdminForm onBackToLogin={() => setIsSetupMode(false)} />;
    }
    return <LoginForm onSwitchToSetup={() => setIsSetupMode(true)} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'employees':
        return <Employees />;
      case 'add_employee':
        return <AddEmployee />;
      case 'employee_details':
        return <EmployeeDetails />;
      case 'edit_employee':
        return <EditEmployee />;
      case 'payroll':
        return <Payroll />;
      case 'run_payroll':
        return <RunPayroll />;
      case 'payroll_details':
        return <PayrollDetails />;
      case 'allowances':
        return <Allowances />;
      case 'deductions':
        return <Deductions />;
      case 'history':
        return <PayrollHistory />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return <DashboardLayout>{renderPage()}</DashboardLayout>;
};

export function App() {
  return (
    <PayrollProvider>
      <AppContent />
    </PayrollProvider>
  );
}

export default App;
