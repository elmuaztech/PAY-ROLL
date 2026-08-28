import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Initializes Neon PostgreSQL connection pool using serverless HTTP/WebSocket protocol.
 * Returns null if DATABASE_URL is not yet provided in the environment.
 */
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes('ep-example-123456')) {
    return null;
  }

  try {
    const pool = new Pool({ connectionString });
    dbInstance = drizzle(pool, { schema });
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize Neon PostgreSQL connection:', error);
    return null;
  }
}

export { schema };
