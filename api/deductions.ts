import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { eq } from 'drizzle-orm';
import { parseJsonBody, sendJson, sendError } from './utils';
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
    if (method === 'GET') {
      if (idParam) {
        const found = await db.select().from(schema.deductions).where(eq(schema.deductions.id, idParam));
        if (found.length === 0) return sendError(res, 404, 'Deduction rule not found.', 'NOT_FOUND');
        return sendJson(res, 200, { source: 'neon_postgres', data: { ...found[0], defaultValue: parseFloat(found[0].defaultValue) } });
      }

      const list = await db.select().from(schema.deductions);
      return sendJson(res, 200, { source: 'neon_postgres', data: list.map(d => ({ ...d, defaultValue: parseFloat(d.defaultValue) })) });
    }

    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const name = (body.name || '').trim();
      if (!name) return sendError(res, 400, 'Deduction rule name is required.', 'VALIDATION_ERROR');

      const code = (body.code || name.replace(/\s+/g, '_').toUpperCase()).slice(0, 50);

      const inserted = await db
        .insert(schema.deductions)
        .values({
          code,
          name,
          description: body.description ? body.description.trim() : null,
          category: body.category || 'ORGANIZATION',
          calculationMethod: body.calculationMethod || 'PERCENTAGE_OF_BASIC',
          defaultValue: parseFloat(body.defaultValue || 0).toFixed(2),
          status: body.status || 'PENDING_VERIFICATION',
          notes: body.notes ? body.notes.trim() : null
        })
        .returning();

      return sendJson(res, 201, { message: 'Deduction rule created', data: { ...inserted[0], defaultValue: parseFloat(inserted[0].defaultValue) } });
    }

    return sendError(res, 405, `Method ${method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  } catch (err: any) {
    console.error('API Error in /api/deductions:', err);
    return sendError(res, 500, 'Internal Server Error', 'SERVER_ERROR', err?.message);
  }
}
