import { CalculationError } from './types';

export function validatePayrollContext(
  employee: any,
  period: any,
  existingRuns: any[],
  isPreview: boolean = false
): CalculationError[] {
  const errors: CalculationError[] = [];

  if (!employee) {
    errors.push({ code: 'EMPLOYEE_NOT_FOUND', message: 'Employee record does not exist.' });
    return errors;
  }

  if (employee.status !== 'Active' && employee.status !== 'ACTIVE') {
    errors.push({
      code: 'EMPLOYEE_INACTIVE',
      message: `Employee '${employee.firstName} ${employee.lastName}' is currently ${employee.status} and cannot be processed in payroll.`
    });
  }

  if (!period) {
    errors.push({ code: 'PERIOD_NOT_FOUND', message: 'Payroll period record does not exist.' });
    return errors;
  }

  if (period.status === 'CLOSED' || period.status === 'Closed') {
    errors.push({
      code: 'PERIOD_CLOSED',
      message: `Payroll period '${period.name || period.id}' is CLOSED and immutable. No new payroll runs can be processed.`
    });
  }

  if (period.status === 'COMPLETED' || period.status === 'Completed') {
    if (!isPreview) {
      errors.push({
        code: 'PERIOD_COMPLETED',
        message: `Payroll period '${period.name || period.id}' is COMPLETED. Final calculations cannot be overwritten.`
      });
    }
  }

  // Duplicate final run check
  if (!isPreview) {
    const duplicateRun = existingRuns.find(
      r => r.employeeId === employee.id && r.payrollPeriodId === period.id && !r.isPreview && r.status !== 'VOID'
    );
    if (duplicateRun) {
      errors.push({
        code: 'DUPLICATE_FINAL_RUN',
        message: `An active final payroll run already exists for ${employee.firstName} ${employee.lastName} in this period.`
      });
    }
  }

  return errors;
}
