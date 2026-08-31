import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { parseJsonBody, sendJson, sendError } from './utils';
import { hashPassword } from '../src/auth/password';
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
    const { fullName, email, password, setupSecret } = body;

    const existingUsers = await db.select().from(schema.users);
    if (existingUsers.length > 0) {
      const expectedSecret = process.env.INITIAL_ADMIN_SETUP_SECRET || 'admin_setup_secret_2026';

      if (!setupSecret || setupSecret !== expectedSecret) {
        return sendError(
          res,
          403,
          'Initial system administrator setup is closed because user accounts already exist.',
          'SETUP_CLOSED'
        );
      }
    }

    if (!fullName || !email || !password) {
      return sendError(res, 400, 'Full Name, email, and password are required.', 'VALIDATION_ERROR');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters long.', 'VALIDATION_ERROR');
    }

    const passwordHash = await hashPassword(password);

    const newUser = await db
      .insert(schema.users)
      .values({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: 'ADMIN',
        status: 'Active'
      })
      .returning();

    const createdUser = newUser[0];

    const token = createSessionToken(createdUser);
    setSessionCookie(res, token);

    await db.insert(schema.auditLogs).values({
      eventType: 'INITIAL_ADMIN_SETUP',
      entityType: 'USER',
      entityId: createdUser.id,
      userId: createdUser.id,
      details: JSON.stringify({ email: createdUser.email, role: createdUser.role })
    });

    return sendJson(res, 201, {
      message: 'System administrator setup successfully completed.',
      user: sanitizeUserOutput(createdUser),
      token
    });
  } catch (err: any) {
    console.error('API Error in auth-setup:', err);
    return sendError(res, 500, 'Internal Server Error during setup', 'SERVER_ERROR', err?.message);
  }
}
