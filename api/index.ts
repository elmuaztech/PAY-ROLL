import type { IncomingMessage, ServerResponse } from 'http';
import masterHandler from './[...path]';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return masterHandler(req, res);
}
