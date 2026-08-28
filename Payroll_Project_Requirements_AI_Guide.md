COMPUTERIZED PAYROLL MANAGEMENT SYSTEMPROJECT REQUIREMENTS &amp; AI DEVELOPMENT GUIDE

Version 1.0 | Polytechnic Project | Nigeria | August 2026

1. Project Overview

Build a secure, responsive, web-based Computerized Payroll Management System that replaces manual payroll processing. The system shall manage employees, salary structures, allowances, deductions, payroll periods, payroll calculations, reports and payslips. The primary goals are to reduce calculation errors, improve record keeping, save processing time, improve payroll security and support accurate reporting.

2. Development Rules and Technology

Development is AI-assisted. The IDE/AI must read this document before implementing any feature and must preserve the agreed architecture.

Use the existing project stack selected by the developer: modern web frontend with Tailwind CSS, Python where required by the project architecture, PostgreSQL as the only application database, Neon as the hosted PostgreSQL provider, and Vercel for public deployment.

Do NOT use SQLite as a production or primary development database.

Prefer TypeScript/typed code where the chosen frontend framework supports it. Keep code modular, readable and beginner-maintainable.

Do not introduce a separate technology, ORM, authentication provider, UI framework or database without first checking the existing project configuration and asking before major architectural changes.

Use environment variables for all secrets and connection strings. Never hard-code passwords, API keys, database URLs or production credentials.

The deployed application must work on Vercel; database access must connect securely to Neon PostgreSQL.

3. Users and Roles

Administrator

Full access to users, employees, departments, positions, salary settings, payroll, reports, statutory settings and system configuration.

Can manage roles and review payroll history/audit information.

Payroll Officer

Can manage employee payroll information, allowances, deductions, payroll periods, payroll processing, payslips and authorized reports.

Cannot perform restricted system-administration actions unless explicitly granted.

Employee (optional but recommended)

Can securely view personal profile, payroll history and own payslips only.

4. Functional Requirements

A. Authentication and Access Control

Secure login/logout and protected routes.

Role-based authorization and password security.

Users must only access data and actions permitted by their role.

B. Employee Management

Create, view, edit and deactivate employees; avoid destructive deletion where payroll history exists.

Store employee ID, name, contact details, department, position, employment status/date and relevant bank/payroll details.

Validate required fields and prevent duplicate employee identifiers.

C. Organization Setup

Manage departments and positions.

Maintain employee status and employment-related information required for payroll.

D. Salary, Allowances and Deductions

Create salary structures with effective dates.

Support recurring and one-off allowances.

Support statutory and non-statutory deductions such as authorized loans/cooperative deductions.

Maintain historical payroll data so past payslips do not change when future salary settings change.

E. Payroll Processing

Create payroll periods by month and year.

Calculate Basic Pay + applicable Allowances = Gross Pay.

Calculate authorized/statutory deductions and Total Deductions.

Calculate Net Pay = Gross Pay − Total Deductions.

Prevent accidental duplicate payroll runs for the same employee and period.

Support draft, review and finalized/processed states; finalized payroll must not be silently altered.

5. Nigerian Payroll and Compliance Requirements

The system is intended for use in Nigeria. Nigerian payroll rules must not be permanently hard-coded as immutable values because laws, rates, thresholds and institutional policies may change.

Provide configurable statutory settings with effective dates and clear descriptions.

Support PAYE/tax calculations according to the currently applicable official rules when the system is configured and deployed.

Support pension, NHF and other statutory/authorized deductions where applicable to the employer and employee.

Keep calculation rules versioned or effective-dated so historical payroll remains reproducible.

Show calculation breakdowns for transparency.

Before production use, verify current official requirements with authoritative Nigerian sources and the institution's payroll/finance office.

Handle personal and payroll information using appropriate access control, minimum data collection, secure transmission and privacy practices consistent with applicable Nigerian data-protection requirements.

6. Reports and Payslips

Individual printable payslip with employee, period, earnings, deductions, gross pay and net pay.

