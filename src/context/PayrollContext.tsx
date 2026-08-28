import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Employee,
  Department,
  Position,
  Allowance,
  Deduction,
  PayrollPeriod,
  PayrollRecord,
  StatutorySetting,
  PayrollPreviewSummary,
  User
} from '../types';
import { generateId } from '../utils/formatters';
import {
  fetchEmployeesApi,
  createEmployeeApi,
  updateEmployeeApi,
  deactivateEmployeeApi,
  fetchDepartmentsApi,
  createDepartmentApi,
  updateDepartmentApi,
  deleteDepartmentApi,
  fetchPositionsApi,
  createPositionApi,
  updatePositionApi,
  deletePositionApi,
  fetchAllowancesApi,
  createAllowanceApi,
  fetchDeductionsApi,
  createDeductionApi,
  fetchPayrollPeriodsApi,
  createPayrollPeriodApi,
  fetchCurrentUserApi,
  loginApi,
  logoutApi,
  setupAdminApi
} from '../services/api';

const DEFAULT_STATUTORY_SETTINGS: StatutorySetting[] = [
  {
    id: 'stat-1',
    key: 'paye_tax_config',
    label: 'PAYE Tax Rate Configuration',
    value: 0,
    type: 'Percentage',
    category: 'Statutory',
    description: 'Pay As You Earn personal income tax schedule.',
    effectiveDate: '2026-01-01',
    status: 'Pending Verification',
    notes: 'Statutory rates must be verified before production use.'
  },
  {
    id: 'stat-2',
    key: 'pension_employee_config',
    label: 'Employee Pension Contribution Rate',
    value: 0,
    type: 'Percentage',
    category: 'Statutory',
    description: 'Employee pension contribution rate placeholder.',
    effectiveDate: '2026-01-01',
    status: 'Pending Verification',
    notes: 'Requires verification against current official regulations.'
  },
  {
    id: 'stat-3',
    key: 'nhf_employee_config',
    label: 'National Housing Fund (NHF) Rate',
    value: 0,
    type: 'Percentage',
    category: 'Statutory',
    description: 'National Housing Fund contribution rate placeholder.',
    effectiveDate: '2026-01-01',
    status: 'Pending Verification',
    notes: 'Requires verification against qualifying income thresholds.'
  }
];

interface PayrollContextType {
  activePage: string;
  setActivePage: (page: string) => void;

  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  selectedPayrollId: string | null;
  setSelectedPayrollId: (id: string | null) => void;

  // Authentication State
  currentUser: User | null;
  isAuthLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  setupAdmin: (data: { fullName: string; email: string; password: string; setupSecret?: string }) => Promise<void>;

  // Data Collections & Loading States
  employees: Employee[];
  departments: Department[];
  positions: Position[];
  allowances: Allowance[];
  deductions: Deduction[];
  payrollPeriods: PayrollPeriod[];
  payrollRecords: PayrollRecord[];
  statutorySettings: StatutorySetting[];
  isLoadingEmployees: boolean;
  apiError: string | null;

  // Organization Management Handlers
  addDepartment: (deptData: { code: string; name: string; description?: string }) => Promise<Department>;
  updateDepartment: (id: string, deptData: { code?: string; name?: string; description?: string }) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addPosition: (posData: { title: string; departmentId?: string; gradeLevel?: string; description?: string }) => Promise<Position>;
  updatePosition: (id: string, posData: { title?: string; departmentId?: string; gradeLevel?: string; description?: string }) => Promise<void>;
  deletePosition: (id: string) => Promise<void>;

  // Employee CRUD Handlers
  addEmployee: (employeeData: Omit<Employee, 'id' | 'createdAt'>) => Promise<Employee>;
  updateEmployee: (id: string, employeeData: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  // Allowance & Deduction Handlers
  addAllowance: (allowanceData: Omit<Allowance, 'id'>) => Promise<Allowance>;
  addDeduction: (deductionData: Omit<Deduction, 'id'>) => Promise<Deduction>;

  // Payroll Period & Preview Handlers
  addPayrollPeriod: (periodData: { name: string; periodStart: string; periodEnd: string; payDate: string }) => Promise<PayrollPeriod>;
  createPreviewPayrollRun: (periodMonth: string, periodYear: number) => PayrollPeriod;
  calculatePreviewTotals: (basicSalary: number) => PayrollPreviewSummary;
  updateStatutorySetting: (id: string, newValue: number) => void;

  refreshAllData: () => Promise<void>;
}

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

export const PayrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // System State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [statutorySettings, setStatutorySettings] = useState<StatutorySetting[]>(DEFAULT_STATUTORY_SETTINGS);

  const [isLoadingEmployees, setIsLoadingEmployees] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Check Current Session on mount
  useEffect(() => {
    setIsAuthLoading(true);
    fetchCurrentUserApi()
      .then(user => {
        if (user) setCurrentUser(user);
      })
      .catch(() => {})
      .finally(() => setIsAuthLoading(false));
  }, []);

