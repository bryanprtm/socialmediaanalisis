/**
 * Salin data dari Supabase remote ke PostgreSQL lokal.
 * Dijalankan SEKALI di VPS setelah `bun run db:migrate`.
 *
 * Prasyarat .env:
 *   DATABASE_URL=postgresql://...   (Postgres lokal target)
 *   SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=...   (key admin Supabase asal)
 *
 * Usage:  bun run db:seed-from-supabase
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak di-set.');
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error('DATABASE_URL tidak di-set.');
  process.exit(1);
}

const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool, { schema });

const BATCH = 500;

async function migrateTable<T extends Record<string, unknown>>(
  table: string,
  insertFn: (rows: T[]) => Promise<void>,
): Promise<number> {
  let total = 0;
  let from = 0;
  while (true) {
    const { data, error } = await supa.from(table).select('*').range(from, from + BATCH - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    await insertFn(data as T[]);
    total += data.length;
    console.log(`  [${table}] copied ${total}`);
    if (data.length < BATCH) break;
    from += BATCH;
  }
  return total;
}

function camel<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[key] = v;
  }
  return out;
}

async function main() {
  console.log('→ news_articles');
  await migrateTable('news_articles', async (rows) => {
    const mapped = rows.map((r) => camel(r));
    if (mapped.length) {
      // @ts-expect-error dynamic mapping
      await db.insert(schema.newsArticles).values(mapped).onConflictDoNothing();
    }
  });

  console.log('→ rss_feeds');
  await migrateTable('rss_feeds', async (rows) => {
    const mapped = rows.map((r) => camel(r));
    if (mapped.length) {
      // @ts-expect-error dynamic mapping
      await db.insert(schema.rssFeeds).values(mapped).onConflictDoNothing();
    }
  });

  console.log('→ tracked_keywords');
  await migrateTable('tracked_keywords', async (rows) => {
    const mapped = rows.map((r) => camel(r));
    if (mapped.length) {
      // @ts-expect-error dynamic mapping
      await db.insert(schema.trackedKeywords).values(mapped).onConflictDoNothing();
    }
  });

  console.log('→ keyword_queries');
  await migrateTable('keyword_queries', async (rows) => {
    const mapped = rows.map((r) => camel(r));
    if (mapped.length) {
      // @ts-expect-error dynamic mapping
      await db.insert(schema.keywordQueries).values(mapped).onConflictDoNothing();
    }
  });

  console.log('\nSelesai. Catatan: data auth (users) TIDAK dimigrasikan');
  console.log('karena Supabase Auth pakai hash password yang berbeda.');
  console.log('Daftar ulang user via halaman /auth setelah Fase 2 selesai,');
  console.log('atau seed admin manual: INSERT INTO users (email, password_hash) VALUES (...)');

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
