import type { IncomingMessage, ServerResponse } from 'http';
import authForgotPasswordHandler from '../../api_handlers/auth-forgot-password';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return authForgotPasswordHandler(req, res);
}
