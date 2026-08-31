import type { IncomingMessage, ServerResponse } from 'http';
import departmentsHandler from '../api_handlers/departments';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return departmentsHandler(req, res);
}
