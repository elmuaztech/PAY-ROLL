import type { IncomingMessage, ServerResponse } from 'http';
import authResetPasswordHandler from '../../api_handlers/auth-reset-password';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return authResetPasswordHandler(req, res);
}
