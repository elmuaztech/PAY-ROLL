import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { eq } from 'drizzle-orm';
import { parseJsonBody, sendJson, sendError } from './utils';
import { requireAuth } from '../src/auth/requireAuth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const idParam = url.searchParams.get('id');

  // RBAC: GET is viewable by all authenticated users, modifications require ADMIN
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
        const found = await db.select().from(schema.departments).where(eq(schema.departments.id, idParam));
        if (found.length === 0) return sendError(res, 404, 'Department not found.', 'NOT_FOUND');
        return sendJson(res, 200, { source: 'neon_postgres', data: found[0] });
      }

      const list = await db.select().from(schema.departments);
      return sendJson(res, 200, { source: 'neon_postgres', data: list });
    }

    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const code = (body.code || '').trim().toUpperCase();
      const name = (body.name || '').trim();

      if (!code || !name) {
        return sendError(res, 400, 'Department code and name are required.', 'VALIDATION_ERROR');
      }

      const existingCode = await db.select().from(schema.departments).where(eq(schema.departments.code, code));
      if (existingCode.length > 0) {
        return sendError(res, 409, `Department with code '${code}' already exists.`, 'DUPLICATE_ENTRY');
      }

      const inserted = await db
        .insert(schema.departments)
        .values({
          code,
          name,
          description: body.description ? body.description.trim() : null
        })
        .returning();

      await db.insert(schema.auditLogs).values({
        eventType: 'DEPARTMENT_CREATED',
        entityType: 'DEPARTMENT',
        entityId: inserted[0].id,
        userId: session.userId,
        details: JSON.stringify({ code, name })
      });

      return sendJson(res, 201, { message: 'Department created successfully.', data: inserted[0] });
    }

    if (method === 'PUT') {
      const body = await parseJsonBody(req);
      const id = body.id || idParam;
      if (!id) return sendError(res, 400, 'Department ID is required.', 'VALIDATION_ERROR');

      const existing = await db.select().from(schema.departments).where(eq(schema.departments.id, id));
      if (existing.length === 0) return sendError(res, 404, 'Department not found.', 'NOT_FOUND');

      const updated = await db
        .update(schema.departments)
        .set({
          code: body.code ? body.code.trim().toUpperCase() : existing[0].code,
          name: body.name ? body.name.trim() : existing[0].name,
          description: body.description !== undefined ? body.description.trim() : existing[0].description,
          updatedAt: new Date()
        })
        .where(eq(schema.departments.id, id))
        .returning();

      return sendJson(res, 200, { message: 'Department updated successfully.', data: updated[0] });
    }

    if (method === 'DELETE') {
      const id = idParam || (await parseJsonBody(req)).id;
      if (!id) return sendError(res, 400, 'Department ID is required.', 'VALIDATION_ERROR');

      const deptPositions = await db.select().from(schema.positions).where(eq(schema.positions.departmentId, id));
      if (deptPositions.length > 0) {
        return sendError(res, 409, 'This department cannot be deleted because it is currently in use by active positions.', 'RESOURCE_IN_USE');
      }

      const deptEmployees = await db.select().from(schema.employees).where(eq(schema.employees.departmentId, id));
      if (deptEmployees.length > 0) {
        return sendError(res, 409, 'This department cannot be deleted because it is currently in use by active employees.', 'RESOURCE_IN_USE');
      }

      await db.delete(schema.departments).where(eq(schema.departments.id, id));

      await db.insert(schema.auditLogs).values({
        eventType: 'DEPARTMENT_DELETED',
        entityType: 'DEPARTMENT',
        entityId: id,
        userId: session.userId,
        details: JSON.stringify({ id })
      });

      return sendJson(res, 200, { message: 'Department deleted successfully.' });
    }

    return sendError(res, 405, `Method ${method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  } catch (err: any) {
    console.error('API Error in /api/departments:', err);
    return sendError(res, 500, 'Internal Server Error', 'SERVER_ERROR', err?.message);
  }
}
