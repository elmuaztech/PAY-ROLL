import type { IncomingMessage, ServerResponse } from 'http';
import employeesHandler from '../api_handlers/employees';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return employeesHandler(req, res);
}
