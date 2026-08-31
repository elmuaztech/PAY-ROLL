import type { IncomingMessage, ServerResponse } from 'http';

export async function parseJsonBody(req: IncomingMessage): Promise<any> {
  if ((req as any)._parsedBody !== undefined) {
    return (req as any)._parsedBody;
  }

  const rawBody = (req as any).body;
  if (rawBody !== undefined && rawBody !== null) {
    if (typeof rawBody === 'object') {
      (req as any)._parsedBody = rawBody;
      return rawBody;
    }
    if (typeof rawBody === 'string' && rawBody.trim().length > 0) {
      try {
        const parsed = JSON.parse(rawBody);
        (req as any)._parsedBody = parsed;
        return parsed;
      } catch (err) {
        return {};
      }
    }
  }

  // If stream already completed/ended, do not hang waiting for data events
  if (req.complete || (req as any).readableEnded) {
    return {};
  }

  return new Promise((resolve) => {
    let body = '';
    const timer = setTimeout(() => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        (req as any)._parsedBody = parsed;
        resolve(parsed);
      } catch {
        resolve({});
      }
    }, 1500);

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      clearTimeout(timer);
      try {
        const parsed = body ? JSON.parse(body) : {};
        (req as any)._parsedBody = parsed;
        resolve(parsed);
      } catch (err) {
        resolve({});
      }
    });

    req.on('error', () => {
      clearTimeout(timer);
      resolve({});
    });
  });
}

export function handleCors(req: IncomingMessage, res: ServerResponse): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

export function sendJson(res: ServerResponse, statusCode: number, data: any) {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
  } catch (e) {
    // Headers already sent safety
  }

  if (typeof (res as any).status === 'function' && typeof (res as any).json === 'function') {
    return (res as any).status(statusCode).json(data);
  }

  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

export function sendError(
  res: ServerResponse,
  statusCode: number,
  message: string,
  code: string = 'BAD_REQUEST',
  details?: any
) {
  const payload = {
    error: {
      code,
      message,
      details: details || null
    }
  };

  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
  } catch (e) {
    // Headers already sent safety
  }

  if (typeof (res as any).status === 'function' && typeof (res as any).json === 'function') {
    return (res as any).status(statusCode).json(payload);
  }

  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

export function extractErrorMessage(err: any): string {
  if (!err) return 'Unknown error occurred.';
  const causeMsg = err.cause?.message || (typeof err.cause === 'string' ? err.cause : null);
  if (causeMsg && err.message) {
    return `${err.message} (Database Detail: ${causeMsg})`;
  }
  if (err.message) return err.message;
  if (typeof err === 'string') return err;
  return 'Internal Server Error';
}
