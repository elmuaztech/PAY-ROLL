import type { IncomingMessage, ServerResponse } from 'http';
import employeeAllowancesHandler from '../api_handlers/employee-allowances';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return employeeAllowancesHandler(req, res);
}
