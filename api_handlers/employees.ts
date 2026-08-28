import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { eq } from 'drizzle-orm';
import { parseJsonBody, sendJson, sendError } from './utils';
import { requireAuth } from '../src/auth/requireAuth';
import { maskAccountNumber } from '../src/utils/masking';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const idParam = url.searchParams.get('id');

  // Server-side RBAC validation
  const allowedRoles = method === 'GET' ? ['ADMIN', 'PAYROLL_OFFICER', 'VIEWER'] : ['ADMIN', 'PAYROLL_OFFICER'];
  const session = requireAuth(req, res, allowedRoles as any);
  if (!session) return;

  const db = getDb();
  if (!db) {
    if (method === 'GET') return sendJson(res, 200, { source: 'unconfigured_fallback', data: [] });
    return sendError(res, 533, 'Database connection is not configured.', 'DATABASE_UNCONFIGURED');
  }

  try {
    // GET: List or fetch single employee
    if (method === 'GET') {
      if (idParam) {
        const found = await db.select().from(schema.employees).where(eq(schema.employees.id, idParam));
        if (found.length === 0) return sendError(res, 404, 'Employee not found.', 'NOT_FOUND');
        const emp = found[0];
        const isAuthorizedToSeeFullAccount = session.role === 'ADMIN' || session.role === 'PAYROLL_OFFICER';
        return sendJson(res, 200, {
          source: 'neon_postgres',
          data: {
            ...emp,
            basicSalary: parseFloat(emp.basicSalary),
            accountNumber: isAuthorizedToSeeFullAccount ? emp.accountNumber : maskAccountNumber(emp.accountNumber)
          }
        });
      }

      const list = await db.select().from(schema.employees);
      const isAuthorizedToSeeFullAccount = session.role === 'ADMIN' || session.role === 'PAYROLL_OFFICER';
      return sendJson(res, 200, {
        source: 'neon_postgres',
        data: list.map(item => ({
          ...item,
          basicSalary: parseFloat(item.basicSalary),
          accountNumber: isAuthorizedToSeeFullAccount ? item.accountNumber : maskAccountNumber(item.accountNumber)
        }))
      });
    }

    // POST: Register new employee
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const {
        employeeId,
        firstName,
        lastName,
        otherName,
        email,
        phoneNumber,
        department,
        position,
        employmentType,
        dateOfEmployment,
        basicSalary,
        bankName,
        accountNumber,
        accountName
      } = body;

      if (!employeeId || !firstName || !lastName || !email || !phoneNumber || !bankName || !accountNumber || !accountName) {
        return sendError(res, 400, 'Missing required employee fields.', 'VALIDATION_ERROR');
      }

      const salaryNumeric = parseFloat(basicSalary);
      if (isNaN(salaryNumeric) || salaryNumeric < 0) {
        return sendError(res, 400, 'Basic salary must be a positive number.', 'VALIDATION_ERROR');
      }

      if (accountNumber.length < 10) {
        return sendError(res, 400, 'NUBAN account number must be at least 10 digits.', 'VALIDATION_ERROR');
      }

      const inserted = await db
        .insert(schema.employees)
        .values({
          employeeId: employeeId.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          otherName: otherName ? otherName.trim() : null,
          email: email.trim().toLowerCase(),
          phoneNumber: phoneNumber.trim(),
          departmentName: department || 'General',
          positionTitle: position || 'Staff',
          employmentType: employmentType || 'Full-Time',
          dateOfEmployment: dateOfEmployment || new Date().toISOString().split('T')[0],
          basicSalary: salaryNumeric.toFixed(2),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          status: 'Active'
        })
        .returning();

      const created = inserted[0];

      await db.insert(schema.auditLogs).values({
        eventType: 'EMPLOYEE_REGISTERED',
        entityType: 'EMPLOYEE',
        entityId: created.id,
        userId: session.userId,
        details: JSON.stringify({ employeeId: created.employeeId, name: `${created.firstName} ${created.lastName}` })
      });

      return sendJson(res, 201, { message: 'Employee registered successfully.', data: { ...created, basicSalary: parseFloat(created.basicSalary) } });
    }

    // PUT: Update employee
    if (method === 'PUT') {
      const body = await parseJsonBody(req);
      const id = body.id || idParam;
      if (!id) return sendError(res, 400, 'Employee ID is required.', 'VALIDATION_ERROR');

      const existing = await db.select().from(schema.employees).where(eq(schema.employees.id, id));
      if (existing.length === 0) return sendError(res, 404, 'Employee not found.', 'NOT_FOUND');

      const updated = await db
        .update(schema.employees)
        .set({
          firstName: body.firstName?.trim(),
          lastName: body.lastName?.trim(),
          otherName: body.otherName?.trim(),
          email: body.email?.trim().toLowerCase(),
          phoneNumber: body.phoneNumber?.trim(),
          departmentName: body.department,
          positionTitle: body.position,
          employmentType: body.employmentType,
          basicSalary: body.basicSalary !== undefined ? parseFloat(body.basicSalary).toFixed(2) : undefined,
          bankName: body.bankName?.trim(),
          accountNumber: body.accountNumber?.trim(),
          accountName: body.accountName?.trim(),
          status: body.status,
          updatedAt: new Date()
        })
        .where(eq(schema.employees.id, id))
        .returning();

      await db.insert(schema.auditLogs).values({
        eventType: 'EMPLOYEE_UPDATED',
        entityType: 'EMPLOYEE',
        entityId: id,
        userId: session.userId,
        details: JSON.stringify({ updatedFields: Object.keys(body) })
      });

      return sendJson(res, 200, { message: 'Employee record updated.', data: { ...updated[0], basicSalary: parseFloat(updated[0].basicSalary) } });
    }

    // DELETE: Deactivate employee
    if (method === 'DELETE') {
      const body = await parseJsonBody(req);
      const id = body.id || idParam;
      if (!id) return sendError(res, 400, 'Employee ID is required.', 'VALIDATION_ERROR');

      const updated = await db
        .update(schema.employees)
        .set({ status: 'Inactive', updatedAt: new Date() })
        .where(eq(schema.employees.id, id))
        .returning();

      await db.insert(schema.auditLogs).values({
        eventType: 'EMPLOYEE_DEACTIVATED',
        entityType: 'EMPLOYEE',
        entityId: id,
        userId: session.userId,
        details: JSON.stringify({ status: 'Inactive' })
      });

      return sendJson(res, 200, { message: 'Employee deactivated successfully.', data: updated[0] });
    }

    return sendError(res, 405, `Method ${method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  } catch (err: any) {
    console.error('API Error in /api/employees:', err);
    return sendError(res, 500, 'Internal Server Error', 'SERVER_ERROR', err?.message);
  }
}
