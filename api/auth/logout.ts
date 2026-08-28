import type { IncomingMessage, ServerResponse } from 'http';
import { sendJson, sendError } from '../utils';
import { clearSessionCookie, getAuthSession } from '../../src/auth/session';
import { getDb, schema } from '../../src/db';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');
  }

  const session = getAuthSession(req);
  clearSessionCookie(res);

  if (session) {
    const db = getDb();
    if (db) {
      await db.insert(schema.auditLogs).values({
        eventType: 'USER_LOGOUT',
        entityType: 'USER',
        entityId: session.userId,
        userId: session.userId,
        details: JSON.stringify({ email: session.email })
      }).catch(() => {});
    }
  }

  return sendJson(res, 200, { message: 'Logged out successfully.' });
}
