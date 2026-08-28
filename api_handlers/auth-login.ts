import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { eq } from 'drizzle-orm';
import { parseJsonBody, sendJson, sendError } from './utils';
import { verifyPassword } from '../src/auth/password';
import { createSessionToken, setSessionCookie } from '../src/auth/session';
import { sanitizeUserOutput } from '../src/utils/masking';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');
  }

  const db = getDb();
  if (!db) {
    return sendError(res, 533, 'Database connection is not configured.', 'DATABASE_UNCONFIGURED');
  }

  try {
    const body = await parseJsonBody(req);
    const { email, password } = body;

    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required.', 'VALIDATION_ERROR');
    }

    const usersList = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.trim().toLowerCase()));

    if (usersList.length === 0) {
      return sendError(res, 401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const user = usersList[0];

    if (user.status !== 'Active' && user.status !== 'ACTIVE') {
      return sendError(res, 403, 'Account is inactive. Contact Administrator.', 'ACCOUNT_INACTIVE');
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return sendError(res, 401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    // Create session token and set HTTP-only cookie
    const token = createSessionToken(user);
    setSessionCookie(res, token);

    // Audit log login success
    await db.insert(schema.auditLogs).values({
      eventType: 'USER_LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      details: JSON.stringify({ email: user.email, role: user.role })
    });

    return sendJson(res, 200, {
      message: 'Login successful.',
      user: sanitizeUserOutput(user),
      token
    });
  } catch (err: any) {
    console.error('API Error in login:', err);
    return sendError(res, 500, 'Internal Server Error during login', 'SERVER_ERROR', err?.message);
  }
}
