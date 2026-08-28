import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { eq } from 'drizzle-orm';
import { parseJsonBody, sendJson, sendError } from './utils';
import { runPayrollEngine } from '../src/payroll/engine/payrollCalculator';
import { validateRunStatusTransition } from '../src/payroll/engine/runStatusStateMachine';
import { requireAuth } from '../src/auth/requireAuth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const idParam = url.searchParams.get('id');
  const periodIdParam = url.searchParams.get('payrollPeriodId');

  // Server-side RBAC authorization
  const allowedRoles = method === 'GET' ? ['ADMIN', 'PAYROLL_OFFICER', 'VIEWER'] : ['ADMIN', 'PAYROLL_OFFICER'];
  const session = requireAuth(req, res, allowedRoles as any);
  if (!session) return;

  const db = getDb();
  if (!db) {
    if (method === 'GET') return sendJson(res, 200, { source: 'unconfigured_fallback', data: [] });
    return sendError(res, 533, 'Database connection is not configured.', 'DATABASE_UNCONFIGURED');
  }

  try {
    // GET: List runs or fetch single run with detailed snapshot line items
    if (method === 'GET') {
      if (idParam) {
        const foundRun = await db.select().from(schema.payrollRuns).where(eq(schema.payrollRuns.id, idParam));
        if (foundRun.length === 0) return sendError(res, 404, 'Payroll run not found.', 'NOT_FOUND');
        const run = foundRun[0];

        const emp = await db.select().from(schema.employees).where(eq(schema.employees.id, run.employeeId));
        const period = await db.select().from(schema.payrollPeriods).where(eq(schema.payrollPeriods.id, run.payrollPeriodId));
        const items = await db.select().from(schema.payrollItems).where(eq(schema.payrollItems.payrollRunId, run.id));

        return sendJson(res, 200, {
          source: 'neon_postgres',
          data: {
            ...run,
            basicSalarySnapshot: parseFloat(run.basicSalarySnapshot),
            totalAllowances: parseFloat(run.totalAllowances),
            grossPay: parseFloat(run.grossPay),
            totalDeductions: parseFloat(run.totalDeductions),
            netPay: parseFloat(run.netPay),
            employee: emp[0] || null,
            period: period[0] || null,
            items: items.map(it => ({ ...it, amount: parseFloat(it.amount) }))
          }
        });
      }

      let listQuery = db.select().from(schema.payrollRuns);
      if (periodIdParam) {
        const list = await db.select().from(schema.payrollRuns).where(eq(schema.payrollRuns.payrollPeriodId, periodIdParam));
        return sendJson(res, 200, {
          source: 'neon_postgres',
          data: list.map(r => ({
            ...r,
            basicSalarySnapshot: parseFloat(r.basicSalarySnapshot),
            totalAllowances: parseFloat(r.totalAllowances),
            grossPay: parseFloat(r.grossPay),
            totalDeductions: parseFloat(r.totalDeductions),
            netPay: parseFloat(r.netPay)
          }))
        });
      }

      const list = await listQuery;
      return sendJson(res, 200, {
        source: 'neon_postgres',
        data: list.map(r => ({
          ...r,
          basicSalarySnapshot: parseFloat(r.basicSalarySnapshot),
          totalAllowances: parseFloat(r.totalAllowances),
          grossPay: parseFloat(r.grossPay),
          totalDeductions: parseFloat(r.totalDeductions),
          netPay: parseFloat(r.netPay)
        }))
      });
    }

    // POST: Create and persist payroll runs inside a DATABASE TRANSACTION
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const { payrollPeriodId, employeeId, isPreview } = body;

      if (!payrollPeriodId) {
        return sendError(res, 400, 'payrollPeriodId is required.', 'VALIDATION_ERROR');
      }

      const periods = await db.select().from(schema.payrollPeriods).where(eq(schema.payrollPeriods.id, payrollPeriodId));
      if (periods.length === 0) return sendError(res, 404, 'Payroll period not found.', 'NOT_FOUND');
      const period = periods[0];

      if (period.status === 'CLOSED' || period.status === 'Closed') {
        return sendError(res, 409, 'Payroll period is CLOSED and immutable. Calculations cannot be saved.', 'PERIOD_CLOSED');
      }

      let employeesList: any[] = [];
      if (employeeId) {
        const found = await db.select().from(schema.employees).where(eq(schema.employees.id, employeeId));
        if (found.length === 0) return sendError(res, 404, 'Employee not found.', 'NOT_FOUND');
        employeesList = found;
      } else {
        employeesList = await db.select().from(schema.employees).where(eq(schema.employees.status, 'Active'));
      }

      const [allwRules, allwAssigns, dedRules, dedAssigns, existingRuns] = await Promise.all([
        db.select().from(schema.allowances),
        db.select().from(schema.employeeAllowances),
        db.select().from(schema.deductions),
        db.select().from(schema.employeeDeductions),
        db.select().from(schema.payrollRuns).where(eq(schema.payrollRuns.payrollPeriodId, payrollPeriodId))
      ]);

      const createdRuns: any[] = [];

      // EXECUTE TRANSACTION ATOMICITY
      await db.transaction(async tx => {
        for (const emp of employeesList) {
          const calcResult = runPayrollEngine(
            emp,
            period,
            allwRules,
            allwAssigns,
            dedRules,
            dedAssigns,
            existingRuns,
            Boolean(isPreview)
          );

          if (!calcResult.success) {
            throw new Error(`Calculation error for ${emp.firstName} ${emp.lastName}: ${calcResult.errors[0]?.message}`);
          }

          // Insert Payroll Run Snapshot
          const insertedRun = await tx
            .insert(schema.payrollRuns)
            .values({
              payrollPeriodId: period.id,
              employeeId: emp.id,
              status: isPreview ? 'PREVIEW' : 'CALCULATED',
              isPreview: Boolean(isPreview),
              basicSalarySnapshot: calcResult.basicSalary.toFixed(2),
              totalAllowances: calcResult.totalAllowances.toFixed(2),
              grossPay: calcResult.grossPay.toFixed(2),
              totalDeductions: calcResult.totalDeductions.toFixed(2),
              netPay: calcResult.netPay.toFixed(2),
              calculatedAt: new Date(),
              finalizedAt: !isPreview ? new Date() : null
            })
            .returning();

          const runRecord = insertedRun[0];

          // Insert Payroll Item Snapshots
          if (calcResult.items.length > 0) {
            const itemValues = calcResult.items.map(item => ({
              payrollRunId: runRecord.id,
              itemType: item.itemType,
              itemName: item.itemName,
              sourceType: item.sourceType,
              sourceReferenceId: item.sourceReferenceId || null,
              amount: item.amount.toFixed(2),
              calculationMethodSnapshot: item.calculationMethodSnapshot || null
            }));

            await tx.insert(schema.payrollItems).values(itemValues);
          }

          createdRuns.push({
            ...runRecord,
            basicSalarySnapshot: calcResult.basicSalary,
            totalAllowances: calcResult.totalAllowances,
            grossPay: calcResult.grossPay,
            totalDeductions: calcResult.totalDeductions,
            netPay: calcResult.netPay,
            items: calcResult.items,
            warnings: calcResult.warnings
          });
        }

        // Transition period status to PROCESSING if OPEN
        if (period.status === 'OPEN') {
          await tx
            .update(schema.payrollPeriods)
            .set({ status: 'PROCESSING', updatedAt: new Date() })
            .where(eq(schema.payrollPeriods.id, period.id));
        }
      });

      // Audit Log Creation
      await db.insert(schema.auditLogs).values({
        eventType: 'PAYROLL_CALCULATED',
        entityType: 'PAYROLL_RUN',
        entityId: payrollPeriodId,
        userId: session.userId,
        details: JSON.stringify({ count: createdRuns.length, isPreview: Boolean(isPreview) })
      });

      return sendJson(res, 201, {
        message: 'Payroll calculations persisted successfully within database transaction.',
        data: employeeId ? createdRuns[0] : createdRuns
      });
    }

    // PATCH: Status transitions with server-side state machine validation
    if (method === 'PATCH') {
      const body = await parseJsonBody(req);
      const id = body.id || idParam;
      if (!id) return sendError(res, 400, 'Payroll Run ID is required.', 'VALIDATION_ERROR');

      const targetStatus = body.status;
      if (!targetStatus) return sendError(res, 400, 'Target status is required.', 'VALIDATION_ERROR');

      const currentRun = await db.select().from(schema.payrollRuns).where(eq(schema.payrollRuns.id, id));
      if (currentRun.length === 0) return sendError(res, 404, 'Payroll run not found.', 'NOT_FOUND');

      const runRecord = currentRun[0];

      // State machine validation check
      const transitionCheck = validateRunStatusTransition(runRecord.status, targetStatus);
      if (!transitionCheck.isValid) {
        return sendError(res, 409, transitionCheck.errorMessage || 'Invalid status transition.', 'INVALID_STATE_TRANSITION');
      }

      // Special authorization checks for approval & paid status changes
      if (targetStatus.toUpperCase() === 'APPROVED' || targetStatus.toUpperCase() === 'PAID') {
        if (session.role !== 'ADMIN' && session.role !== 'PAYROLL_OFFICER') {
          return sendError(res, 403, 'Insufficient permissions to approve or pay payroll.', 'AUTHORIZATION_DENIED');
        }
      }

      const updated = await db
        .update(schema.payrollRuns)
        .set({ status: targetStatus.toUpperCase(), updatedAt: new Date() })
        .where(eq(schema.payrollRuns.id, id))
        .returning();

      // Audit log status transition
      await db.insert(schema.auditLogs).values({
        eventType: `PAYROLL_STATUS_${targetStatus.toUpperCase()}`,
        entityType: 'PAYROLL_RUN',
        entityId: id,
        userId: session.userId,
        details: JSON.stringify({ previousStatus: runRecord.status, newStatus: targetStatus.toUpperCase() })
      });

      return sendJson(res, 200, { message: `Payroll run status updated to ${targetStatus}`, data: updated[0] });
    }

    return sendError(res, 405, `Method ${method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  } catch (err: any) {
    console.error('API Error in /api/payroll/runs:', err);
    return sendError(res, 500, 'Internal Server Error / Transaction Failed', 'SERVER_ERROR', err?.message);
  }
}
