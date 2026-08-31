import type { IncomingMessage, ServerResponse } from 'http';
import authMeHandler from '../../api_handlers/auth-me';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return authMeHandler(req, res);
}
