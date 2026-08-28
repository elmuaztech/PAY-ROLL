import {
  Employee,
  Department,
  Position,
  Allowance,
  Deduction,
  PayrollPeriod
} from '../types';

export interface ApiErrorFormat {
  code?: string;
  message?: string;
  details?: any;
}

export interface ApiResponse<T> {
  source?: string;
  data?: T;
  error?: ApiErrorFormat | string;
  message?: string;
}

function getErrorMessage(result: any, defaultMsg: string): string {
  if (result && result.error) {
    if (typeof result.error === 'string') return result.error;
    if (typeof result.error === 'object' && result.error.message) return result.error.message;
  }
  return (result && result.message) || defaultMsg;
}

async function safeFetchJson<T = any>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, init);
  const text = await res.text();
  let result: ApiResponse<T>;
  try {
    result = text ? JSON.parse(text) : {};
  } catch (err) {
    if (!res.ok) {
      throw new Error(`Server endpoint returned status ${res.status}: ${res.statusText}`);
    }
    throw new Error('Invalid server response format.');
  }
  if (!res.ok || result.error) {
    throw new Error(getErrorMessage(result, `Request failed with status ${res.status}`));
  }
  return result;
}

// ==================================================
// AUTHENTICATION & USER MANAGEMENT API
// ==================================================

export async function setupAdminApi(data: { fullName: string; email: string; password: string; setupSecret?: string }): Promise<any> {
  const result = await safeFetchJson<any>('/api/auth/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return result.data || result;
}

export async function loginApi(data: { email: string; password: string }): Promise<any> {
  const result = await safeFetchJson<any>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return result;
}

export async function forgotPasswordApi(email: string): Promise<any> {
  const result = await safeFetchJson<any>('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return result;
}

export async function resetPasswordApi(data: { email: string; resetCode: string; newPassword: string }): Promise<any> {
  const result = await safeFetchJson<any>('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return result;
}

export async function logoutApi(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    // Ignore logout errors
  }
}

export async function fetchCurrentUserApi(): Promise<any | null> {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const text = await res.text();
    const result: ApiResponse<any> = JSON.parse(text);
    return result.data || (result as any).user || null;
  } catch (err) {
    return null;
  }
}

export async function fetchUsersApi(): Promise<any[]> {
  try {
    const result = await safeFetchJson<any[]>('/api/users');
    return result.data || [];
  } catch (err) {
    return [];
  }
}

export async function createUserApi(userData: { fullName: string; email: string; password: string; role: string }): Promise<any> {
  const result = await safeFetchJson<any>('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return result.data;
}

// ==================================================
// DEPARTMENTS & POSITIONS API
// ==================================================

export async function fetchDepartmentsApi(): Promise<Department[]> {
  try {
    const result = await safeFetchJson<Department[]>('/api/departments');
    return result.data || [];
  } catch (err) {
    console.warn('Departments fetch fallback:', err);
    return [];
  }
}

export async function createDepartmentApi(deptData: { code: string; name: string; description?: string }): Promise<Department> {
  const result = await safeFetchJson<Department>('/api/departments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deptData)
  });
  return result.data!;
}

export async function updateDepartmentApi(id: string, deptData: { code?: string; name?: string; description?: string }): Promise<Department> {
  const result = await safeFetchJson<Department>('/api/departments', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...deptData })
  });
  return result.data!;
}

