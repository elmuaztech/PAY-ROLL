import type { IncomingMessage, ServerResponse } from 'http';
import payrollPeriodsHandler from '../api_handlers/payroll-periods';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return payrollPeriodsHandler(req, res);
}
