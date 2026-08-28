import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, schema } from '../src/db';
import { eq } from 'drizzle-orm';
import { parseJsonBody, sendJson, sendError } from './utils';
import { requireAuth } from '../src/auth/requireAuth';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const idParam = url.searchParams.get('id');

  const allowedRoles = method === 'GET' ? ['ADMIN', 'PAYROLL_OFFICER', 'VIEWER'] : ['ADMIN'];
  const session = requireAuth(req, res, allowedRoles as any);
  if (!session) return;

  const db = getDb();
  if (!db) {
    if (method === 'GET') return sendJson(res, 200, { source: 'unconfigured_fallback', data: [] });
    return sendError(res, 533, 'Database connection is not configured.', 'DATABASE_UNCONFIGURED');
  }

  try {
    if (method === 'GET') {
      if (idParam) {
        const found = await db.select().from(schema.payrollRuleVersions).where(eq(schema.payrollRuleVersions.id, idParam));
        if (found.length === 0) return sendError(res, 404, 'Rule version not found.', 'NOT_FOUND');
        return sendJson(res, 200, { source: 'neon_postgres', data: found[0] });
      }

      const list = await db.select().from(schema.payrollRuleVersions);
      return sendJson(res, 200, { source: 'neon_postgres', data: list });
    }

    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const { ruleCode, ruleName, ruleType, configuration, verificationStatus } = body;

      if (!ruleCode || !ruleName) {
        return sendError(res, 400, 'ruleCode and ruleName are required.', 'VALIDATION_ERROR');
      }

      const inserted = await db
        .insert(schema.payrollRuleVersions)
        .values({
          ruleCode: ruleCode.trim(),
          ruleName: ruleName.trim(),
          ruleType: ruleType || 'STATUTORY_PAYE',
          version: body.version || '1.0.0',
          effectiveFrom: body.effectiveFrom || new Date().toISOString().split('T')[0],
          effectiveTo: body.effectiveTo || null,
          configuration: typeof configuration === 'object' ? JSON.stringify(configuration) : (configuration || '{}'),
          verificationStatus: verificationStatus || 'PENDING_VERIFICATION',
          sourceReference: body.sourceReference || '',
          notes: body.notes || 'Rule configuration requires verified official reference before production activation.'
        })
        .returning();

      await db.insert(schema.auditLogs).values({
        eventType: 'RULE_VERSION_CREATED',
        entityType: 'PAYROLL_RULE_VERSION',
        entityId: inserted[0].id,
        userId: session.userId,
        details: JSON.stringify({ ruleCode, ruleName })
      });

      return sendJson(res, 201, { message: 'Payroll rule version registered', data: inserted[0] });
    }

    return sendError(res, 405, `Method ${method} Not Allowed`, 'METHOD_NOT_ALLOWED');
  } catch (err: any) {
    console.error('API Error in /api/payroll/rules:', err);
    return sendError(res, 500, 'Internal Server Error', 'SERVER_ERROR', err?.message);
  }
}
