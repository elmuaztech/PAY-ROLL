import type { IncomingMessage, ServerResponse } from 'http';
import payrollPreviewHandler from '../../api_handlers/payroll-preview';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return payrollPreviewHandler(req, res);
}
