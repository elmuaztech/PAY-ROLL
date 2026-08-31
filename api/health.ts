import type { IncomingMessage, ServerResponse } from 'http';
import healthHandler from '../api_handlers/health';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return healthHandler(req, res);
}
