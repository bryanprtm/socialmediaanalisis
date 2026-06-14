// SERVER-ONLY. Never import from client code or top-level of *.functions.ts.
// Load with: const { db } = await import('@/db/client.server')
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // eslint-disable-next-line no-console
  console.warn('[db] DATABASE_URL is not set — local Postgres queries will fail until set in .env');
}

// Reuse pool across hot reloads
const globalForPool = globalThis as unknown as { __pgPool?: Pool };

export const pool =
  globalForPool.__pgPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== 'production') globalForPool.__pgPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
