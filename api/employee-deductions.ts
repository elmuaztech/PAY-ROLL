import type { IncomingMessage, ServerResponse } from 'http';
import employeeDeductionsHandler from '../api_handlers/employee-deductions';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return employeeDeductionsHandler(req, res);
}
