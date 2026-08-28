export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Temporary';

export type EmployeeStatus = 'Active' | 'Inactive' | 'Suspended' | 'On Leave';

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  otherName?: string;
  email: string;
  phoneNumber: string;
  department: string;
  position: string;
  employmentType: EmploymentType;
  dateOfEmployment: string;
  basicSalary: number; // Monthly basic salary in NGN (₦)
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: EmployeeStatus;
  createdAt: string;
  notes?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface Position {
  id: string;
  title: string;
  departmentId?: string;
  gradeLevel?: string;
  description?: string;
}

export type AllowanceStatus = 'Active' | 'Inactive' | 'ACTIVE' | 'INACTIVE';

export interface Allowance {
  id: string;
  name: string;
  type: 'Recurring' | 'One-Off';
  amountType: 'Fixed' | 'Percentage';
  value: number; // Fixed amount in ₦ or % of basic salary
  description?: string;
  isTaxable: boolean;
  status: AllowanceStatus;
  effectiveDate?: string;
  notes?: string;
}

export type DeductionCategory = 'STATUTORY' | 'ORGANIZATION' | 'LOAN' | 'OTHER' | 'Statutory' | 'Voluntary' | 'Cooperative';

export type DeductionStatus = 'Active' | 'Inactive' | 'Pending Verification' | 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION';

export interface Deduction {
  id: string;
  name: string;
  category: DeductionCategory;
  amountType: 'Fixed' | 'Percentage';
  value: number; // Fixed amount in ₦ or % of basic salary
  description?: string;
  status: DeductionStatus;
  effectiveDate?: string;
  notes?: string;
}

export interface PayrollPeriod {
  id: string;
  name?: string;
  month?: string; // e.g. "August"
  year?: number;  // e.g. 2026
  status: string;
  startDate?: string;
  endDate?: string;
  periodStart?: string;
  periodEnd?: string;
  payDate?: string;
  processedDate?: string;
  processedBy?: string;
  notes?: string;
}

export interface PayrollRecordItem {
  id: string;
  title: string;
  type: 'Allowance' | 'Deduction';
  amount: number;
  category?: string;
}

export interface PayrollRecord {
  id: string;
  payrollPeriodId: string;
  periodName: string; // e.g. "August 2026"
  employeeId: string;
  employeeName: string;
  department: string;
  basicSalary: number;
  totalAllowances: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: 'Draft' | 'Pending' | 'Paid';
  paymentDate?: string;
  items: PayrollRecordItem[];
  isPreviewOnly?: boolean;
}

export interface StatutorySetting {
  id: string;
  key: string;
  label: string;
  value: number;
  type: 'Percentage' | 'Fixed';
  category: 'Statutory' | 'Organization' | 'Employee-Specific';
  description: string;
  effectiveDate: string;
  status: 'Active' | 'Pending Verification';
  notes?: string;
}

export interface PayrollPreviewSummary {
  basicSalary: number;
  previewAllowances: number;
  previewGrossPay: number;
  previewDeductions: number;
  previewNetPay: number;
}

export type UserRole = 'ADMIN' | 'PAYROLL_OFFICER' | 'VIEWER';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  eventType: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  details?: string;
  createdAt: string;
}
