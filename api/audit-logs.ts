import type { IncomingMessage, ServerResponse } from 'http';
import auditLogsHandler from '../api_handlers/audit-logs';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return auditLogsHandler(req, res);
}
