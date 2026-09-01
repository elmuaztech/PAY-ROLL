import type { Config, Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import { EventEmitter } from 'events';
import type { IncomingMessage, ServerResponse } from 'http';

import departmentsHandler from '../../api_handlers/departments';
import positionsHandler from '../../api_handlers/positions';
import employeesHandler from '../../api_handlers/employees';
import allowancesHandler from '../../api_handlers/allowances';
import employeeAllowancesHandler from '../../api_handlers/employee-allowances';
import deductionsHandler from '../../api_handlers/deductions';
import employeeDeductionsHandler from '../../api_handlers/employee-deductions';
import payrollPeriodsHandler from '../../api_handlers/payroll-periods';
import payrollPreviewHandler from '../../api_handlers/payroll-preview';
import payrollRunsHandler from '../../api_handlers/payroll-runs';
import payrollRulesHandler from '../../api_handlers/payroll-rules';
import healthHandler from '../../api_handlers/health';

import authSetupHandler from '../../api_handlers/auth-setup';
import authLoginHandler from '../../api_handlers/auth-login';
import authLogoutHandler from '../../api_handlers/auth-logout';
import authMeHandler from '../../api_handlers/auth-me';
import authForgotPasswordHandler from '../../api_handlers/auth-forgot-password';
import authResetPasswordHandler from '../../api_handlers/auth-reset-password';
import usersHandler from '../../api_handlers/users';
import auditLogsHandler from '../../api_handlers/audit-logs';
import { sendError } from '../../api_handlers/utils';

// Netlify Functions v2 direct path mapping
export const config: Config = {
  path: ['/api/*', '/api']
};

async function routeRequest(req: IncomingMessage, res: ServerResponse) {
  // CORS Preflight handling
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.end();
  }

  // Resolve pathname
  let pathname = (req.url || '').split('?')[0];

  try {
    if (pathname === '/api/health' || pathname.endsWith('/health')) {
      return await healthHandler(req, res);
    }
    if (pathname === '/api/auth/setup' || pathname.endsWith('/auth/setup')) {
      return await authSetupHandler(req, res);
    }
    if (pathname === '/api/auth/login' || pathname.endsWith('/auth/login')) {
      return await authLoginHandler(req, res);
    }
    if (pathname === '/api/auth/logout' || pathname.endsWith('/auth/logout')) {
      return await authLogoutHandler(req, res);
    }
    if (pathname === '/api/auth/me' || pathname.endsWith('/auth/me')) {
      return await authMeHandler(req, res);
    }
    if (pathname === '/api/auth/forgot-password' || pathname.endsWith('/auth/forgot-password')) {
      return await authForgotPasswordHandler(req, res);
    }
    if (pathname === '/api/auth/reset-password' || pathname.endsWith('/auth/reset-password')) {
      return await authResetPasswordHandler(req, res);
    }
    if (pathname === '/api/users' || pathname.endsWith('/users')) {
      return await usersHandler(req, res);
    }
    if (pathname === '/api/audit-logs' || pathname.endsWith('/audit-logs')) {
      return await auditLogsHandler(req, res);
    }
    if (pathname === '/api/departments' || pathname.endsWith('/departments')) {
      return await departmentsHandler(req, res);
    }
    if (pathname === '/api/positions' || pathname.endsWith('/positions')) {
      return await positionsHandler(req, res);
    }
    if (pathname === '/api/employees' || pathname.endsWith('/employees')) {
      return await employeesHandler(req, res);
    }
    if (pathname === '/api/allowances' || pathname.endsWith('/allowances')) {
      return await allowancesHandler(req, res);
    }
    if (pathname === '/api/employee-allowances' || pathname.endsWith('/employee-allowances')) {
      return await employeeAllowancesHandler(req, res);
    }
    if (pathname === '/api/deductions' || pathname.endsWith('/deductions')) {
      return await deductionsHandler(req, res);
    }
    if (pathname === '/api/employee-deductions' || pathname.endsWith('/employee-deductions')) {
      return await employeeDeductionsHandler(req, res);
    }
    if (pathname === '/api/payroll-periods' || pathname.endsWith('/payroll-periods')) {
      return await payrollPeriodsHandler(req, res);
    }
    if (pathname === '/api/payroll/preview' || pathname.endsWith('/payroll/preview')) {
      return await payrollPreviewHandler(req, res);
    }
    if (pathname === '/api/payroll/runs' || pathname.endsWith('/payroll/runs')) {
      return await payrollRunsHandler(req, res);
    }
    if (pathname === '/api/payroll/rules' || pathname.endsWith('/payroll/rules')) {
      return await payrollRulesHandler(req, res);
    }

    return sendError(res, 404, `API Route Not Found: ${pathname}`, 'NOT_FOUND');
  } catch (err: any) {
    console.error('Netlify API Router Error:', err);
    return sendError(res, 500, err?.message || 'Internal Server Error', 'SERVER_ERROR', err?.stack);
  }
}

