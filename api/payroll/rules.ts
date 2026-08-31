import type { IncomingMessage, ServerResponse } from 'http';
import payrollRulesHandler from '../../api_handlers/payroll-rules';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return payrollRulesHandler(req, res);
}
