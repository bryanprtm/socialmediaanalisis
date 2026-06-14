
# Migrasi Supabase → PostgreSQL Lokal (Drizzle + JWT)

Aplikasi saat ini sepenuhnya bergantung pada Supabase (5 tabel, RLS, Auth, client SDK, server functions, types generated). Migrasi dikerjakan **bertahap** agar app tetap jalan di tiap langkah.

## Fase yang akan dikerjakan SEKARANG (Fase 1 — Fondasi)

Fase 1 hanya menyiapkan stack baru hidup berdampingan dengan Supabase. **Belum ada route yang dipindah**, jadi aplikasi masih jalan normal pakai Supabase Cloud.

### 1. Dependency baru
- `drizzle-orm`, `drizzle-kit`, `pg`, `@types/pg`
- `bcryptjs`, `@types/bcryptjs`
- `jsonwebtoken`, `@types/jsonwebtoken`
- `dotenv` (untuk drizzle-kit CLI)

### 2. Drizzle setup
```text
src/db/
├── client.ts          # pg Pool + drizzle() — server-only
├── schema.ts          # mirror semua 5 tabel Supabase + users + sessions
└── migrations/        # output drizzle-kit
drizzle.config.ts      # root
```

Schema yang dibuat (mirror dari Supabase, plus auth lokal):
- `users` (id, email, password_hash, created_at, updated_at) — pengganti `auth.users`
- `user_roles` (user_id, role enum: admin/moderator/user)
- `news_articles` (20 kolom — mirror persis)
- `rss_feeds`, `tracked_keywords`, `keyword_queries`
- Trigger `updated_at` via SQL raw

### 3. Auth custom (JWT + bcrypt)
```text
src/lib/auth/
├── password.ts         # bcrypt hash/verify
├── jwt.ts              # sign/verify access token
├── session.server.ts   # cookie httpOnly via @tanstack/react-start/server
└── auth.functions.ts   # register / login / logout / getCurrentUser server fns
```

Auth middleware baru: `src/lib/auth/middleware.ts` (`requireAuth`) — pengganti `requireSupabaseAuth`. Inject `{ userId, user }` ke context.

### 4. Replikasi data (script satu-kali)
`scripts/migrate-from-supabase.ts` — baca semua tabel dari Supabase remote, insert ke Postgres lokal. Dijalankan user di VPS:
```bash
bun run scripts/migrate-from-supabase.ts
```

### 5. install.sh — update
- Set default `DB_MODE=postgres` (sudah ada)
- Tambah step: `bun run db:migrate` (drizzle-kit) setelah `bun install`
- Generate `JWT_SECRET` random 64-hex ke `.env`
- Pesan akhir: instruksi jalankan migrate-from-supabase script

### 6. .env template diperluas
```
DATABASE_URL=postgresql://...
JWT_SECRET=<random 64 hex>
JWT_EXPIRES_IN=7d
# Supabase masih ada selama Fase 1-2 untuk koeksistensi
VITE_SUPABASE_URL=...
```

### 7. Konfig drizzle-kit + package.json scripts
- `db:generate` — generate migration dari schema
- `db:migrate` — apply migration
- `db:studio` — drizzle studio (opsional, ganti Supabase Studio)

## Fase 2 (sesi berikutnya — atas perintah Anda)
Migrasi route/server-fn satu per satu dari `supabase.from(...)` ke `db.select()...`:
- `rss-sync.functions.ts`
- `ai-narrative.functions.ts`
- `whatsapp-report.functions.ts`
- `sentiment-analysis.functions.ts`
- Semua route (`news`, `dashboard`, `media`, dll)
- Halaman `/auth` → form login/register custom
- `_authenticated/route.tsx` → cek cookie JWT (bukan supabase.auth.getUser)

## Fase 3 (final — atas perintah Anda)
- Hapus folder `src/integrations/supabase/`
- Hapus folder `supabase/` (config + migrations)
- Hapus dependency `@supabase/*`
- Hapus var `VITE_SUPABASE_*` dari `.env`
- Hapus `attachSupabaseAuth` dari `src/start.ts`

## Detail Teknis Penting

**Cookie session**: gunakan `useSession` dari `@tanstack/react-start/server` (encrypted httpOnly) menyimpan `{ userId }`. JWT dipakai untuk verifikasi cepat tanpa hit DB.

**RLS gone**: Postgres lokal **tidak pakai RLS**. Otorisasi dilakukan di kode (server fn cek `userId === row.user_id` atau `has_role`). Ini sengaja — RLS Supabase butuh `auth.uid()` JWT claim yang tidak ada di stack baru.

**pg Pool**: 1 pool global di `src/db/client.ts`, hanya di-import dari `.server.ts` / handler server fn (jangan top-level di `.functions.ts`).

**Workers vs VPS runtime**: Stack baru (`pg`, `bcryptjs`, `jsonwebtoken`) **tidak jalan di Cloudflare Workers** — hanya di Node.js (VPS). Jadi setelah Fase 3, target deploy harus Node SSR (`.output/server/index.mjs`), bukan Workers. `install.sh` sudah handle ini.

**Lovable Cloud preview**: selama Fase 1-2, preview di lovable.app tetap pakai Supabase Cloud agar tidak break. Postgres lokal cuma aktif kalau di-deploy ke VPS dengan `DATABASE_URL` di-set.

## File yang akan dibuat/diubah di Fase 1

**Baru:**
- `drizzle.config.ts`
- `src/db/client.ts`
- `src/db/schema.ts`
- `src/lib/auth/password.ts`
- `src/lib/auth/jwt.ts`
- `src/lib/auth/session.server.ts`
- `src/lib/auth/middleware.ts`
- `src/lib/auth/auth.functions.ts`
- `scripts/migrate-from-supabase.ts`
- `deploy/MIGRATION.md` (panduan jalanin script di VPS)

**Diubah:**
- `package.json` (deps + scripts)
- `deploy/install.sh` (drizzle migrate + JWT_SECRET)
- `deploy/README.md` (tambah section migrasi)
- `.env.example` (kalau ada) — bukan `.env` (read-only)

Boleh saya lanjut eksekusi Fase 1?
