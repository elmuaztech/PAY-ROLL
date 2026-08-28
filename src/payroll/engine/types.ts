export interface PayrollEngineInput {
  employeeId: string;
  payrollPeriodId: string;
  isPreview?: boolean;
}

export interface EngineItemBreakdown {
  itemType: 'BASIC' | 'ALLOWANCE' | 'DEDUCTION' | 'TAX' | 'OTHER';
  itemName: string;
  sourceType: string;
  sourceReferenceId?: string;
  amount: number;
  calculationMethodSnapshot?: string;
}

export interface CalculationWarning {
  code: string;
  message: string;
  isComplianceNotice?: boolean;
}

export interface CalculationError {
  code: string;
  message: string;
}

export interface EmployeeSnapshot {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  basicSalary: number;
  status: string;
}

export interface PayrollCalculationResult {
  success: boolean;
  isPreview: boolean;
  employee: EmployeeSnapshot;
  payrollPeriodId: string;
  basicSalary: number;
  totalAllowances: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  items: EngineItemBreakdown[];
  warnings: CalculationWarning[];
  errors: CalculationError[];
  calculatedAt: string;
}
