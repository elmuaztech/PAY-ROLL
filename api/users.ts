import type { IncomingMessage, ServerResponse } from 'http';
import usersHandler from '../api_handlers/users';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return usersHandler(req, res);
}
