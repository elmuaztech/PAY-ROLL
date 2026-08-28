import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  date,
  timestamp,
  boolean,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';

// ==================================================
// PHASE 2 TABLES: ORGANIZATIONAL & EMPLOYEE STRUCTURE
// ==================================================

export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const positions = pgTable(
  'positions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'restrict' }),
    gradeLevel: varchar('grade_level', { length: 50 }),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  table => ({
    departmentIdx: index('positions_department_idx').on(table.departmentId)
  })
);

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: varchar('employee_id', { length: 50 }).notNull().unique(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    otherName: varchar('other_name', { length: 100 }),
    email: varchar('email', { length: 255 }).notNull(),
    phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
    departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'restrict' }),
    departmentName: varchar('department_name', { length: 255 }),
    positionId: uuid('position_id').references(() => positions.id, { onDelete: 'restrict' }),
    positionTitle: varchar('position_title', { length: 255 }),
    employmentType: varchar('employment_type', { length: 50 }).notNull().default('Full-Time'),
    dateOfEmployment: date('date_of_employment').notNull(),
    basicSalary: numeric('basic_salary', { precision: 12, scale: 2 }).notNull(),
    bankName: varchar('bank_name', { length: 100 }).notNull(),
    accountNumber: varchar('account_number', { length: 50 }).notNull(),
    accountName: varchar('account_name', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('Active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  table => ({
    employeeIdIdx: index('employees_employee_id_idx').on(table.employeeId),
    departmentIdx: index('employees_department_idx').on(table.departmentId),
    positionIdx: index('employees_position_idx').on(table.positionId),
    statusIdx: index('employees_status_idx').on(table.status)
  })
);

// ==================================================
// PHASE 3 & 4 TABLES: PAYROLL DATA & ENGINE SNAPSHOTS
// ==================================================

