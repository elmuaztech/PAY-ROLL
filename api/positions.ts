import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { eq } from 'drizzle-orm';
import { parseJsonBody, sendJson, sendError } from './utils';
import { requireAuth } from '../src/auth/requireAuth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const idParam = url.searchParams.get('id');
  const departmentIdParam = url.searchParams.get('departmentId');

  // RBAC: GET viewable by all authenticated users, modifications require ADMIN
  const allowedRoles = method === 'GET' ? ['ADMIN', 'PAYROLL_OFFICER', 'VIEWER'] : ['ADMIN'];
  const session = requireAuth(req, res, allowedRoles as any);
  if (!session) return;

  const db = getDb();
  if (!db) {
    if (method === 'GET') return sendJson(res, 200, { source: 'unconfigured_fallback', data: [] });
    return sendError(res, 533, 'Database connection is not configured.', 'DATABASE_UNCONFIGURED');
  }

  try {
    if (method === 'GET') {
      if (idParam) {
        const found = await db.select().from(schema.positions).where(eq(schema.positions.id, idParam));
        if (found.length === 0) return sendError(res, 404, 'Position not found.', 'NOT_FOUND');
        return sendJson(res, 200, { source: 'neon_postgres', data: found[0] });
      }

      if (departmentIdParam) {
        const list = await db.select().from(schema.positions).where(eq(schema.positions.departmentId, departmentIdParam));
        return sendJson(res, 200, { source: 'neon_postgres', data: list });
      }

      const list = await db.select().from(schema.positions);
      return sendJson(res, 200, { source: 'neon_postgres', data: list });
    }

    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const title = (body.title || '').trim();

      if (!title) return sendError(res, 400, 'Position title is required.', 'VALIDATION_ERROR');

      const inserted = await db
        .insert(schema.positions)
        .values({
          title,
          departmentId: body.departmentId || null,
          gradeLevel: body.gradeLevel ? body.gradeLevel.trim() : null,
          description: body.description ? body.description.trim() : null
        })
        .returning();

      return sendJson(res, 201, { message: 'Position created successfully.', data: inserted[0] });
    }

    if (method === 'PUT') {
      const body = await parseJsonBody(req);
      const id = body.id || idParam;
      if (!id) return sendError(res, 400, 'Position ID is required.', 'VALIDATION_ERROR');

      const existing = await db.select().from(schema.positions).where(eq(schema.positions.id, id));
      if (existing.length === 0) return sendError(res, 404, 'Position not found.', 'NOT_FOUND');

      const updated = await db
        .update(schema.positions)
        .set({
          title: body.title ? body.title.trim() : existing[0].title,
          departmentId: body.departmentId !== undefined ? body.departmentId : existing[0].departmentId,
          gradeLevel: body.gradeLevel !== undefined ? body.gradeLevel.trim() : existing[0].gradeLevel,
          description: body.description !== undefined ? body.description.trim() : existing[0].description,
          updatedAt: new Date()
        })
        .where(eq(schema.positions.id, id))
        .returning();

      return sendJson(res, 200, { message: 'Position updated successfully.', data: updated[0] });
    }

    if (method === 'DELETE') {
      const id = idParam || (await parseJsonBody(req)).id;
      if (!id) return sendError(res, 400, 'Position ID is required.', 'VALIDATION_ERROR');

      const assignedEmployees = await db.select().from(schema.employees).where(eq(schema.employees.positionId, id));
      if (assignedEmployees.length > 0) {
        return sendError(res, 409, 'This position cannot be deleted because employees are assigned to it.', 'RESOURCE_IN_USE');
      }

      await db.delete(schema.positions).where(eq(schema.positions.id, id));
      return sendJson(res, 200, { message: 'Position deleted successfully.' });
    }

    return sendError(res, 405, `Method ${method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  } catch (err: any) {
    console.error('API Error in /api/positions:', err);
    return sendError(res, 500, 'Internal Server Error', 'SERVER_ERROR', err?.message);
  }
}
