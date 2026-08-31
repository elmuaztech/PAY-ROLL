import type { IncomingMessage, ServerResponse } from 'http';
import payrollRunsHandler from '../../api_handlers/payroll-runs';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return payrollRunsHandler(req, res);
}
