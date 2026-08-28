import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../../src/db';
import { eq } from 'drizzle-orm';
import { sendJson, sendError } from '../utils';
import { getAuthSession } from '../../src/auth/session';
import { sanitizeUserOutput } from '../../src/utils/masking';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');
  }

  const session = getAuthSession(req);
  if (!session) {
    return sendError(res, 401, 'Not authenticated', 'AUTHENTICATION_REQUIRED');
  }

  const db = getDb();
  if (!db) {
    return sendJson(res, 200, { user: session });
  }

  try {
    const usersList = await db.select().from(schema.users).where(eq(schema.users.id, session.userId));
    if (usersList.length === 0) {
      return sendError(res, 404, 'User profile not found', 'NOT_FOUND');
    }

    return sendJson(res, 200, { user: sanitizeUserOutput(usersList[0]) });
  } catch (err: any) {
    return sendJson(res, 200, { user: session });
  }
}