export const allowances = pgTable('allowances', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  calculationMethod: varchar('calculation_method', { length: 50 }).notNull().default('FIXED_AMOUNT'), // FIXED_AMOUNT | PERCENTAGE_OF_BASIC
  defaultValue: numeric('default_value', { precision: 12, scale: 2 }).notNull().default('0.00'),
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE | INACTIVE
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const employeeAllowances = pgTable(
  'employee_allowances',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
    allowanceId: uuid('allowance_id').notNull().references(() => allowances.id, { onDelete: 'cascade' }),
    overrideValue: numeric('override_value', { precision: 12, scale: 2 }),
    effectiveDate: date('effective_date').notNull(),
    endDate: date('end_date'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  table => ({
    employeeIdx: index('emp_allowances_emp_idx').on(table.employeeId),
    allowanceIdx: index('emp_allowances_allowance_idx').on(table.allowanceId)
  })
);

export const deductions = pgTable('deductions', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull().default('ORGANIZATION'), // STATUTORY | ORGANIZATION | LOAN | OTHER
  calculationMethod: varchar('calculation_method', { length: 50 }).notNull().default('PERCENTAGE_OF_BASIC'), // FIXED_AMOUNT | PERCENTAGE_OF_BASIC | MANUAL
  defaultValue: numeric('default_value', { precision: 12, scale: 2 }).notNull().default('0.00'),
  effectiveDate: date('effective_date'),
  status: varchar('status', { length: 50 }).notNull().default('PENDING_VERIFICATION'), // ACTIVE | INACTIVE | PENDING_VERIFICATION
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const employeeDeductions = pgTable(
  'employee_deductions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
    deductionId: uuid('deduction_id').notNull().references(() => deductions.id, { onDelete: 'cascade' }),
    overrideValue: numeric('override_value', { precision: 12, scale: 2 }),
    effectiveDate: date('effective_date').notNull(),
    endDate: date('end_date'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  table => ({
    employeeIdx: index('emp_deductions_emp_idx').on(table.employeeId),
    deductionIdx: index('emp_deductions_deduction_idx').on(table.deductionId)
  })
);

export const payrollPeriods = pgTable('payroll_periods', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  payDate: date('pay_date').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('OPEN'), // OPEN | PROCESSING | COMPLETED | CLOSED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const payrollRuns = pgTable(
  'payroll_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    payrollPeriodId: uuid('payroll_period_id').notNull().references(() => payrollPeriods.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull().default('PREVIEW'), // DRAFT | PREVIEW | CALCULATED | APPROVED | PAID | VOID
    isPreview: boolean('is_preview').notNull().default(true),
    basicSalarySnapshot: numeric('basic_salary_snapshot', { precision: 12, scale: 2 }).notNull().default('0.00'),
    totalAllowances: numeric('total_allowances', { precision: 12, scale: 2 }).notNull().default('0.00'),
    grossPay: numeric('gross_pay', { precision: 12, scale: 2 }).notNull().default('0.00'),
    totalDeductions: numeric('total_deductions', { precision: 12, scale: 2 }).notNull().default('0.00'),
    netPay: numeric('net_pay', { precision: 12, scale: 2 }).notNull().default('0.00'),
    calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
    finalizedAt: timestamp('finalized_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  table => ({
    periodIdx: index('payroll_runs_period_idx').on(table.payrollPeriodId),
    employeeIdx: index('payroll_runs_emp_idx').on(table.employeeId),
    uniqueActiveRunIdx: index('payroll_runs_unique_active_idx').on(table.payrollPeriodId, table.employeeId)
  })
);

export const payrollItems = pgTable(
  'payroll_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    payrollRunId: uuid('payroll_run_id').notNull().references(() => payrollRuns.id, { onDelete: 'cascade' }),
    itemType: varchar('item_type', { length: 50 }).notNull(), // BASIC | ALLOWANCE | DEDUCTION | TAX | OTHER
    itemName: varchar('item_name', { length: 255 }).notNull(),
    sourceType: varchar('source_type', { length: 100 }),
    sourceReferenceId: uuid('source_reference_id'),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    calculationMethodSnapshot: varchar('calculation_method_snapshot', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  table => ({
    runIdx: index('payroll_items_run_idx').on(table.payrollRunId)
  })
);

export const payrollRuleVersions = pgTable('payroll_rule_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  ruleCode: varchar('rule_code', { length: 50 }).notNull(),
  ruleName: varchar('rule_name', { length: 255 }).notNull(),
  ruleType: varchar('rule_type', { length: 50 }).notNull(), // STATUTORY_PAYE | STATUTORY_PENSION | STATUTORY_NHF | INSTITUTIONAL
  version: varchar('version', { length: 20 }).notNull().default('1.0.0'),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  configuration: text('configuration').notNull(),
  verificationStatus: varchar('verification_status', { length: 50 }).notNull().default('PENDING_VERIFICATION'), // DRAFT | PENDING_VERIFICATION | VERIFIED | RETIRED
  sourceReference: text('source_reference'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ==================================================
// PHASE 5 TABLES: AUTHENTICATION & AUDIT TRAIL
// ==================================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('PAYROLL_OFFICER'), // ADMIN | PAYROLL_OFFICER | VIEWER
  status: varchar('status', { length: 50 }).notNull().default('Active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventType: varchar('event_type', { length: 100 }).notNull(), // EMPLOYEE_CREATED, PAYROLL_CALCULATED, PERIOD_CLOSED etc.
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: varchar('entity_id', { length: 255 }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    details: text('details'),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  table => ({
    eventIdx: index('audit_logs_event_idx').on(table.eventType),
    userIdx: index('audit_logs_user_idx').on(table.userId)
  })
);

// Type Exports
export type DepartmentSelect = typeof departments.$inferSelect;
export type PositionSelect = typeof positions.$inferSelect;
export type EmployeeSelect = typeof employees.$inferSelect;
export type AllowanceSelect = typeof allowances.$inferSelect;
export type EmployeeAllowanceSelect = typeof employeeAllowances.$inferSelect;
export type DeductionSelect = typeof deductions.$inferSelect;
export type EmployeeDeductionSelect = typeof employeeDeductions.$inferSelect;
export type PayrollPeriodSelect = typeof payrollPeriods.$inferSelect;
export type PayrollRunSelect = typeof payrollRuns.$inferSelect;
export type PayrollItemSelect = typeof payrollItems.$inferSelect;
export type PayrollRuleVersionSelect = typeof payrollRuleVersions.$inferSelect;
export type UserSelect = typeof users.$inferSelect;
export type AuditLogSelect = typeof auditLogs.$inferSelect;
