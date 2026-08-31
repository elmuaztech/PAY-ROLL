import type { IncomingMessage, ServerResponse } from 'http';
import allowancesHandler from '../api_handlers/allowances';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return allowancesHandler(req, res);
}
