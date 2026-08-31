import type { IncomingMessage, ServerResponse } from 'http';
import deductionsHandler from '../api_handlers/deductions';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return deductionsHandler(req, res);
}
