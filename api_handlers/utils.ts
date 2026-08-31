import type { IncomingMessage, ServerResponse } from 'http';

export async function parseJsonBody(req: IncomingMessage): Promise<any> {
  if ((req as any)._parsedBody !== undefined) {
    return (req as any)._parsedBody;
  }
  if ((req as any).body !== undefined && typeof (req as any).body === 'object') {
    (req as any)._parsedBody = (req as any).body;
    return (req as any)._parsedBody;
  }

  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        (req as any)._parsedBody = parsed;
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', err => reject(err));
  });
}

export function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function sendError(
  res: ServerResponse,
  statusCode: number,
  message: string,
  code: string = 'BAD_REQUEST',
  details?: any
) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      error: {
        code,
        message,
        details: details || null
      }
    })
  );
}