export async function deleteDepartmentApi(id: string): Promise<void> {
  await safeFetchJson<any>(`/api/departments?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

export async function fetchPositionsApi(departmentId?: string): Promise<Position[]> {
  try {
    const url = departmentId ? `/api/positions?departmentId=${encodeURIComponent(departmentId)}` : '/api/positions';
    const result = await safeFetchJson<Position[]>(url);
    return result.data || [];
  } catch (err) {
    console.warn('Positions fetch fallback:', err);
    return [];
  }
}

export async function createPositionApi(posData: { title: string; departmentId?: string; gradeLevel?: string; description?: string }): Promise<Position> {
  const result = await safeFetchJson<Position>('/api/positions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(posData)
  });
  return result.data!;
}

export async function updatePositionApi(id: string, posData: { title?: string; departmentId?: string; gradeLevel?: string; description?: string }): Promise<Position> {
  const result = await safeFetchJson<Position>('/api/positions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...posData })
  });
  return result.data!;
}

export async function deletePositionApi(id: string): Promise<void> {
  await safeFetchJson<any>(`/api/positions?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

// ==================================================
// EMPLOYEES API
// ==================================================

export async function fetchEmployeesApi(): Promise<Employee[]> {
  try {
    const result = await safeFetchJson<any[]>('/api/employees');
    if (result.data) {
      return result.data.map(item => ({
        id: item.id,
        employeeId: item.employeeId || item.employee_id,
        firstName: item.firstName || item.first_name,
        lastName: item.lastName || item.last_name,
        otherName: item.otherName || item.other_name || '',
        email: item.email,
        phoneNumber: item.phoneNumber || item.phone_number,
        department: item.departmentName || item.department || 'General',
        position: item.positionTitle || item.position || 'Staff',
        employmentType: item.employmentType || item.employment_type || 'Full-Time',
        dateOfEmployment: item.dateOfEmployment || item.date_of_employment || '',
        basicSalary: typeof item.basicSalary === 'number' ? item.basicSalary : parseFloat(item.basicSalary) || 0,
        bankName: item.bankName || item.bank_name,
        accountNumber: item.accountNumber || item.account_number,
        accountName: item.accountName || item.account_name,
        status: item.status || 'Active',
        createdAt: item.createdAt || item.created_at || new Date().toISOString()
      }));
    }
    return [];
  } catch (error) {
    console.warn('Network error or unconfigured API:', error);
    return [];
  }
}

export async function fetchEmployeeByIdApi(id: string): Promise<Employee | null> {
  try {
    const result = await safeFetchJson<any>(`/api/employees?id=${encodeURIComponent(id)}`);
    if (!result.data) return null;
    const item = result.data;
    return {
      id: item.id,
      employeeId: item.employeeId || item.employee_id,
      firstName: item.firstName || item.first_name,
      lastName: item.lastName || item.last_name,
      otherName: item.otherName || item.other_name || '',
      email: item.email,
      phoneNumber: item.phoneNumber || item.phone_number,
      department: item.departmentName || item.department || 'General',
      position: item.positionTitle || item.position || 'Staff',
      employmentType: item.employmentType || item.employment_type || 'Full-Time',
      dateOfEmployment: item.dateOfEmployment || item.date_of_employment || '',
      basicSalary: typeof item.basicSalary === 'number' ? item.basicSalary : parseFloat(item.basicSalary) || 0,
      bankName: item.bankName || item.bank_name,
      accountNumber: item.accountNumber || item.account_number,
      accountName: item.accountName || item.account_name,
      status: item.status || 'Active',
      createdAt: item.createdAt || item.created_at || new Date().toISOString()
    };
  } catch (err) {
    return null;
  }
}

export async function createEmployeeApi(employeeData: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> {
  const result = await safeFetchJson<any>('/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeData)
  });
  const item = result.data;
  return {
    id: item.id,
    employeeId: item.employeeId,
    firstName: item.firstName,
    lastName: item.lastName,
    otherName: item.otherName || '',
    email: item.email,
    phoneNumber: item.phoneNumber,
    department: item.departmentName || employeeData.department,
    position: item.positionTitle || employeeData.position,
    employmentType: item.employmentType,
    dateOfEmployment: item.dateOfEmployment,
    basicSalary: typeof item.basicSalary === 'number' ? item.basicSalary : parseFloat(item.basicSalary) || employeeData.basicSalary,
    bankName: item.bankName,
    accountNumber: item.accountNumber,
    accountName: item.accountName,
    status: item.status,
    createdAt: item.createdAt || new Date().toISOString()
  };
}

export async function updateEmployeeApi(id: string, employeeData: Partial<Employee>): Promise<void> {
  await safeFetchJson<any>('/api/employees', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...employeeData })
  });
}

