import type { IncomingMessage, ServerResponse } from 'http';
import { clearSessionCookie, getAuthSession } from '../src/auth/session';
import { sendJson, sendError } from './utils';
import { getDb, schema } from '../src/db';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');
  }

  try {
    const session = getAuthSession(req);
    const db = getDb();

    if (session && db) {
      await db.insert(schema.auditLogs).values({
        eventType: 'USER_LOGOUT',
        entityType: 'USER',
        entityId: session.userId,
        userId: session.userId,
        details: JSON.stringify({ email: session.email })
      });
    }

    clearSessionCookie(res);
    return sendJson(res, 200, { message: 'Logged out successfully.' });
  } catch (err: any) {
    clearSessionCookie(res);
    return sendJson(res, 200, { message: 'Logged out successfully.' });
  }
}