/**
 * Handle Netlify Functions v2 (Standard Web Request / Response)
 */
async function handleWebRequest(request: Request): Promise<Response> {
  const urlObj = new URL(request.url);
  const pathname = urlObj.pathname;
  const search = urlObj.search;

  // Read body
  const bodyText = ['GET', 'HEAD', 'OPTIONS'].includes(request.method) ? '' : await request.text();
  let parsedBody: any = undefined;
  if (bodyText && bodyText.trim().length > 0) {
    try {
      parsedBody = JSON.parse(bodyText);
    } catch {
      parsedBody = bodyText;
    }
  }

  // Extract headers
  const reqHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    reqHeaders[key.toLowerCase()] = value;
  });

  // Mock IncomingMessage
  const mockReq = new EventEmitter() as any;
  mockReq.method = request.method;
  mockReq.url = `${pathname}${search}`;
  mockReq.headers = reqHeaders;
  mockReq.body = bodyText;
  mockReq._parsedBody = parsedBody;
  mockReq.complete = true;
  mockReq.readableEnded = true;

  // Mock ServerResponse
  let resStatus = 200;
  const responseHeaders = new Headers();
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  let responseBodyText = '';

  return new Promise<Response>(async (resolve) => {
    let isFinished = false;
    const finish = () => {
      if (isFinished) return;
      isFinished = true;
      resolve(new Response(responseBodyText, {
        status: resStatus,
        headers: responseHeaders
      }));
    };

    const mockRes: any = {
      statusCode: 200,
      setHeader(name: string, value: string | string[]) {
        const lowerName = name.toLowerCase();
        if (lowerName === 'set-cookie') {
          if (Array.isArray(value)) {
            value.forEach(v => responseHeaders.append('Set-Cookie', v));
          } else {
            responseHeaders.append('Set-Cookie', value);
          }
        } else {
          responseHeaders.set(name, Array.isArray(value) ? value.join(', ') : value);
        }
      },
      getHeader(name: string) {
        return responseHeaders.get(name);
      },
      writeHead(code: number, hdrs?: any) {
        resStatus = code;
        if (hdrs) {
          Object.entries(hdrs).forEach(([k, v]) => this.setHeader(k, v as any));
        }
      },
      status(code: number) {
        resStatus = code;
        return this;
      },
      json(data: any) {
        this.setHeader('Content-Type', 'application/json');
        responseBodyText = JSON.stringify(data);
        finish();
        return this;
      },
      end(chunk?: any) {
        if (chunk !== undefined && chunk !== null) {
          responseBodyText += typeof chunk === 'string' ? chunk : Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : JSON.stringify(chunk);
        }
        finish();
      }
    };

    Object.defineProperty(mockRes, 'statusCode', {
      get: () => resStatus,
      set: (code: number) => { resStatus = code; }
    });

    await routeRequest(mockReq, mockRes);
    setTimeout(finish, 50);
  });
}

/**
 * Handle Netlify Functions v1 (AWS Lambda HandlerEvent / HandlerResponse)
 */
