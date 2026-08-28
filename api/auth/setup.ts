import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../../src/db';
import { parseJsonBody, sendJson, sendError } from '../utils';
import { hashPassword } from '../../src/auth/password';
import { sanitizeUserOutput } from '../../src/utils/masking';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED');
  }

  const db = getDb();
  if (!db) {
    return sendError(res, 533, 'Database connection is not configured.', 'DATABASE_UNCONFIGURED');
  }

  try {
    const existingUsers = await db.select().from(schema.users);
    const body = await parseJsonBody(req);

    // If users already exist, public setup is strictly closed. Additional users must be created via Admin User Management.
    if (existingUsers.length > 0) {
      return sendError(
        res,
        403,
        'Initial administrator setup is closed. Users already exist in the system.',
        'SETUP_CLOSED'
      );
    }

    // Protect initial setup with environment variable secret if configured
    const setupSecretEnv = process.env.INITIAL_ADMIN_SETUP_SECRET;
    if (setupSecretEnv) {
      const providedSecret = body.setupSecret || body.secret;
      if (!providedSecret || providedSecret !== setupSecretEnv) {
        return sendError(
          res,
          403,
          'Invalid or missing setup secret token for initial administrator creation.',
          'AUTHORIZATION_DENIED'
        );
      }
    }

    const { fullName, email, password } = body;
    if (!fullName || !email || !password) {
      return sendError(res, 400, 'Full name, email, and password are required.', 'VALIDATION_ERROR');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters long.', 'VALIDATION_ERROR');
    }

    const hashedPassword = await hashPassword(password);

    const inserted = await db
      .insert(schema.users)
      .values({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: hashedPassword,
        role: 'ADMIN',
        status: 'Active'
      })
      .returning();

    const createdAdmin = inserted[0];

    // Log admin creation safely (without logging secrets or passwords)
    await db.insert(schema.auditLogs).values({
      eventType: 'INITIAL_ADMIN_CREATED',
      entityType: 'USER',
      entityId: createdAdmin.id,
      details: JSON.stringify({ email: createdAdmin.email, role: 'ADMIN' })
    });

    return sendJson(res, 201, {
      message: 'First System Administrator initialized successfully.',
      user: sanitizeUserOutput(createdAdmin)
    });
  } catch (err: any) {
    console.error('API Error in /api/auth/setup:', err);
    return sendError(res, 500, 'Internal Server Error during setup', 'SERVER_ERROR', err?.message);
  }
}
