import type { IncomingMessage, ServerResponse } from 'http';
import authLoginHandler from '../../api_handlers/auth-login';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return authLoginHandler(req, res);
}
