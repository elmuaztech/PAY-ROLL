import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { EmptyState } from '../components/common/EmptyState';
import { StatutoryWarningBanner } from '../components/common/StatutoryWarningBanner';
import { usePayroll } from '../context/PayrollContext';
import { formatNaira } from '../utils/formatters';
import { fetchPayrollRunsApi } from '../services/api';
import {
  FileText,
  Printer,
  Building2,
  PieChart,
  Download,
  Users,
  RefreshCw,
  History
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { employees, departments, payrollPeriods, setActivePage } = usePayroll();
  const [activeTab, setActiveTab] = useState<'register' | 'department' | 'history'>('register');

  const [runs, setRuns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPayrollRunsApi(selectedPeriodId || undefined);
      setRuns(data);
    } catch (err) {
      console.warn('Failed to load report data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedPeriodId]);

  // Aggregate totals
  const totalBasic = runs.reduce((acc, r) => acc + (r.basicSalarySnapshot || 0), 0);
  const totalAllowances = runs.reduce((acc, r) => acc + (r.totalAllowances || 0), 0);
  const totalGross = runs.reduce((acc, r) => acc + (r.grossPay || 0), 0);
  const totalDeductions = runs.reduce((acc, r) => acc + (r.totalDeductions || 0), 0);
  const totalNet = runs.reduce((acc, r) => acc + (r.netPay || 0), 0);

  // Department Aggregation Grouping
  const deptSummaryMap: Record<string, { deptName: string; empCount: number; basic: number; allowances: number; gross: number; deductions: number; net: number }> = {};

  departments.forEach(d => {
    deptSummaryMap[d.name] = { deptName: d.name, empCount: 0, basic: 0, allowances: 0, gross: 0, deductions: 0, net: 0 };
  });

  runs.forEach(r => {
    const emp = employees.find(e => e.id === r.employeeId);
    const deptName = emp?.department || 'General';
    if (!deptSummaryMap[deptName]) {
      deptSummaryMap[deptName] = { deptName, empCount: 0, basic: 0, allowances: 0, gross: 0, deductions: 0, net: 0 };
    }
    deptSummaryMap[deptName].empCount += 1;
    deptSummaryMap[deptName].basic += r.basicSalarySnapshot || 0;
    deptSummaryMap[deptName].allowances += r.totalAllowances || 0;
    deptSummaryMap[deptName].gross += r.grossPay || 0;
    deptSummaryMap[deptName].deductions += r.totalDeductions || 0;
    deptSummaryMap[deptName].net += r.netPay || 0;
  });

  const deptSummaryList = Object.values(deptSummaryMap).filter(d => d.empCount > 0);

  // CSV Export Utility Function
  const exportCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escapeCsv = (val: string | number) => {
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportRegisterCsv = () => {
    const headers = ['Run ID', 'Employee ID', 'Employee Name', 'Department', 'Basic Salary (NGN)', 'Allowances (NGN)', 'Gross Pay (NGN)', 'Deductions (NGN)', 'Net Pay (NGN)', 'Status'];
    const rows = runs.map(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return [
        r.id,
        emp?.employeeId || '',
        emp ? `${emp.firstName} ${emp.lastName}` : '',
        emp?.department || 'General',
        r.basicSalarySnapshot || 0,
        r.totalAllowances || 0,
        r.grossPay || 0,
        r.totalDeductions || 0,
        r.netPay || 0,
        r.status
      ];
    });
    exportCsv('Payroll_Register_Report', headers, rows);
  };

  const handleExportDepartmentCsv = () => {
    const headers = ['Department Name', 'Employee Count', 'Total Basic (NGN)', 'Total Allowances (NGN)', 'Total Gross (NGN)', 'Total Deductions (NGN)', 'Total Net (NGN)'];
    const rows = deptSummaryList.map(d => [
      d.deptName,
      d.empCount,
      d.basic.toFixed(2),
      d.allowances.toFixed(2),
      d.gross.toFixed(2),
      d.deductions.toFixed(2),
      d.net.toFixed(2)
    ]);
    exportCsv('Department_Payroll_Summary_Report', headers, rows);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll & Financial Reporting Center"
        subtitle="Generate restaurant master payroll registers, departmental summaries, and CSV audit exports"
        breadcrumb="Reporting & Compliance"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={loadReportData}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs"
              title="Refresh Report Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs print:hidden"
            >
              <Printer className="w-4 h-4" /> Print Report
            </button>
          </div>
        }
      />

      <StatutoryWarningBanner />

      {/* Tabs & Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center print:hidden">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'register' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" /> Payroll Register ({runs.length})
          </button>
          <button
            onClick={() => setActiveTab('department')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'department' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" /> Department Summary
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedPeriodId}
            onChange={e => setSelectedPeriodId(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
          >
            <option value="">All Payroll Cycles</option>
            {payrollPeriods.map(p => (
              <option key={p.id} value={p.id}>
                {p.name || `${p.month || ''} ${p.year || ''}`}
              </option>
            ))}
          </select>

          <button
            onClick={activeTab === 'register' ? handleExportRegisterCsv : handleExportDepartmentCsv}
            disabled={runs.length === 0}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Basic Pay</span>
          <p className="text-lg font-extrabold text-slate-800 mt-1">{formatNaira(totalBasic)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Allowances</span>
          <p className="text-lg font-extrabold text-emerald-700 mt-1">+{formatNaira(totalAllowances)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Deductions</span>
          <p className="text-lg font-extrabold text-rose-700 mt-1">-{formatNaira(totalDeductions)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-brand-200 bg-brand-50/50 shadow-xs">
          <span className="text-[11px] font-bold text-brand-900 uppercase">Total Net Disbursement</span>
          <p className="text-xl font-black text-brand-700 mt-1">{formatNaira(totalNet)}</p>
        </div>
      </div>

      {/* TAB 1: PAYROLL REGISTER */}
      {activeTab === 'register' && (
        <DataTable
          headers={[
            'Employee ID',
            'Employee Name',
            'Department',
            'Basic Pay',
            'Allowances',
            'Gross Pay',
            'Deductions',
            'Net Pay',
            'Status'
          ]}
          empty={runs.length === 0}
          emptyNode={
            <EmptyState
              title="No Payroll Records"
              description="No monthly payroll runs have been computed yet. Process payroll to generate report data."
              icon={FileText}
              actionLabel="Go to Run Payroll"
              onAction={() => setActivePage('run_payroll')}
            />
          }
        >
          {runs.map(r => {
            const emp = employees.find(e => e.id === r.employeeId);
            return (
              <tr key={r.id} className="hover:bg-slate-50/80 transition-colors text-xs">
                <td className="px-6 py-4 font-mono font-bold text-brand-700">{emp?.employeeId || 'N/A'}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{emp ? `${emp.firstName} ${emp.lastName}` : 'Staff'}</td>
                <td className="px-6 py-4 text-slate-600">{emp?.department || 'General'}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">{formatNaira(r.basicSalarySnapshot)}</td>
                <td className="px-6 py-4 font-semibold text-emerald-700">+{formatNaira(r.totalAllowances)}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{formatNaira(r.grossPay)}</td>
                <td className="px-6 py-4 font-semibold text-rose-700">-{formatNaira(r.totalDeductions)}</td>
                <td className="px-6 py-4 font-extrabold text-brand-700 text-sm">{formatNaira(r.netPay)}</td>
                <td className="px-6 py-4 font-bold text-[10px] text-slate-500 uppercase">{r.status}</td>
              </tr>
            );
          })}
        </DataTable>
      )}

      {/* TAB 2: DEPARTMENT SUMMARY */}
      {activeTab === 'department' && (
        <DataTable
          headers={[
            'Department Name',
            'Staff Count',
            'Total Basic Pay',
            'Total Allowances',
            'Total Gross Earnings',
            'Total Deductions',
            'Total Net Disbursement'
          ]}
          empty={deptSummaryList.length === 0}
          emptyNode={
            <EmptyState
              title="No Department Payroll Summary"
              description="Calculate payroll runs to view departmental financial breakdowns."
              icon={Building2}
            />
          }
        >
          {deptSummaryList.map((d, idx) => (
            <tr key={idx} className="hover:bg-slate-50/80 transition-colors text-xs">
              <td className="px-6 py-4 font-bold text-slate-900 text-sm">{d.deptName}</td>
              <td className="px-6 py-4 font-bold text-brand-700">{d.empCount} Staff</td>
              <td className="px-6 py-4 font-semibold text-slate-800">{formatNaira(d.basic)}</td>
              <td className="px-6 py-4 font-semibold text-emerald-700">+{formatNaira(d.allowances)}</td>
              <td className="px-6 py-4 font-bold text-slate-900">{formatNaira(d.gross)}</td>
              <td className="px-6 py-4 font-semibold text-rose-700">-{formatNaira(d.deductions)}</td>
              <td className="px-6 py-4 font-extrabold text-brand-700 text-sm">{formatNaira(d.net)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
};
