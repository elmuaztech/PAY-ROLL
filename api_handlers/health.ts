import type { IncomingMessage, ServerResponse } from 'http';
import { getRawSql, getDb, schema } from '../src/db';
import { sendJson, sendError, handleCors } from './utils';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (handleCors(req, res)) return;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return sendError(res, 500, 'DATABASE_URL environment variable is not configured.', 'CONFIG_ERROR');
  }

  // Masked URL for safe display
  const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@');

  const sql = getRawSql();
  if (!sql) {
    return sendError(res, 500, 'Failed to initialize Neon client with current DATABASE_URL.', 'CONFIG_ERROR');
  }

  try {
    // 1. Check basic connectivity
    const ping = await sql`SELECT 1 as connected, current_database() as db_name, current_user as user_name`;

    // 2. Check existing tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tableNames = tables.map((t: any) => t.table_name);

    // 3. Auto-initialize tables if missing
    let autoInitPerformed = false;
    if (!tableNames.includes('users')) {
      autoInitPerformed = true;
      // Initialize core tables
      await sql`
        CREATE TABLE IF NOT EXISTS "departments" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "code" varchar(20) NOT NULL UNIQUE,
          "name" varchar(255) NOT NULL UNIQUE,
          "description" text,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS "positions" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "title" varchar(255) NOT NULL,
          "department_id" uuid REFERENCES "departments"("id") ON DELETE RESTRICT,
          "grade_level" varchar(50),
          "description" text,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS "employees" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "employee_id" varchar(50) NOT NULL UNIQUE,
          "first_name" varchar(100) NOT NULL,
          "last_name" varchar(100) NOT NULL,
          "other_name" varchar(100),
          "email" varchar(255) NOT NULL,
          "phone_number" varchar(50) NOT NULL,
          "department_id" uuid REFERENCES "departments"("id") ON DELETE RESTRICT,
          "department_name" varchar(255),
          "position_id" uuid REFERENCES "positions"("id") ON DELETE RESTRICT,
          "position_title" varchar(255),
          "employment_type" varchar(50) DEFAULT 'Full-Time' NOT NULL,
          "date_of_employment" date NOT NULL,
          "basic_salary" numeric(12, 2) NOT NULL,
          "bank_name" varchar(100) NOT NULL,
          "account_number" varchar(50) NOT NULL,
          "account_name" varchar(255) NOT NULL,
          "status" varchar(50) DEFAULT 'Active' NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS "allowances" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "code" varchar(50) NOT NULL UNIQUE,
          "name" varchar(255) NOT NULL UNIQUE,
          "description" text,
          "calculation_method" varchar(50) DEFAULT 'FIXED_AMOUNT' NOT NULL,
          "default_value" numeric(12, 2) DEFAULT '0.00' NOT NULL,
          "status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS "employee_allowances" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
          "allowance_id" uuid NOT NULL REFERENCES "allowances"("id") ON DELETE CASCADE,
          "override_value" numeric(12, 2),
          "effective_date" date NOT NULL,
          "end_date" date,
          "status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS "deductions" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "code" varchar(50) NOT NULL UNIQUE,
          "name" varchar(255) NOT NULL UNIQUE,
          "description" text,
          "category" varchar(50) DEFAULT 'ORGANIZATION' NOT NULL,
          "calculation_method" varchar(50) DEFAULT 'PERCENTAGE_OF_BASIC' NOT NULL,
          "default_value" numeric(12, 2) DEFAULT '0.00' NOT NULL,
          "effective_date" date,
          "status" varchar(50) DEFAULT 'PENDING_VERIFICATION' NOT NULL,
          "notes" text,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS "employee_deductions" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
          "deduction_id" uuid NOT NULL REFERENCES "deductions"("id") ON DELETE CASCADE,
          "override_value" numeric(12, 2),
          "effective_date" date NOT NULL,
          "end_date" date,
          "status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS "payroll_periods" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "name" varchar(100) NOT NULL,
          "period_start" date NOT NULL,
          "period_end" date NOT NULL,
          "pay_date" date NOT NULL,
          "status" varchar(50) DEFAULT 'OPEN' NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS "payroll_runs" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "payroll_period_id" uuid NOT NULL REFERENCES "payroll_periods"("id") ON DELETE CASCADE,
          "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
          "status" varchar(50) DEFAULT 'PREVIEW' NOT NULL,
          "is_preview" boolean DEFAULT true NOT NULL,
          "basic_salary_snapshot" numeric(12, 2) DEFAULT '0.00' NOT NULL,
          "total_allowances" numeric(12, 2) DEFAULT '0.00' NOT NULL,
          "gross_pay" numeric(12, 2) DEFAULT '0.00' NOT NULL,
          "total_deductions" numeric(12, 2) DEFAULT '0.00' NOT NULL,
          "net_pay" numeric(12, 2) DEFAULT '0.00' NOT NULL,
          "calculated_at" timestamp DEFAULT now() NOT NULL,
          "finalized_at" timestamp,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS "payroll_items" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "payroll_run_id" uuid NOT NULL REFERENCES "payroll_runs"("id") ON DELETE CASCADE,
          "item_type" varchar(50) NOT NULL,
          "item_name" varchar(255) NOT NULL,
          "source_type" varchar(100),
          "source_reference_id" uuid,
          "amount" numeric(12, 2) NOT NULL,
          "calculation_method_snapshot" varchar(100),
          "created_at" timestamp DEFAULT now() NOT NULL
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS "payroll_rule_versions" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "rule_code" varchar(50) NOT NULL,
          "rule_name" varchar(255) NOT NULL,
          "rule_type" varchar(50) NOT NULL,
          "version" varchar(20) DEFAULT '1.0.0' NOT NULL,
          "effective_from" date NOT NULL,
          "effective_to" date,
          "configuration" text NOT NULL,
          "verification_status" varchar(50) DEFAULT 'PENDING_VERIFICATION' NOT NULL,
          "source_reference" text,
          "notes" text,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "full_name" varchar(255) NOT NULL,
          "email" varchar(255) NOT NULL UNIQUE,
          "password_hash" varchar(255) NOT NULL,
          "role" varchar(50) DEFAULT 'PAYROLL_OFFICER' NOT NULL,
          "status" varchar(50) DEFAULT 'Active' NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS "audit_logs" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "event_type" varchar(100) NOT NULL,
          "entity_type" varchar(100) NOT NULL,
          "entity_id" varchar(255),
          "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
          "details" text,
          "created_at" timestamp DEFAULT now() NOT NULL
        );
      `;
      // Seed default admin user if users table is empty
      const existing = await sql`SELECT count(*) as count FROM "users"`;
      if (parseInt(existing[0].count, 10) === 0) {
        // Password is 'admin123'
        const defaultHash = '$2b$10$h1m5LdbdWsJ5gqlgTBeEFuwBIItnYV8zg2OzSC9sD/IFFRap6HuNG';
        await sql`
          INSERT INTO "users" ("full_name", "email", "password_hash", "role", "status")
          VALUES ('RABIU', 'elmuaztechnologiesltd@gmail.com', ${defaultHash}, 'ADMIN', 'Active')
          ON CONFLICT ("email") DO NOTHING;
        `;
      }
    }

    // 4. Count users in DB
    const userCountResult = await sql`SELECT count(*) as count FROM "users"`;
    const userCount = parseInt(userCountResult[0]?.count || '0', 10);

    return sendJson(res, 200, {
      status: 'HEALTHY',
      database: ping[0]?.db_name,
      connectedUser: ping[0]?.user_name,
      databaseUrl: maskedUrl,
      tablesCount: tableNames.length,
      tables: tableNames,
      usersCount: userCount,
      autoInitPerformed,
      message: 'Database is connected and operational.'
    });
  } catch (err: any) {
    console.error('Database Health Check Failed:', err);
    return sendError(res, 500, `Database connection / query failed: ${err?.message || err}`, 'DB_ERROR', {
      cause: err?.cause?.message || err?.cause || null,
      databaseUrl: maskedUrl
    });
  }
}
