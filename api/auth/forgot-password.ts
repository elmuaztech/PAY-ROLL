import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../../src/db';
import { eq } from 'drizzle-orm';
import { parseJsonBody, sendJson, sendError } from '../utils';

// In-memory token storage for reset verification codes (key: email, value: { code, expiresAt })
const resetCodesMap = new Map<string, { code: string; expiresAt: number }>();

export function getStoredResetCode(email: string) {
  const record = resetCodesMap.get(email.toLowerCase());
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    resetCodesMap.delete(email.toLowerCase());
    return null;
  }
  return record.code;
}

export function clearResetCode(email: string) {
  resetCodesMap.delete(email.toLowerCase());
}

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
    const { email } = body;

    if (!email || !email.trim()) {
      return sendError(res, 400, 'Email address is required.', 'VALIDATION_ERROR');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const usersList = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail));

    if (usersList.length === 0) {
      return sendError(res, 404, 'No account registered with this email address.', 'USER_NOT_FOUND');
    }

    const user = usersList[0];

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes expiry

    resetCodesMap.set(normalizedEmail, { code: resetCode, expiresAt });

    // Audit log request
    await db.insert(schema.auditLogs).values({
      eventType: 'PASSWORD_RESET_REQUESTED',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      details: JSON.stringify({ email: user.email })
    });

    return sendJson(res, 200, {
      message: `Verification code generated successfully. For testing/demo, your code is ${resetCode}`,
      email: normalizedEmail,
      resetCode // Provided for quick copy/autofill in UI
    });
  } catch (err: any) {
    console.error('API Error in /api/auth/forgot-password:', err);
    return sendError(res, 500, 'Internal server error while requesting password reset', 'SERVER_ERROR', err?.message);
  }
}
