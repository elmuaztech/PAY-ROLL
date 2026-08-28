import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { eq } from 'drizzle-orm';
import { parseJsonBody, sendJson, sendError } from './utils';
import { requireAuth } from '../src/auth/requireAuth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const employeeIdParam = url.searchParams.get('employeeId');

  const allowedRoles = method === 'GET' ? ['ADMIN', 'PAYROLL_OFFICER', 'VIEWER'] : ['ADMIN', 'PAYROLL_OFFICER'];
  const session = requireAuth(req, res, allowedRoles as any);
  if (!session) return;

  const db = getDb();
  if (!db) {
    if (method === 'GET') return sendJson(res, 200, { source: 'unconfigured_fallback', data: [] });
    return sendError(res, 533, 'Database connection is not configured.', 'DATABASE_UNCONFIGURED');
  }

  try {
    // GET: List employee deductions
    if (method === 'GET') {
      if (employeeIdParam) {
        const list = await db
          .select()
          .from(schema.employeeDeductions)
          .where(eq(schema.employeeDeductions.employeeId, employeeIdParam));
        return sendJson(res, 200, { source: 'neon_postgres', data: list });
      }
      const list = await db.select().from(schema.employeeDeductions);
      return sendJson(res, 200, { source: 'neon_postgres', data: list });
    }

    // POST: Assign deduction to employee
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.employeeId || !body.deductionId) {
        return sendError(res, 400, 'employeeId and deductionId are required.', 'VALIDATION_ERROR');
      }

      // Verify employee exists
      const emp = await db.select().from(schema.employees).where(eq(schema.employees.id, body.employeeId));
      if (emp.length === 0) return sendError(res, 404, 'Employee not found.', 'NOT_FOUND');

      // Verify deduction exists
      const ded = await db.select().from(schema.deductions).where(eq(schema.deductions.id, body.deductionId));
      if (ded.length === 0) return sendError(res, 404, 'Deduction rule not found.', 'NOT_FOUND');

      const overrideVal = body.overrideValue !== undefined ? parseFloat(body.overrideValue).toFixed(2) : null;

      const inserted = await db
        .insert(schema.employeeDeductions)
        .values({
          employeeId: body.employeeId,
          deductionId: body.deductionId,
          overrideValue: overrideVal,
          effectiveDate: body.effectiveDate || new Date().toISOString().split('T')[0],
          endDate: body.endDate || null,
          status: 'ACTIVE'
        })
        .returning();

      return sendJson(res, 201, { message: 'Deduction assigned to employee', data: inserted[0] });
    }

    // DELETE / PATCH: End/deactivate assignment
    if (method === 'DELETE' || method === 'PATCH') {
      const body = await parseJsonBody(req).catch(() => ({}));
      const id = body.id || url.searchParams.get('id');
      if (!id) return sendError(res, 400, 'Assignment ID is required.', 'VALIDATION_ERROR');

      const deactivated = await db
        .update(schema.employeeDeductions)
        .set({ status: 'INACTIVE', endDate: new Date().toISOString().split('T')[0], updatedAt: new Date() })
        .where(eq(schema.employeeDeductions.id, id))
        .returning();

      if (deactivated.length === 0) return sendError(res, 404, 'Assignment not found.', 'NOT_FOUND');
      return sendJson(res, 200, { message: 'Deduction assignment deactivated', data: deactivated[0] });
    }

    return sendError(res, 405, `Method ${method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  } catch (err: any) {
    console.error('API Error in /api/employee-deductions:', err);
    return sendError(res, 500, 'Internal Database Error', 'SERVER_ERROR', err?.message);
  }
}
