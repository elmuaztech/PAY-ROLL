import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { sendJson, sendError } from './utils';
import { requireAuth } from '../src/auth/requireAuth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method || 'GET';

  // Require ADMIN or PAYROLL_OFFICER session for viewing audit logs
  const session = requireAuth(req, res, ['ADMIN', 'PAYROLL_OFFICER']);
  if (!session) return;

  const db = getDb();
  if (!db) {
    if (method === 'GET') return sendJson(res, 200, { source: 'unconfigured_fallback', data: [] });
    return sendError(res, 533, 'Database connection is not configured.', 'DATABASE_UNCONFIGURED');
  }

  try {
    if (method === 'GET') {
      const logs = await db.select().from(schema.auditLogs);
      return sendJson(res, 200, { source: 'neon_postgres', data: logs });
    }

    return sendError(res, 405, `Method ${method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  } catch (err: any) {
    console.error('API Error in /api/audit-logs:', err);
    return sendError(res, 500, 'Internal Server Error', 'SERVER_ERROR', err?.message);
  }
}
