import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

import departmentsHandler from './api/departments';
import positionsHandler from './api/positions';
import employeesHandler from './api/employees';
import allowancesHandler from './api/allowances';
import employeeAllowancesHandler from './api/employee-allowances';
import deductionsHandler from './api/deductions';
import employeeDeductionsHandler from './api/employee-deductions';
import payrollPeriodsHandler from './api/payroll-periods';
import payrollPreviewHandler from './api/payroll/preview';
import payrollRunsHandler from './api/payroll/runs';
import payrollRulesHandler from './api/payroll/rules';

import authSetupHandler from './api/auth/setup';
import authLoginHandler from './api/auth/login';
import authLogoutHandler from './api/auth/logout';
import authMeHandler from './api/auth/me';
import authForgotPasswordHandler from './api/auth/forgot-password';
import authResetPasswordHandler from './api/auth/reset-password';
import usersHandler from './api/users';
import auditLogsHandler from './api/audit-logs';

/**
 * Vite Dev Server Middleware for mounting Vercel-native API handlers locally
 */
function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        try {
          if (req.url.startsWith('/api/auth/setup')) {
            await authSetupHandler(req, res);
          } else if (req.url.startsWith('/api/auth/login')) {
            await authLoginHandler(req, res);
          } else if (req.url.startsWith('/api/auth/logout')) {
            await authLogoutHandler(req, res);
          } else if (req.url.startsWith('/api/auth/me')) {
            await authMeHandler(req, res);
          } else if (req.url.startsWith('/api/auth/forgot-password')) {
            await authForgotPasswordHandler(req, res);
          } else if (req.url.startsWith('/api/auth/reset-password')) {
            await authResetPasswordHandler(req, res);
          } else if (req.url.startsWith('/api/users')) {
            await usersHandler(req, res);
          } else if (req.url.startsWith('/api/audit-logs')) {
            await auditLogsHandler(req, res);
          } else if (req.url.startsWith('/api/departments')) {
            await departmentsHandler(req, res);
          } else if (req.url.startsWith('/api/positions')) {
            await positionsHandler(req, res);
          } else if (req.url.startsWith('/api/employees')) {
            await employeesHandler(req, res);
          } else if (req.url.startsWith('/api/allowances')) {
            await allowancesHandler(req, res);
          } else if (req.url.startsWith('/api/employee-allowances')) {
            await employeeAllowancesHandler(req, res);
          } else if (req.url.startsWith('/api/deductions')) {
            await deductionsHandler(req, res);
          } else if (req.url.startsWith('/api/employee-deductions')) {
            await employeeDeductionsHandler(req, res);
          } else if (req.url.startsWith('/api/payroll-periods')) {
            await payrollPeriodsHandler(req, res);
          } else if (req.url.startsWith('/api/payroll/preview')) {
            await payrollPreviewHandler(req, res);
          } else if (req.url.startsWith('/api/payroll/runs')) {
            await payrollRunsHandler(req, res);
          } else if (req.url.startsWith('/api/payroll/rules')) {
            await payrollRulesHandler(req, res);
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'API route not found' } }));
          }
        } catch (err: any) {
          console.error('Vite Dev API Middleware Error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'Internal Server Error', details: err?.message } }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  build: {
    chunkSizeWarningLimit: 2000,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