  const login = async (data: { email: string; password: string }) => {
    const res = await loginApi(data);
    if (res.user) setCurrentUser(res.user);
  };

  const logout = async () => {
    await logoutApi();
    setCurrentUser(null);
  };

  const setupAdmin = async (data: { fullName: string; email: string; password: string; setupSecret?: string }) => {
    const res = await setupAdminApi(data);
    if (res.user) setCurrentUser(res.user);
  };

  const refreshAllData = async () => {
    setIsLoadingEmployees(true);
    setApiError(null);
    try {
      const [fetchedEmps, fetchedDepts, fetchedPos, fetchedAllw, fetchedDed, fetchedPeriods] = await Promise.all([
        fetchEmployeesApi(),
        fetchDepartmentsApi(),
        fetchPositionsApi(),
        fetchAllowancesApi(),
        fetchDeductionsApi(),
        fetchPayrollPeriodsApi()
      ]);
      setEmployees(fetchedEmps);
      setDepartments(fetchedDepts);
      setPositions(fetchedPos);
      setAllowances(fetchedAllw);
      setDeductions(fetchedDed);
      setPayrollPeriods(fetchedPeriods);
    } catch (err: any) {
      console.error('Error fetching system data from API:', err);
      setApiError(err?.message || 'Failed to load system data');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Department Management
  const addDepartment = async (deptData: { code: string; name: string; description?: string }): Promise<Department> => {
    setApiError(null);
    try {
      const created = await createDepartmentApi(deptData);
      setDepartments(prev => [...prev, created]);
      return created;
    } catch (err: any) {
      const msg = err?.message || 'Failed to create department';
      setApiError(msg);
      throw err;
    }
  };

  const updateDepartment = async (id: string, deptData: { code?: string; name?: string; description?: string }): Promise<void> => {
    setApiError(null);
    try {
      const updated = await updateDepartmentApi(id, deptData);
      setDepartments(prev => prev.map(d => (d.id === id ? updated : d)));
    } catch (err: any) {
      setApiError(err?.message || 'Failed to update department');
      throw err;
    }
  };

  const deleteDepartment = async (id: string): Promise<void> => {
    setApiError(null);
    try {
      await deleteDepartmentApi(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      const msg = err?.message || 'Failed to delete department';
      setApiError(msg);
      throw err;
    }
  };

  // Position Management
  const addPosition = async (posData: { title: string; departmentId?: string; gradeLevel?: string; description?: string }): Promise<Position> => {
    setApiError(null);
    try {
      const created = await createPositionApi(posData);
      setPositions(prev => [...prev, created]);
      return created;
    } catch (err: any) {
      const msg = err?.message || 'Failed to create position';
      setApiError(msg);
      throw err;
    }
  };

  const updatePosition = async (id: string, posData: { title?: string; departmentId?: string; gradeLevel?: string; description?: string }): Promise<void> => {
    setApiError(null);
    try {
      const updated = await updatePositionApi(id, posData);
      setPositions(prev => prev.map(p => (p.id === id ? updated : p)));
    } catch (err: any) {
      setApiError(err?.message || 'Failed to update position');
      throw err;
    }
  };

  const deletePosition = async (id: string): Promise<void> => {
    setApiError(null);
    try {
      await deletePositionApi(id);
      setPositions(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      const msg = err?.message || 'Failed to delete position';
      setApiError(msg);
      throw err;
    }
  };

  // Employee CRUD
  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> => {
    setApiError(null);
    try {
      const created = await createEmployeeApi(employeeData);
      setEmployees(prev => [created, ...prev]);
      return created;
    } catch (err: any) {
      const msg = err?.message || 'Failed to register employee';
      setApiError(msg);
      throw err;
    }
  };

  const updateEmployee = async (id: string, employeeData: Partial<Employee>): Promise<void> => {
    setApiError(null);
    try {
      await updateEmployeeApi(id, employeeData);
      setEmployees(prev => prev.map(emp => (emp.id === id ? { ...emp, ...employeeData } : emp)));
    } catch (err: any) {
      setApiError(err?.message || 'Failed to update employee');
      throw err;
    }
  };

  const deleteEmployee = async (id: string): Promise<void> => {
    setApiError(null);
    try {
      await deactivateEmployeeApi(id);
      setEmployees(prev => prev.map(emp => (emp.id === id ? { ...emp, status: 'Inactive' } : emp)));
    } catch (err: any) {
      setApiError(err?.message || 'Failed to deactivate employee');
      throw err;
    }
  };

  // Allowances & Deductions
  const addAllowance = async (allowanceData: Omit<Allowance, 'id'>): Promise<Allowance> => {
    setApiError(null);
    try {
      const created = await createAllowanceApi(allowanceData);
      setAllowances(prev => [created, ...prev]);
      return created;
    } catch (err: any) {
      setApiError(err?.message || 'Failed to create allowance');
      const fallback: Allowance = { ...allowanceData, id: generateId('allw') };
      setAllowances(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const addDeduction = async (deductionData: Omit<Deduction, 'id'>): Promise<Deduction> => {
    setApiError(null);
    try {
      const created = await createDeductionApi(deductionData);
      setDeductions(prev => [created, ...prev]);
      return created;
    } catch (err: any) {
      setApiError(err?.message || 'Failed to create deduction');
      const fallback: Deduction = { ...deductionData, id: generateId('ded') };
      setDeductions(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  // Payroll Period Management
  const addPayrollPeriod = async (periodData: { name: string; periodStart: string; periodEnd: string; payDate: string }): Promise<PayrollPeriod> => {
    setApiError(null);
    try {
      const created = await createPayrollPeriodApi(periodData);
      setPayrollPeriods(prev => [created, ...prev]);
      return created;
    } catch (err: any) {
      setApiError(err?.message || 'Failed to create payroll period');
      throw err;
    }
  };

  const calculatePreviewTotals = (basicSalary: number): PayrollPreviewSummary => {
    let previewAllowances = 0;
    allowances.forEach(a => {
      if (a.status === 'Active' || a.status === 'ACTIVE') {
        previewAllowances += a.amountType === 'Fixed' ? a.value : (basicSalary * a.value) / 100;
      }
    });

    const previewGrossPay = basicSalary + previewAllowances;

    let previewDeductions = 0;
    deductions.forEach(d => {
      if (d.status === 'Active' || d.status === 'ACTIVE') {
        previewDeductions += d.amountType === 'Fixed' ? d.value : (basicSalary * d.value) / 100;
      }
    });

    const previewNetPay = previewGrossPay - previewDeductions;

    return {
      basicSalary,
      previewAllowances,
      previewGrossPay,
      previewDeductions,
      previewNetPay
    };
  };

  const createPreviewPayrollRun = (periodMonth: string, periodYear: number): PayrollPeriod => {
    const newPeriod: PayrollPeriod = {
      id: generateId('period'),
      month: periodMonth,
      year: periodYear,
      status: 'Processing',
      startDate: `${periodYear}-${periodMonth.padStart(2, '0')}-01`,
      endDate: `${periodYear}-${periodMonth.padStart(2, '0')}-28`,
      processedDate: new Date().toISOString().split('T')[0],
      processedBy: 'Payroll Officer (Preview Mode)',
      notes: 'Preview batch run for UI demonstration.'
    };

    const newRecords: PayrollRecord[] = employees.map(emp => {
      const summary = calculatePreviewTotals(emp.basicSalary);
      const items: any[] = [];

      allowances.forEach(a => {
        if (a.status === 'Active' || a.status === 'ACTIVE') {
          const amt = a.amountType === 'Fixed' ? a.value : (emp.basicSalary * a.value) / 100;
          items.push({ id: generateId('item'), title: a.name, type: 'Allowance', amount: amt, category: 'Allowance' });
        }
      });

      deductions.forEach(d => {
        if (d.status === 'Active' || d.status === 'ACTIVE') {
          const amt = d.amountType === 'Fixed' ? d.value : (emp.basicSalary * d.value) / 100;
          items.push({ id: generateId('item'), title: d.name, type: 'Deduction', amount: amt, category: d.category });
        }
      });

      return {
        id: generateId('rec'),
        payrollPeriodId: newPeriod.id,
        periodName: `${periodMonth} ${periodYear}`,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department,
        basicSalary: emp.basicSalary,
        totalAllowances: summary.previewAllowances,
        grossSalary: summary.previewGrossPay,
        totalDeductions: summary.previewDeductions,
        netSalary: summary.previewNetPay,
        status: 'Pending',
        items,
        isPreviewOnly: true
      };
    });

    setPayrollPeriods(prev => [newPeriod, ...prev]);
    setPayrollRecords(prev => [...newRecords, ...prev]);
    return newPeriod;
  };

  const updateStatutorySetting = (id: string, newValue: number) => {
    setStatutorySettings(prev => prev.map(s => (s.id === id ? { ...s, value: newValue } : s)));
  };

  return (
    <PayrollContext.Provider
      value={{
        activePage,
        setActivePage,
        selectedEmployeeId,
        setSelectedEmployeeId,
        selectedPayrollId,
        setSelectedPayrollId,
        currentUser,
        isAuthLoading,
        login,
        logout,
        setupAdmin,
        employees,
        departments,
        positions,
        allowances,
        deductions,
        payrollPeriods,
        payrollRecords,
        statutorySettings,
        isLoadingEmployees,
        apiError,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addPosition,
        updatePosition,
        deletePosition,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addAllowance,
        addDeduction,
        addPayrollPeriod,
        createPreviewPayrollRun,
        calculatePreviewTotals,
        updateStatutorySetting,
        refreshAllData
      }}
    >
      {children}
    </PayrollContext.Provider>
  );
};

export const usePayroll = () => {
  const context = useContext(PayrollContext);
  if (!context) {
    throw new Error('usePayroll must be used within a PayrollProvider');
  }
  return context;
};
