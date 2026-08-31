import type { IncomingMessage, ServerResponse } from 'http';
import authSetupHandler from '../../api_handlers/auth-setup';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return authSetupHandler(req, res);
}