export async function deactivateEmployeeApi(id: string): Promise<void> {
  await safeFetchJson<any>('/api/employees', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
}

// ==================================================
// ALLOWANCES & DEDUCTIONS API
// ==================================================

export async function fetchAllowancesApi(): Promise<Allowance[]> {
  try {
    const result = await safeFetchJson<any[]>('/api/allowances');
    if (result.data) {
      return result.data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type || 'Recurring',
        amountType: item.calculationMethod === 'PERCENTAGE_OF_BASIC' ? 'Percentage' : 'Fixed',
        value: typeof item.defaultValue === 'number' ? item.defaultValue : parseFloat(item.defaultValue) || 0,
        description: item.description || '',
        isTaxable: item.isTaxable !== false,
        status: item.status === 'INACTIVE' ? 'Inactive' : 'Active'
      }));
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function createAllowanceApi(data: Omit<Allowance, 'id'>): Promise<Allowance> {
  const result = await safeFetchJson<any>('/api/allowances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      calculationMethod: data.amountType === 'Percentage' ? 'PERCENTAGE_OF_BASIC' : 'FIXED_AMOUNT',
      defaultValue: data.value,
      status: data.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'
    })
  });
  const item = result.data;
  return {
    id: item.id,
    name: item.name,
    type: data.type || 'Recurring',
    amountType: item.calculationMethod === 'PERCENTAGE_OF_BASIC' ? 'Percentage' : 'Fixed',
    value: parseFloat(item.defaultValue) || data.value,
    description: item.description || '',
    isTaxable: data.isTaxable !== false,
    status: item.status === 'INACTIVE' ? 'Inactive' : 'Active'
  };
}

export async function fetchDeductionsApi(): Promise<Deduction[]> {
  try {
    const result = await safeFetchJson<any[]>('/api/deductions');
    if (result.data) {
      return result.data.map(item => ({
        id: item.id,
        name: item.name,
        category: (item.category || 'ORGANIZATION') as any,
        amountType: item.calculationMethod === 'PERCENTAGE_OF_BASIC' ? 'Percentage' : 'Fixed',
        value: typeof item.defaultValue === 'number' ? item.defaultValue : parseFloat(item.defaultValue) || 0,
        description: item.description || '',
        status: item.status === 'INACTIVE' ? 'Inactive' : 'Active',
        notes: item.notes || ''
      }));
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function createDeductionApi(data: Omit<Deduction, 'id'>): Promise<Deduction> {
  const result = await safeFetchJson<any>('/api/deductions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      category: data.category || 'ORGANIZATION',
      calculationMethod: data.amountType === 'Percentage' ? 'PERCENTAGE_OF_BASIC' : 'FIXED_AMOUNT',
      defaultValue: data.value,
      notes: data.notes || '',
      status: data.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'
    })
  });
  const item = result.data;
  return {
    id: item.id,
    name: item.name,
    category: item.category as any,
    amountType: item.calculationMethod === 'PERCENTAGE_OF_BASIC' ? 'Percentage' : 'Fixed',
    value: parseFloat(item.defaultValue) || data.value,
    description: item.description || '',
    status: item.status === 'INACTIVE' ? 'Inactive' : 'Active',
    notes: item.notes || ''
  };
}

export async function fetchPayrollPeriodsApi(): Promise<PayrollPeriod[]> {
  try {
    const result = await safeFetchJson<PayrollPeriod[]>('/api/payroll-periods');
    return result.data || [];
  } catch (err) {
    return [];
  }
}

export async function createPayrollPeriodApi(data: { name: string; periodStart: string; periodEnd: string; payDate: string }): Promise<PayrollPeriod> {
  const result = await safeFetchJson<PayrollPeriod>('/api/payroll-periods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return result.data!;
}

// ==================================================
// PHASE 4: PAYROLL ENGINE & RUNS API
// ==================================================

export async function generatePayrollPreviewApi(payrollPeriodId: string, employeeId?: string): Promise<any> {
  const result = await safeFetchJson<any>('/api/payroll/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payrollPeriodId, employeeId })
  });
  return result.data;
}

export async function persistPayrollRunsApi(payrollPeriodId: string, employeeId?: string, isPreview: boolean = false): Promise<any> {
  const result = await safeFetchJson<any>('/api/payroll/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payrollPeriodId, employeeId, isPreview })
  });
  return result.data;
}

export async function fetchPayrollRunsApi(payrollPeriodId?: string): Promise<any[]> {
  try {
    const url = payrollPeriodId ? `/api/payroll/runs?payrollPeriodId=${encodeURIComponent(payrollPeriodId)}` : '/api/payroll/runs';
    const result = await safeFetchJson<any[]>(url);
    return result.data || [];
  } catch (err) {
    return [];
  }
}

export async function fetchPayrollRunByIdApi(id: string): Promise<any | null> {
  try {
    const result = await safeFetchJson<any>(`/api/payroll/runs?id=${encodeURIComponent(id)}`);
    if (!result.data) return null;
    return result.data;
  } catch (err) {
    return null;
  }
}

export async function updatePayrollRunStatusApi(id: string, status: string): Promise<void> {
  await safeFetchJson<any>('/api/payroll/runs', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status })
  });
}
