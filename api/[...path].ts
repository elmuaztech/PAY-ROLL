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
  const url = req.url || '';
  const pathname = url.split('?')[0];

  try {
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

    return sendError(res, 404, 'API Route Not Found', 'NOT_FOUND');
  } catch (err: any) {
    console.error('Master Vercel Router Error:', err);
    return sendError(res, 500, 'Internal Server Error', 'SERVER_ERROR', err?.message);
  }
}
