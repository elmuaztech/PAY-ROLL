import type { IncomingMessage, ServerResponse } from 'http';
import positionsHandler from '../api_handlers/positions';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return positionsHandler(req, res);
}
