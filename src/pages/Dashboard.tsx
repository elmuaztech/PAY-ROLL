import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { usePayroll } from '../context/PayrollContext';
import { formatNaira } from '../utils/formatters';
import { fetchPayrollRunsApi } from '../services/api';
import {
  Users,
  Banknote,
  Gift,
  MinusCircle,
  UserPlus,
  PlayCircle,
  FileText,
  UtensilsCrossed,
  Calendar
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    employees,
    allowances,
    deductions,
    payrollPeriods,
    setActivePage,
    setSelectedEmployeeId
  } = usePayroll();

  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    fetchPayrollRunsApi().then(data => setRuns(data)).catch(() => {});
  }, []);

  const totalEmployees = employees.length;
  const totalMonthlyPayroll = runs.reduce((acc, curr) => acc + (curr.netPay || 0), 0);

  const totalAllowancesValue = allowances.filter(a => a.status === 'Active' || a.status === 'ACTIVE').length;
  const totalDeductionsValue = deductions.filter(d => d.status === 'Active' || d.status === 'ACTIVE').length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-poly-navy via-slate-800 to-brand-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs mb-2">
              <UtensilsCrossed className="w-3.5 h-3.5 text-brand-500" />
              <span>Maiduguri Restaurant - Administrative Portal</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Computerized Payroll Management System</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Welcome to the administrative portal. Register employees, configure earnings and statutory deductions, and process monthly payrolls seamlessly.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActivePage('add_employee')}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Add Employee
            </button>
            <button
              onClick={() => setActivePage('run_payroll')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-semibold backdrop-blur-xs flex items-center gap-2 transition-all active:scale-95"
            >
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              Run Payroll
            </button>
          </div>
        </div>
      </div>

      <PageHeader
        title="Administrative Overview"
        subtitle="Live metrics and quick actions for managing restaurant staff payroll"
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          icon={Users}
          subtext="Active staff records"
          variant="navy"
        />
        <StatCard
          title="Total Monthly Payroll"
          value={formatNaira(totalMonthlyPayroll)}
          icon={Banknote}
          subtext="Computed net payout"
          variant="emerald"
        />
        <StatCard
          title="Configured Allowances"
          value={totalAllowancesValue}
          icon={Gift}
          subtext="Active earnings rules"
          variant="sky"
        />
        <StatCard
          title="Configured Deductions"
          value={totalDeductionsValue}
          icon={MinusCircle}
          subtext="Active statutory/voluntary"
          variant="amber"
        />
      </div>

      {/* Quick Action Cards Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Quick Operations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setActivePage('add_employee')}
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/40 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Register New Staff</p>
              <p className="text-xs text-slate-500">Add employee personal, job & bank details</p>
            </div>
          </button>

          <button
            onClick={() => setActivePage('run_payroll')}
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Run Monthly Payroll</p>
              <p className="text-xs text-slate-500">Process allowances, tax & net pay</p>
            </div>
          </button>

          <button
            onClick={() => setActivePage('reports')}
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">View Payroll Reports</p>
              <p className="text-xs text-slate-500">Generate Master Register & payslips</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Grid: Recent Activity & Recent Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Employees */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base">Recent Employees</h3>
            <button
              onClick={() => setActivePage('employees')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              View All
            </button>
          </div>

          {employees.length === 0 ? (
            <EmptyState
              title="No Staff Registered Yet"
              description="Your employee database is completely fresh. Add your first employee to get started."
              icon={Users}
              actionLabel="Add First Employee"
              onAction={() => setActivePage('add_employee')}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {employees.slice(0, 5).map(emp => (
                <div key={emp.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                      {emp.firstName[0]}
                      {emp.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {emp.department} • {emp.position}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEmployeeId(emp.id);
                      setActivePage('employee_details');
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-brand-600 px-3 py-1 rounded-lg border border-slate-200 hover:border-brand-300"
                  >
                    Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payroll Activity */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base">Recent Payroll Runs</h3>
            <button
              onClick={() => setActivePage('payroll')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Manage Payroll
            </button>
          </div>

          {runs.length === 0 ? (
            <EmptyState
              title="No Payroll Runs Executed"
              description="No monthly payroll has been computed yet. Run a payroll calculation when staff records exist."
              icon={Calendar}
              actionLabel="Run First Payroll"
              onAction={() => setActivePage('run_payroll')}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {runs.slice(0, 5).map(rec => {
                const emp = employees.find(e => e.id === rec.employeeId);
                return (
                  <div key={rec.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {emp ? `${emp.firstName} ${emp.lastName}` : `Employee ID: ${rec.employeeId}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        Calculated {new Date(rec.calculatedAt || rec.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-brand-700">{formatNaira(rec.netPay)}</p>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                        {rec.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
