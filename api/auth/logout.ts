import type { IncomingMessage, ServerResponse } from 'http';
import authLogoutHandler from '../../api_handlers/auth-logout';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return authLogoutHandler(req, res);
}
