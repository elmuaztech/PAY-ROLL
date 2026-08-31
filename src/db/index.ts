import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Initializes Neon PostgreSQL connection using serverless HTTP protocol.
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
    const client = neon(connectionString);
    dbInstance = drizzle(client, { schema });
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize Neon PostgreSQL HTTP connection:', error);
    return null;
  }
}

export { schema };
