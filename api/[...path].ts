import type { IncomingMessage, ServerResponse } from 'http';

import departmentsHandler from '../api_handlers/departments';
import positionsHandler from '../api_handlers/positions';
import employeesHandler from '../api_handlers/employees';
import allowancesHandler from '../api_handlers/allowances';
import employeeAllowancesHandler from '../api_handlers/employee-allowances';
import deductionsHandler from '../api_handlers/deductions';
import employeeDeductionsHandler from '../api_handlers/employee-deductions';
import payrollPeriodsHandler from '../api_handlers/payroll-periods';
import payrollPreviewHandler from '../api_handlers/payroll-preview';
import payrollRunsHandler from '../api_handlers/payroll-runs';
import payrollRulesHandler from '../api_handlers/payroll-rules';
import healthHandler from '../api_handlers/health';

import authSetupHandler from '../api_handlers/auth-setup';
import authLoginHandler from '../api_handlers/auth-login';
import authLogoutHandler from '../api_handlers/auth-logout';
import authMeHandler from '../api_handlers/auth-me';
import authForgotPasswordHandler from '../api_handlers/auth-forgot-password';
import authResetPasswordHandler from '../api_handlers/auth-reset-password';
import usersHandler from '../api_handlers/users';
import auditLogsHandler from '../api_handlers/audit-logs';
import { sendError } from '../api_handlers/utils';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // CORS Preflight handling
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.end();
  }

  // Resolve path from various Vercel / Node routing formats
  let pathname = (req.url || '').split('?')[0];

  const queryPath = (req as any).query?.path;
  if (queryPath) {
    const subpath = Array.isArray(queryPath) ? queryPath.join('/') : queryPath;
    pathname = `/api/${subpath}`;
  } else {
    const matchedPath = req.headers['x-matched-path'] as string;
    if (matchedPath && matchedPath.startsWith('/api')) {
      pathname = matchedPath.split('?')[0];
    }
  }

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
    console.error('Master Vercel Router Error:', err);
    return sendError(res, 500, err?.message || 'Internal Server Error', 'SERVER_ERROR', err?.stack);
  }
}
