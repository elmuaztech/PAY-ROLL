import { PayrollCalculationResult } from './types';
import { calculateEmployeeEarnings, toMoneyDecimal } from './earningsCalculator';
import { calculateEmployeeDeductions } from './deductionsCalculator';
import { validatePayrollContext } from './validation';

export function runPayrollEngine(
  employee: any,
  period: any,
  allowanceRules: any[],
  employeeAllowances: any[],
  deductionRules: any[],
  employeeDeductions: any[],
  existingRuns: any[] = [],
  isPreview: boolean = true
): PayrollCalculationResult {
  const errors = validatePayrollContext(employee, period, existingRuns, isPreview);

  const empBasicSalaryDec = toMoneyDecimal(employee?.basicSalary || 0);

  const empSnapshot = {
    id: employee?.id || '',
    employeeId: employee?.employeeId || '',
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    department: employee?.departmentName || employee?.department || 'General',
    position: employee?.positionTitle || employee?.position || 'Staff',
    basicSalary: empBasicSalaryDec.toNumber(),
    status: employee?.status || 'Active'
  };

  if (errors.length > 0) {
    return {
      success: false,
      isPreview,
      employee: empSnapshot,
      payrollPeriodId: period?.id || '',
      basicSalary: empBasicSalaryDec.toNumber(),
      totalAllowances: 0,
      grossPay: empBasicSalaryDec.toNumber(),
      totalDeductions: 0,
      netPay: empBasicSalaryDec.toNumber(),
      items: [],
      warnings: [],
      errors,
      calculatedAt: new Date().toISOString()
    };
  }

  const periodStart = period.periodStart || period.startDate || new Date().toISOString().split('T')[0];

  // 1. Calculate Earnings (Basic + Allowances using decimal.js)
  const earnings = calculateEmployeeEarnings(
    empBasicSalaryDec.toNumber(),
    allowanceRules,
    employeeAllowances,
    periodStart
  );

  // 2. Calculate Deductions (Gross - Deductions using decimal.js)
  const deductions = calculateEmployeeDeductions(
    empBasicSalaryDec.toNumber(),
    earnings.grossPay,
    deductionRules,
    employeeDeductions,
    periodStart
  );

  // Combine line items
  const items = [...earnings.items, ...deductions.items];

  return {
    success: true,
    isPreview,
    employee: empSnapshot,
    payrollPeriodId: period.id,
    basicSalary: empBasicSalaryDec.toNumber(),
    totalAllowances: earnings.totalAllowances,
    grossPay: earnings.grossPay,
    totalDeductions: deductions.totalDeductions,
    netPay: deductions.netPay,
    items,
    warnings: deductions.warnings,
    errors: [],
    calculatedAt: new Date().toISOString()
  };
}
