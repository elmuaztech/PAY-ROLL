import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { eq } from 'drizzle-orm';
import { parseJsonBody, sendJson, sendError } from './utils';
import { requireAuth } from '../src/auth/requireAuth';
import { hashPassword } from '../src/auth/password';
import { sanitizeUserOutput } from '../src/utils/masking';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const idParam = url.searchParams.get('id');

  // Enforce ADMIN role requirement for user management
  const session = requireAuth(req, res, ['ADMIN']);
  if (!session) return;

  const db = getDb();
  if (!db) {
    return sendError(res, 533, 'Database connection is not configured.', 'DATABASE_UNCONFIGURED');
  }

  try {
    // GET: List users or fetch single user profile
    if (method === 'GET') {
      if (idParam) {
        const found = await db.select().from(schema.users).where(eq(schema.users.id, idParam));
        if (found.length === 0) return sendError(res, 404, 'User not found.', 'NOT_FOUND');
        return sendJson(res, 200, { source: 'neon_postgres', data: sanitizeUserOutput(found[0]) });
      }

      const list = await db.select().from(schema.users);
      return sendJson(res, 200, {
        source: 'neon_postgres',
        data: list.map(sanitizeUserOutput)
      });
    }

    // POST: Create new user (ADMIN ONLY)
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const { fullName, email, password, role } = body;

      if (!fullName || !email || !password) {
        return sendError(res, 400, 'Full name, email, and password are required.', 'VALIDATION_ERROR');
      }

      const hashedPassword = await hashPassword(password);
      const userRole = (role || 'PAYROLL_OFFICER').toUpperCase();

      const inserted = await db
        .insert(schema.users)
        .values({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          passwordHash: hashedPassword,
          role: userRole,
          status: 'Active'
        })
        .returning();

      const newUser = inserted[0];

      await db.insert(schema.auditLogs).values({
        eventType: 'USER_CREATED',
        entityType: 'USER',
        entityId: newUser.id,
        userId: session.userId,
        details: JSON.stringify({ email: newUser.email, role: newUser.role })
      });

      return sendJson(res, 201, { message: 'User created successfully.', data: sanitizeUserOutput(newUser) });
    }

    // PATCH: Update user status/role (ADMIN ONLY)
    if (method === 'PATCH') {
      const body = await parseJsonBody(req);
      const id = body.id || idParam;
      if (!id) return sendError(res, 400, 'User ID is required.', 'VALIDATION_ERROR');

      const existing = await db.select().from(schema.users).where(eq(schema.users.id, id));
      if (existing.length === 0) return sendError(res, 404, 'User not found.', 'NOT_FOUND');

      const targetUser = existing[0];

      // Prevent deactivating the last active ADMIN
      if (targetUser.role === 'ADMIN' && (body.status === 'Inactive' || body.role !== 'ADMIN')) {
        const adminUsers = await db.select().from(schema.users).where(eq(schema.users.role, 'ADMIN'));
        const activeAdmins = adminUsers.filter(u => u.status === 'Active' && u.id !== targetUser.id);
        if (activeAdmins.length === 0) {
          return sendError(
            res,
            409,
            'Cannot deactivate or downgrade the sole remaining active System Administrator.',
            'LAST_ADMIN_PROTECTION'
          );
        }
      }

      const updated = await db
        .update(schema.users)
        .set({
          fullName: body.fullName?.trim() || targetUser.fullName,
          role: body.role ? body.role.toUpperCase() : targetUser.role,
          status: body.status || targetUser.status,
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, id))
        .returning();

      await db.insert(schema.auditLogs).values({
        eventType: 'USER_UPDATED',
        entityType: 'USER',
        entityId: id,
        userId: session.userId,
        details: JSON.stringify({ role: body.role, status: body.status })
      });

      return sendJson(res, 200, { message: 'User updated successfully.', data: sanitizeUserOutput(updated[0]) });
    }

    return sendError(res, 405, `Method ${method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  } catch (err: any) {
    console.error('API Error in /api/users:', err);
    return sendError(res, 500, 'Internal Server Error', 'SERVER_ERROR', err?.message);
  }
}
