import type { IncomingMessage, ServerResponse } from 'http';
import { getAuthSession, UserSessionPayload } from './session';
import { sendError } from '../../api_handlers/utils';

export function requireAuth(
  req: IncomingMessage,
  res: ServerResponse,
  allowedRoles?: ('ADMIN' | 'PAYROLL_OFFICER' | 'VIEWER')[]
): UserSessionPayload | null {
  const session = getAuthSession(req);

  if (!session) {
    sendError(res, 401, 'Authentication required. Please log in.', 'AUTHENTICATION_REQUIRED');
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.role)) {
      sendError(
        res,
        403,
        `Access denied. Required role: [${allowedRoles.join(', ')}]. Your role: ${session.role}`,
        'AUTHORIZATION_DENIED'
      );
      return null;
    }
  }

  return session;
}