Monthly payroll register/summary.

Employee payroll history.

Department-based payroll report where applicable.

Deduction and earnings summaries.

Reports should be printable and, where implemented, exportable to PDF.

7. Non-Functional Requirements

Responsive UI for desktop and mobile.

Clear professional interface suitable for a Nigerian Polytechnic/institution.

Fast page loading and efficient database queries.

Server-side validation for sensitive operations; client-side validation for usability.

Consistent error messages without exposing secrets or internal stack traces.

Accessible forms, labels, keyboard-friendly navigation and readable tables.

Audit-friendly records for important payroll actions where feasible.

Database schema must enforce important uniqueness and relationships.

Use database transactions for multi-step payroll finalization where supported by the chosen implementation.

8. Core Data Model

Expected main entities (exact names may follow framework conventions):

Users/Roles

Employees

Departments

Positions

Salary Structures

Allowance Types and Employee Allowances

Deduction Types and Employee Deductions

Statutory/Payroll Settings

Payroll Periods

Payroll Runs/Records

Payroll Line Items

Audit Logs (recommended)

Important relationships: an employee belongs to a department/position; an employee can have multiple salary/allowance/deduction records over time; a payroll period contains many employee payroll records; each payroll record contains itemized earnings and deductions.

9. UI Pages

Login

Dashboard

Employees list / employee profile / add-edit employee

Departments and Positions

Salary Structures

Allowances and Deductions

Payroll Periods and Payroll Processing

Payroll History and Details

Payslip

Reports

Statutory/System Settings

User and Role Management (administrator)

Frontend-first workflow: build the complete responsive screens and navigation with realistic mock data first, then replace mock data with Neon-backed functionality without redesigning the UI unnecessarily.

10. Development Workflow: Five Phases

Phase 1 — Foundation and Frontend

Inspect the existing project before changing architecture.

Create or confirm project structure, global styles, Tailwind configuration, navigation, layout and reusable components.

Build all primary screens with mock data and responsive states.

Do not connect incomplete UI directly to unsafe production operations.

Phase 2 — Database and Data Layer

Design PostgreSQL schema for Neon.

Create migrations/schema, indexes, constraints and relationships.

Configure secure environment variables and local/development connection.

Implement typed data access and seed/demo data only when clearly separated from real payroll data.

Phase 3 — Business Logic and Payroll

Implement employee management and salary components.

Implement configurable allowances, deductions and effective dates.

Implement payroll calculation engine with testable functions.

Add Nigerian compliance configuration after current rules are verified.

Phase 4 — Security, Reports and Quality

Implement authentication, roles and route protection.

Build reports and payslips.

Add validation, error handling, audit-friendly actions and tests for payroll calculations.

Phase 5 — Production and Documentation

Run final testing with realistic sample data.

Prepare Vercel deployment and production environment variables.

Connect production to Neon securely.

Verify deployment, backups/recovery approach and user flows.

Prepare Polytechnic documentation, screenshots, testing evidence and defense materials.

11. AI Implementation Rules

Read this requirements document and inspect the current repository before coding.

For every feature: explain the plan briefly, identify files to change, implement the smallest coherent change, then verify it.

Never overwrite working files blindly or replace the whole project when a targeted change is sufficient.

Preserve backward compatibility unless a deliberate migration is approved.

Use migrations for database changes; never assume an existing Neon database can be dropped or recreated.

Do not fabricate Nigerian statutory rates or legal requirements. Mark uncertain rules as configurable and request/verify official current sources before final implementation.

Do not expose secrets in code, logs, screenshots or client-side bundles.

Keep the project beginner-friendly: meaningful names, comments only where useful, and a short README for setup and deployment.

After each completed phase, provide a checklist of completed items, files changed, tests run and the next recommended step.

12. Definition of Done

The project is complete when authorized users can securely manage employees and payroll data, configure applicable earnings/deductions, process payroll accurately, preserve payroll history, generate usable reports/payslips, and deploy the public application through Vercel with Neon PostgreSQL as the database.