import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { eq } from 'drizzle-orm';
import { parseJsonBody, sendJson, sendError } from './utils';
import { hashPassword } from '../src/auth/password';
import { getStoredResetCode, clearResetCode } from './auth-forgot-password';

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
    const { email, resetCode, newPassword } = body;

    if (!email || !resetCode || !newPassword) {
      return sendError(res, 400, 'Email, reset code, and new password are required.', 'VALIDATION_ERROR');
    }

    if (newPassword.length < 6) {
      return sendError(res, 400, 'New password must be at least 6 characters long.', 'VALIDATION_ERROR');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify stored reset code
    const storedCode = getStoredResetCode(normalizedEmail);
    if (!storedCode || storedCode !== resetCode.trim()) {
      return sendError(res, 400, 'Invalid or expired verification code.', 'INVALID_RESET_CODE');
    }

    const usersList = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail));

    if (usersList.length === 0) {
      return sendError(res, 404, 'User not found.', 'USER_NOT_FOUND');
    }

    const user = usersList[0];

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update user password in PostgreSQL
    await db
      .update(schema.users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, user.id));

    clearResetCode(normalizedEmail);

    // Audit log reset success
    await db.insert(schema.auditLogs).values({
      eventType: 'PASSWORD_RESET_SUCCESS',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      details: JSON.stringify({ email: user.email })
    });

    return sendJson(res, 200, {
      message: 'Password updated successfully. You can now sign in with your new password.'
    });
  } catch (err: any) {
    console.error('API Error in auth-reset-password:', err);
    return sendError(res, 500, 'Internal server error while resetting password', 'SERVER_ERROR', err?.message);
  }
}
