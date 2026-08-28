import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { eq } from 'drizzle-orm';
import { sendJson, sendError } from './utils';
import { getAuthSession } from '../src/auth/session';
import { sanitizeUserOutput } from '../src/utils/masking';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');
  }

  const session = getAuthSession(req);
  if (!session) {
    return sendError(res, 401, 'Unauthorized session', 'UNAUTHORIZED');
  }

  const db = getDb();
  if (!db) {
    return sendError(res, 533, 'Database connection is not configured.', 'DATABASE_UNCONFIGURED');
  }

  try {
    const usersList = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, session.userId));

    if (usersList.length === 0) {
      return sendError(res, 404, 'User account not found', 'USER_NOT_FOUND');
    }

    const user = usersList[0];
    return sendJson(res, 200, {
      user: sanitizeUserOutput(user)
    });
  } catch (err: any) {
    console.error('API Error in me:', err);
    return sendError(res, 500, 'Internal Server Error', 'SERVER_ERROR', err?.message);
  }
}