async function handleLambdaEvent(event: HandlerEvent, context?: HandlerContext): Promise<HandlerResponse> {
  return new Promise<HandlerResponse>(async (resolve) => {
    try {
      // 1. Resolve normalized path and query string
      let rawPath = '';
      if (event.rawUrl) {
        try {
          rawPath = new URL(event.rawUrl).pathname;
        } catch {
          rawPath = event.path || '';
        }
      } else {
        const originalPath = 
          event.headers?.['x-nf-original-pathname'] ||
          event.headers?.['x-original-url'] ||
          event.headers?.['x-forwarded-path'] ||
          event.headers?.['x-rewrite-url'] ||
          event.path ||
          '';
        rawPath = originalPath;
      }

      if (rawPath.startsWith('/.netlify/functions/api')) {
        rawPath = rawPath.replace('/.netlify/functions/api', '/api');
      }
      if (!rawPath.startsWith('/api') && rawPath.length > 0) {
        rawPath = `/api${rawPath.startsWith('/') ? rawPath : `/${rawPath}`}`;
      }
      if (!rawPath) {
        rawPath = '/api';
      }

      // Build query string
      let queryString = '';
      if (event.rawQuery) {
        queryString = `?${event.rawQuery}`;
      } else if (event.queryStringParameters) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(event.queryStringParameters)) {
          if (value !== undefined) params.append(key, value);
        }
        const qs = params.toString();
        if (qs) queryString = `?${qs}`;
      }

      const fullUrl = `${rawPath.split('?')[0]}${queryString}`;

      // 2. Normalize headers
      const headers: Record<string, string> = {};
      if (event.headers) {
        for (const [key, val] of Object.entries(event.headers)) {
          if (val !== undefined) headers[key.toLowerCase()] = val;
        }
      }

      if (event.multiValueHeaders?.['cookie']) {
        headers['cookie'] = event.multiValueHeaders['cookie'].join('; ');
      } else if (event.multiValueHeaders?.['Cookie']) {
        headers['cookie'] = event.multiValueHeaders['Cookie'].join('; ');
      }

      // 3. Normalize body
      let bodyString = event.body || '';
      if (event.isBase64Encoded && event.body) {
        try {
          bodyString = Buffer.from(event.body, 'base64').toString('utf-8');
        } catch {
          bodyString = event.body;
        }
      }

      let parsedBody: any = undefined;
      if (bodyString && bodyString.trim().length > 0) {
        try {
          parsedBody = JSON.parse(bodyString);
        } catch {
          parsedBody = bodyString;
        }
      }

      // 4. Create mock IncomingMessage
      const mockReq = new EventEmitter() as any;
      mockReq.method = event.httpMethod || 'GET';
      mockReq.url = fullUrl;
      mockReq.headers = headers;
      mockReq.body = bodyString;
      mockReq._parsedBody = parsedBody;
      mockReq.complete = true;
      mockReq.readableEnded = true;

      // 5. Create mock ServerResponse
      let resStatusCode = 200;
      const resHeaders: Record<string, string> = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
        'Access-Control-Allow-Credentials': 'true'
      };
      const resMultiValueHeaders: Record<string, string[]> = {};
      let resBody = '';
      let isEnded = false;

      const finishResponse = () => {
        if (isEnded) return;
        isEnded = true;

        const responseObj: HandlerResponse = {
          statusCode: resStatusCode,
          headers: resHeaders,
          body: resBody
        };

        if (Object.keys(resMultiValueHeaders).length > 0) {
          responseObj.multiValueHeaders = resMultiValueHeaders;
        }

        resolve(responseObj);
      };

      const mockRes: any = {
        statusCode: 200,
        setHeader(name: string, value: string | string[]) {
          const lowerName = name.toLowerCase();
          if (lowerName === 'set-cookie') {
            if (Array.isArray(value)) {
              resMultiValueHeaders['Set-Cookie'] = value;
            } else {
              resMultiValueHeaders['Set-Cookie'] = [value];
            }
          } else {
            resHeaders[name] = Array.isArray(value) ? value.join(', ') : value;
          }
        },
        getHeader(name: string) {
          return resHeaders[name] || resHeaders[name.toLowerCase()];
        },
        writeHead(code: number, hdrs?: any) {
          resStatusCode = code;
          if (hdrs) {
            Object.entries(hdrs).forEach(([k, v]) => this.setHeader(k, v as any));
          }
        },
        status(code: number) {
          resStatusCode = code;
          return this;
        },
        json(data: any) {
          this.setHeader('Content-Type', 'application/json');
          resBody = JSON.stringify(data);
          finishResponse();
          return this;
        },
        end(chunk?: any) {
          if (chunk !== undefined && chunk !== null) {
            resBody += typeof chunk === 'string' ? chunk : Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : JSON.stringify(chunk);
          }
          finishResponse();
        }
      };

      Object.defineProperty(mockRes, 'statusCode', {
        get: () => resStatusCode,
        set: (code: number) => {
          resStatusCode = code;
        }
      });

      await routeRequest(mockReq, mockRes);
      setTimeout(finishResponse, 50);
    } catch (err: any) {
      console.error('Unhandled Netlify Lambda Handler Error:', err);
      resolve({
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: err?.message || 'Server error'
          }
        })
      });
    }
  });
}

/**
 * Universal entry point supporting both Netlify v2 (Request) and v1 (HandlerEvent)
 */
export const handler: any = async (arg1: any, arg2: any) => {
  // If invoked with a standard Web Request (Netlify Functions v2)
  if (arg1 && typeof arg1 === 'object' && typeof arg1.text === 'function' && typeof arg1.headers?.get === 'function') {
    return handleWebRequest(arg1 as Request);
  }
  // Otherwise standard Netlify Lambda HandlerEvent (Netlify Functions v1)
  return handleLambdaEvent(arg1 as HandlerEvent, arg2 as HandlerContext);
};

export default handler;
