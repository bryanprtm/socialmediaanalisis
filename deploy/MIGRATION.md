# Migrasi Supabase → PostgreSQL Lokal

Panduan eksekusi migrasi bertahap dari Supabase Cloud ke PostgreSQL native
di VPS Anda. Aplikasi tetap berjalan di tiap fase.

---

## Status Saat Ini: Fase 1 Selesai

Fondasi stack baru sudah ada **berdampingan** dengan Supabase. Aplikasi
masih jalan normal pakai Supabase Cloud. Fase 2 (refactor route per-route)
dan Fase 3 (hapus Supabase) belum dimulai.

Yang sudah disiapkan:

- `src/db/schema.ts` — Drizzle schema (mirror 5 tabel Supabase + `users`, `user_roles`, `sessions`)
- `src/db/client.server.ts` — pg Pool + drizzle client (server-only)
- `src/lib/auth/*` — JWT + bcrypt + cookie session + middleware `requireAuth`
- `scripts/migrate-from-supabase.ts` — penyalin data Supabase → Postgres
- `drizzle.config.ts` + npm scripts `db:generate`, `db:migrate`, `db:push`, `db:studio`

---

## Langkah Instalasi di VPS

### 1. Pastikan PostgreSQL native sudah terpasang

`deploy/install.sh` dengan `DB_MODE=postgres` (default) sudah menangani
ini. Catat `DATABASE_URL` yang dicetak di akhir.

### 2. Tambahkan ke `.env`

```env
DATABASE_URL=postgresql://app_user:PASSWORD@127.0.0.1:5432/app_db
JWT_SECRET=ganti_dengan_64_hex_random
JWT_EXPIRES_IN=7d

# Supabase masih dibutuhkan selama Fase 1-2 (aplikasi masih pakai client lama)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # hanya untuk script migrasi data
```

Generate JWT secret:

```bash
openssl rand -hex 32
```

### 3. Generate & jalankan migrasi Drizzle

```bash
cd /var/www/socialmedia-analisis
bun install
bun run db:generate     # buat file SQL di src/db/migrations/
bun run db:migrate      # apply ke Postgres lokal
```

Cek schema:

```bash
sudo -u postgres psql -d <db_name> -c "\dt"
```

### 4. Salin data dari Supabase Cloud (sekali jalan)

```bash
bun run db:seed-from-supabase
```

Script ini menyalin: `news_articles`, `rss_feeds`, `tracked_keywords`,
`keyword_queries`. Data user (auth) **tidak** disalin — hash password
Supabase tidak kompatibel. Daftar ulang user di halaman `/auth` setelah
Fase 2 selesai, atau seed admin manual:

```sql
-- Hash bisa di-generate: bun -e "import('bcryptjs').then(b => b.hash('admin123', 10).then(console.log))"
INSERT INTO users (email, password_hash, display_name)
VALUES ('admin@example.com', '<hash>', 'Admin');

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM users WHERE email = 'admin@example.com';
```

### 5. Verifikasi

```bash
bun run db:studio       # buka Drizzle Studio di browser, port 4983
```

---

## Roadmap Fase Berikutnya

### Fase 2 — Refactor route & server functions (per modul)

Modul-modul berikut akan dipindah dari `supabase.from(...)` ke
`db.select(...)`:

- `src/lib/rss-sync.functions.ts`
- `src/lib/ai-narrative.functions.ts`
- `src/lib/whatsapp-report.functions.ts`
- `src/lib/sentiment-analysis.functions.ts`
- `src/routes/auth.tsx` → form login/register custom
- `src/routes/_authenticated/route.tsx` → cek JWT cookie
- Semua route (`news`, `dashboard`, `media`, `sentiment`, dst.) yang
  saat ini query Supabase

Otorisasi pindah dari RLS ke kode (server-fn cek `userId === row.user_id`
atau `has_role`).

### Fase 3 — Hapus Supabase

- Hapus `src/integrations/supabase/`, folder `supabase/`
- Uninstall `@supabase/supabase-js`
- Hapus `VITE_SUPABASE_*` dari `.env`
- Hapus `attachSupabaseAuth` dari `src/start.ts`
- Build target Node SSR (sudah default di `install.sh`)

Beri tahu agar Fase 2 dieksekusi.

---

## Troubleshooting

**`bun run db:migrate` error `database "..." does not exist`**
→ Cek `DATABASE_URL` di `.env` cocok dengan yang dibuat `install.sh`.

**`permission denied for schema public`**
→ `sudo -u postgres psql -d <db> -c "GRANT ALL ON SCHEMA public TO <user>;"`

**`JWT_SECRET is not configured`**
→ Set `JWT_SECRET` di `.env` minimal 16 karakter.

**`pg: native binding not found`**
→ Pakai bun (sudah include native build) atau install ulang:
`bun install --force`.
