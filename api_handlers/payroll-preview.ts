import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { eq } from 'drizzle-orm';
import { parseJsonBody, sendJson, sendError } from './utils';
import { runPayrollEngine } from '../src/payroll/engine/payrollCalculator';
import { requireAuth } from '../src/auth/requireAuth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');
  }

  // Server-side RBAC validation
  const session = requireAuth(req, res, ['ADMIN', 'PAYROLL_OFFICER']);
  if (!session) return;

  const db = getDb();
  if (!db) {
    return sendError(res, 533, 'Database connection is not configured.', 'DATABASE_UNCONFIGURED');
  }

  try {
    const body = await parseJsonBody(req);
    const { employeeId, payrollPeriodId } = body;

    if (!payrollPeriodId) {
      return sendError(res, 400, 'payrollPeriodId is required for preview.', 'VALIDATION_ERROR');
    }

    // Load Period
    const periods = await db.select().from(schema.payrollPeriods).where(eq(schema.payrollPeriods.id, payrollPeriodId));
    if (periods.length === 0) {
      return sendError(res, 404, 'Payroll period not found.', 'NOT_FOUND');
    }
    const period = periods[0];

    // Load Employees (Single or All Active)
    let employeesList: any[] = [];
    if (employeeId) {
      const found = await db.select().from(schema.employees).where(eq(schema.employees.id, employeeId));
      if (found.length === 0) return sendError(res, 404, 'Employee not found.', 'NOT_FOUND');
      employeesList = found;
    } else {
      employeesList = await db.select().from(schema.employees).where(eq(schema.employees.status, 'Active'));
    }

    // Load Rules & Assignments
    const [allwRules, allwAssigns, dedRules, dedAssigns, existingRuns] = await Promise.all([
      db.select().from(schema.allowances),
      db.select().from(schema.employeeAllowances),
      db.select().from(schema.deductions),
      db.select().from(schema.employeeDeductions),
      db.select().from(schema.payrollRuns).where(eq(schema.payrollRuns.payrollPeriodId, payrollPeriodId))
    ]);

    const previewResults = employeesList.map(emp =>
      runPayrollEngine(
        emp,
        period,
        allwRules,
        allwAssigns,
        dedRules,
        dedAssigns,
        existingRuns,
        true // isPreview = true
      )
    );

    return sendJson(res, 200, {
      message: 'Server-side payroll preview generated successfully',
      data: employeeId ? previewResults[0] : previewResults
    });
  } catch (err: any) {
    console.error('API Error in /api/payroll/preview:', err);
    return sendError(res, 500, 'Internal Server Error', 'SERVER_ERROR', err?.message);
  }
}
