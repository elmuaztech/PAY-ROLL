import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { eq } from 'drizzle-orm';
import { parseJsonBody, sendJson, sendError } from './utils';
import { validatePeriodStateTransition } from '../src/payroll/engine/periodStateMachine';
import { requireAuth } from '../src/auth/requireAuth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const idParam = url.searchParams.get('id');

  const allowedRoles = method === 'GET' ? ['ADMIN', 'PAYROLL_OFFICER', 'VIEWER'] : ['ADMIN', 'PAYROLL_OFFICER'];
  const session = requireAuth(req, res, allowedRoles as any);
  if (!session) return;

  const db = getDb();
  if (!db) {
    if (method === 'GET') return sendJson(res, 200, { source: 'unconfigured_fallback', data: [] });
    return sendError(res, 533, 'Database connection is not configured.', 'DATABASE_UNCONFIGURED');
  }

  try {
    // GET: List or read single payroll period
    if (method === 'GET') {
      if (idParam) {
        const found = await db.select().from(schema.payrollPeriods).where(eq(schema.payrollPeriods.id, idParam));
        if (found.length === 0) return sendError(res, 404, 'Payroll period not found.', 'NOT_FOUND');
        return sendJson(res, 200, { source: 'neon_postgres', data: found[0] });
      }

      const list = await db.select().from(schema.payrollPeriods);
      return sendJson(res, 200, { source: 'neon_postgres', data: list });
    }

    // POST: Create payroll period
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const name = (body.name || '').trim();
      if (!name) return sendError(res, 400, 'Payroll period name is required.', 'VALIDATION_ERROR');
      if (!body.periodStart || !body.periodEnd) {
        return sendError(res, 400, 'Start date and End date are required.', 'VALIDATION_ERROR');
      }

      const start = new Date(body.periodStart);
      const end = new Date(body.periodEnd);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return sendError(res, 400, 'Invalid date format.', 'VALIDATION_ERROR');
      }

      if (start >= end) {
        return sendError(res, 400, 'Period start date must precede end date.', 'VALIDATION_ERROR');
      }

      const inserted = await db
        .insert(schema.payrollPeriods)
        .values({
          name,
          periodStart: body.periodStart,
          periodEnd: body.periodEnd,
          payDate: body.payDate || body.periodEnd,
          status: body.status || 'OPEN'
        })
        .returning();

      return sendJson(res, 201, { message: 'Payroll period created', data: inserted[0] });
    }

    // PUT / PATCH: Update payroll period with state machine validation
    if (method === 'PUT' || method === 'PATCH') {
      const body = await parseJsonBody(req);
      const id = body.id || idParam;
      if (!id) return sendError(res, 400, 'Payroll period ID is required.', 'VALIDATION_ERROR');

      const existing = await db.select().from(schema.payrollPeriods).where(eq(schema.payrollPeriods.id, id));
      if (existing.length === 0) return sendError(res, 404, 'Payroll period not found.', 'NOT_FOUND');

      const currentPeriod = existing[0];
      const targetStatus = body.status || currentPeriod.status;

      // Period state machine transition check
      const transitionCheck = validatePeriodStateTransition(currentPeriod.status, targetStatus);
      if (!transitionCheck.isValid) {
        return sendError(res, 409, transitionCheck.errorMessage || 'Invalid period state transition.', 'INVALID_STATE_TRANSITION');
      }

      const updated = await db
        .update(schema.payrollPeriods)
        .set({
          name: body.name?.trim(),
          periodStart: body.periodStart,
          periodEnd: body.periodEnd,
          payDate: body.payDate,
          status: targetStatus.toUpperCase(),
          updatedAt: new Date()
        })
        .where(eq(schema.payrollPeriods.id, id))
        .returning();

      return sendJson(res, 200, { message: 'Payroll period updated', data: updated[0] });
    }

    return sendError(res, 405, `Method ${method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  } catch (err: any) {
    console.error('API Error in /api/payroll-periods:', err);
    return sendError(res, 500, 'Internal Database Error', 'SERVER_ERROR', err?.message);
  }
}
