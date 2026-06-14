# Deploy ke Ubuntu Server (VPS Standalone)

Script otomatis untuk install & menjalankan aplikasi ini di VPS Ubuntu
20.04 / 22.04 / 24.04 menggunakan **Node.js + Bun + PM2 + Nginx**, dengan
opsi database lokal.

## Pilihan Database (VPS standalone)

Aplikasi ini dibangun di atas **PostgreSQL** (Supabase = Postgres + Auth +
RLS). Jadi database yang paling cocok untuk VPS adalah:

| `DB_MODE`   | Engine                       | RAM minimum | Kapan dipilih                                                      |
|-------------|------------------------------|-------------|--------------------------------------------------------------------|
| `postgres`  | PostgreSQL 16 native (default) | 1 GB       | Paling ringan & stabil. Cocok 90% kebutuhan.                       |
| `supabase`  | Supabase self-hosted (Docker)  | 4 GB       | Butuh Auth + Realtime + Storage + Studio UI seperti Lovable Cloud. |
| `none`      | —                              | —          | Tetap pakai Lovable Cloud / Supabase remote (default lama).        |

> **Catatan:** Node.js bukan database — Node hanya runtime. MongoDB / MySQL
> tidak disarankan karena kode (RLS, `auth.users`, migrasi SQL, fungsi
> `has_role`) sudah Postgres-specific.

## Yang akan diinstall

- Node.js 20.x (NodeSource)
- Bun (runtime & package manager)
- PM2 (process manager, auto-restart on boot)
- Nginx (reverse proxy port 80/443 → app)
- UFW firewall (allow SSH + HTTP/HTTPS)
- Certbot (SSL Let's Encrypt, opsional bila `DOMAIN` di-set)
- Build tools (`build-essential`, `python3`, `git`, dll)
- **Database** sesuai `DB_MODE` (PostgreSQL native / Supabase Docker / none)

## Cara pakai

### 1. Clone repo ke VPS

```bash
sudo apt update && sudo apt install -y git
sudo git clone https://github.com/USERNAME/REPO.git /var/www/socialmedia-analisis
cd /var/www/socialmedia-analisis
```

### 2. Jalankan installer

```bash
# Tanpa domain (akses via IP)
sudo bash deploy/install.sh

# Dengan domain + SSL otomatis (pastikan DNS sudah pointing ke IP VPS)
sudo DOMAIN=example.com bash deploy/install.sh
```

Variabel yang bisa di-override:

| Variable    | Default                              | Keterangan                  |
|-------------|--------------------------------------|-----------------------------|
| `APP_NAME`  | `socialmedia-analisis`               | Nama PM2 & nginx site       |
| `APP_DIR`   | `/var/www/${APP_NAME}`               | Direktori aplikasi          |
| `APP_USER`  | `www-data`                           | User pemilik proses         |
| `APP_PORT`  | `3000`                               | Port internal Node          |
| `NODE_MAJOR`| `20`                                 | Versi Node.js mayor         |
| `DOMAIN`    | *(kosong)*                           | Domain untuk Nginx + SSL    |

### 3. Isi `.env`

Setelah install pertama, edit `/var/www/socialmedia-analisis/.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_SUPABASE_PROJECT_ID=xxxx
PORT=3000
NODE_ENV=production
```

Lalu rebuild + restart:

```bash
sudo bash deploy/update.sh
```

## Operasional

```bash
pm2 status                      # cek status proses
pm2 logs socialmedia-analisis   # lihat log realtime
pm2 restart socialmedia-analisis
systemctl status nginx
sudo nginx -t && sudo systemctl reload nginx
```

## Update aplikasi (setelah git push baru)

```bash
sudo bash /var/www/socialmedia-analisis/deploy/update.sh
```

## Catatan

- Aplikasi default build untuk Cloudflare Workers. Installer akan mencoba
  menjalankan `.output/server/index.mjs` (Node SSR); bila tidak ada,
  otomatis fallback ke `bun run preview` sebagai server.
- Untuk production sebaiknya database & auth tetap di **Lovable Cloud /
  Supabase** (tidak perlu install Postgres lokal). Yang berjalan di VPS
  hanya frontend + server function TanStack Start.
