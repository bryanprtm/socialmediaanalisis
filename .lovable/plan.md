## Fase 2 — Rencana migrasi bertahap

### Urutan modul (per turn berikutnya, satu modul per giliran)

1. **Fix Drizzle schema + auth foundation** (turn ini)
2. **Auth UI + hook** (login/signup/logout pakai JWT cookie)
3. **rss-sync** (admin RSS sync ke Postgres lokal)
4. **news** (list & filter berita)
5. **keywords / tracked_keywords / keyword_queries**
6. **dashboard / sentiment / map / trends / lainnya**
7. **Fase 3:** hapus folder `src/integrations/supabase`, dep `@supabase/*`, env `VITE_SUPABASE_*`, `attachSupabaseAuth` dari `start.ts`

### Turn ini — apa yang akan saya kerjakan

**A. Perbaiki `src/db/schema.ts` agar 1:1 dengan Supabase asli:**
- Tambah enum `sentiment_type` (`positive`, `negative`, `neutral`, `mixed`) dan `feed_status` (`active`, `warning`, `error`)
- `news_articles`: `url` (bukan `link`), `keywords` `text[]`, `language`, `region`, `sentiment` (enum), `sentiment_score` & `confidence` `numeric(4,3)`, `fetched_at`, hapus `entities`/`metadata`
- `rss_feeds`: `status` (enum), `last_synced_at`, `health_score` int; hapus `is_active`/`last_fetched_at`/`fetch_interval_minutes`
- `tracked_keywords`: `keyword` (unique), `alert_enabled`, `mention_count` — hapus `user_id`/`is_active`
- `keyword_queries`: `name`, `expression`, `terms` `text[]`, `description` — hapus `user_id`/`query`/dll
- Tetap pertahankan `users`, `user_roles`, `sessions` (lokal)

**B. Helper auth tambahan:**
- `src/lib/auth/roles.ts` — `hasRole(userId, role)` query Drizzle ke `user_roles`
- Tidak menyentuh `requireSupabaseAuth` (masih hidup untuk modul yang belum migrasi)

**C. Catatan:** Server function pakai Drizzle hanya berjalan kalau `DATABASE_URL` di-set dan tabel sudah dimigrasi. Di preview Lovable Cloud, modul yang sudah dimigrasi akan error sampai user jalankan `bun run db:migrate` + `bun run db:migrate-from-supabase` di VPS. Ini sesuai desain "Bertahap untuk deploy VPS".

### Catatan teknis

- Tidak ada perubahan UI di turn ini.
- Tidak ada migrasi SQL Supabase — hanya kode TypeScript.
- File yang disentuh: `src/db/schema.ts` (rewrite), `src/lib/auth/roles.ts` (baru).

Setelah turn ini selesai, balas **"lanjut auth"** untuk modul berikutnya.