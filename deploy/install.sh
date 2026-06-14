#!/usr/bin/env bash
# =====================================================================
# Auto-install script untuk Ubuntu Server (20.04 / 22.04 / 24.04)
# Aplikasi: TanStack Start (Node.js runtime) - VPS Standalone
# Usage:   sudo bash deploy/install.sh
# =====================================================================
set -euo pipefail

APP_NAME="${APP_NAME:-socialmedia-analisis}"
APP_DIR="${APP_DIR:-/var/www/${APP_NAME}}"
APP_USER="${APP_USER:-www-data}"
APP_PORT="${APP_PORT:-3000}"
NODE_MAJOR="${NODE_MAJOR:-20}"
DOMAIN="${DOMAIN:-}"          # opsional, contoh: export DOMAIN=example.com

# Database mode:
#   postgres  -> install PostgreSQL 16 native (default, ringan, cocok VPS)
#   supabase  -> install Supabase self-hosted via Docker (butuh >=4GB RAM)
#   none      -> tidak install DB lokal (pakai Lovable Cloud / Supabase remote)
DB_MODE="${DB_MODE:-postgres}"
PG_VERSION="${PG_VERSION:-16}"
PG_DB="${PG_DB:-${APP_NAME//-/_}}"
PG_USER="${PG_USER:-${APP_NAME//-/_}_user}"
PG_PASSWORD="${PG_PASSWORD:-$(openssl rand -hex 16 2>/dev/null || echo "ChangeMe$(date +%s)")}"
JWT_SECRET_VALUE="${JWT_SECRET:-$(openssl rand -hex 32 2>/dev/null || echo "change_me_$(date +%s%N)")}"

log()  { echo -e "\e[1;32m[+] $*\e[0m"; }
warn() { echo -e "\e[1;33m[!] $*\e[0m"; }
err()  { echo -e "\e[1;31m[x] $*\e[0m" >&2; }

if [[ $EUID -ne 0 ]]; then
  err "Jalankan sebagai root: sudo bash $0"
  exit 1
fi

# ---------------------------------------------------------------------
# 1. Update sistem & dependency dasar
# ---------------------------------------------------------------------
log "Update apt & install dependency dasar..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  curl wget git ca-certificates gnupg lsb-release openssl \
  build-essential python3 unzip ufw nginx rsync \
  software-properties-common apt-transport-https

# ---------------------------------------------------------------------
# 1b. Database (PostgreSQL native / Supabase self-hosted / none)
# ---------------------------------------------------------------------
case "$DB_MODE" in
  postgres)
    log "Install PostgreSQL ${PG_VERSION} (native)..."
    install -d /usr/share/postgresql-common/pgdg
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
      -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
    echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
      > /etc/apt/sources.list.d/pgdg.list
    apt-get update -y
    apt-get install -y "postgresql-${PG_VERSION}" "postgresql-contrib-${PG_VERSION}"
    systemctl enable --now postgresql

    log "Buat database & user aplikasi..."
    sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${PG_USER}'" | grep -q 1 || \
      sudo -u postgres psql -c "CREATE USER ${PG_USER} WITH ENCRYPTED PASSWORD '${PG_PASSWORD}';"
    sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${PG_DB}'" | grep -q 1 || \
      sudo -u postgres createdb -O "${PG_USER}" "${PG_DB}"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${PG_DB} TO ${PG_USER};"
    sudo -u postgres psql -d "${PG_DB}" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
    DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@127.0.0.1:5432/${PG_DB}"
    log "DATABASE_URL siap (disimpan ke .env)."
    ;;
  supabase)
    log "Install Docker + Supabase self-hosted stack..."
    if ! command -v docker >/dev/null 2>&1; then
      curl -fsSL https://get.docker.com | sh
      systemctl enable --now docker
    fi
    SUPA_DIR="/opt/supabase"
    if [[ ! -d "$SUPA_DIR" ]]; then
      git clone --depth 1 https://github.com/supabase/supabase "$SUPA_DIR"
    fi
    mkdir -p "$SUPA_DIR/project"
    cp -n "$SUPA_DIR/docker/.env.example" "$SUPA_DIR/project/.env" || true
    cp -rn "$SUPA_DIR/docker/." "$SUPA_DIR/project/" || true
    ( cd "$SUPA_DIR/project" && docker compose pull && docker compose up -d )
    warn "Supabase stack jalan di port 8000 (Studio) & 5432 (Postgres)."
    warn "Edit ${SUPA_DIR}/project/.env untuk ganti password/JWT secret, lalu 'docker compose up -d' ulang."
    DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres"
    ;;
  none)
    warn "DB_MODE=none — tidak install database lokal. App akan pakai Supabase remote dari .env."
    DATABASE_URL=""
    ;;
  *)
    err "DB_MODE tidak dikenal: ${DB_MODE} (gunakan postgres | supabase | none)"
    exit 1
    ;;
esac

# ---------------------------------------------------------------------
# 2. Node.js (NodeSource) + npm
# ---------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]]; then
  log "Install Node.js v${NODE_MAJOR}.x..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
  apt-get install -y nodejs
else
  log "Node.js sudah terinstall: $(node -v)"
fi

# ---------------------------------------------------------------------
# 3. Bun (package manager & runtime cepat)
# ---------------------------------------------------------------------
if ! command -v bun >/dev/null 2>&1; then
  log "Install Bun..."
  curl -fsSL https://bun.sh/install | bash
  ln -sf "$HOME/.bun/bin/bun" /usr/local/bin/bun
fi

# ---------------------------------------------------------------------
# 4. PM2 process manager
# ---------------------------------------------------------------------
if ! command -v pm2 >/dev/null 2>&1; then
  log "Install PM2..."
  npm install -g pm2
fi

# ---------------------------------------------------------------------
# 5. Siapkan direktori aplikasi
# ---------------------------------------------------------------------
log "Siapkan direktori ${APP_DIR}..."
mkdir -p "$APP_DIR"

# Jika dijalankan dari dalam repo, copy source-nya. Kalau tidak, user harus git clone manual.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
if [[ -f "$REPO_ROOT/package.json" ]]; then
  log "Copy source code dari ${REPO_ROOT} ke ${APP_DIR}..."
  rsync -a --delete \
    --exclude node_modules --exclude .git --exclude dist --exclude .output \
    "$REPO_ROOT"/ "$APP_DIR"/
fi

if [[ ! -f "$APP_DIR/package.json" ]]; then
  err "package.json tidak ditemukan di ${APP_DIR}. Clone repo dulu ke ${APP_DIR}, lalu jalankan ulang."
  exit 1
fi

chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

# ---------------------------------------------------------------------
# 6. .env (Supabase / Lovable Cloud)
# ---------------------------------------------------------------------
if [[ ! -f "$APP_DIR/.env" ]]; then
  warn ".env belum ada. Membuat template..."
  cat > "$APP_DIR/.env" <<EOF
# === App ===
PORT=${APP_PORT}
NODE_ENV=production

# === Database lokal (DB_MODE=${DB_MODE}) ===
DATABASE_URL=${DATABASE_URL}

# === Auth lokal (JWT + bcrypt) ===
JWT_SECRET=${JWT_SECRET_VALUE}
JWT_EXPIRES_IN=7d

# === Supabase remote (kosongkan setelah Fase 3 migrasi selesai) ===
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EOF
  chown "$APP_USER":"$APP_USER" "$APP_DIR/.env"
  warn "Edit ${APP_DIR}/.env sebelum start aplikasi."
fi

# ---------------------------------------------------------------------
# 7. Install dependencies & build
# ---------------------------------------------------------------------
log "Install dependencies (bun install)..."
sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && bun install --frozen-lockfile || bun install"

if [[ "$DB_MODE" == "postgres" || "$DB_MODE" == "supabase" ]]; then
  log "Generate & apply migrasi Drizzle..."
  sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && bun run db:generate || true"
  sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && bun run db:migrate || warn 'drizzle migrate gagal — jalankan manual: bun run db:migrate'"
fi

log "Build production..."
sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && bun run build"

# ---------------------------------------------------------------------
# 8. PM2 ecosystem
# ---------------------------------------------------------------------
log "Setup PM2..."
cat > "$APP_DIR/ecosystem.config.cjs" <<EOF
module.exports = {
  apps: [{
    name: "${APP_NAME}",
    script: "node",
    args: ".output/server/index.mjs",
    cwd: "${APP_DIR}",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: "${APP_PORT}",
      HOST: "0.0.0.0"
    },
    max_memory_restart: "512M"
  }]
};
EOF
chown "$APP_USER":"$APP_USER" "$APP_DIR/ecosystem.config.cjs"

# Jika output server tidak ada (mis. build target Cloudflare), pakai vite preview sebagai fallback.
if [[ ! -f "$APP_DIR/.output/server/index.mjs" ]]; then
  warn ".output/server/index.mjs tidak ditemukan, fallback ke 'bun run preview'."
  sed -i 's|script: "node"|script: "bun"|' "$APP_DIR/ecosystem.config.cjs"
  sed -i 's|args: ".output/server/index.mjs"|args: "run preview -- --host 0.0.0.0 --port '"${APP_PORT}"'"|' "$APP_DIR/ecosystem.config.cjs"
fi

sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && pm2 start ecosystem.config.cjs && pm2 save"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp "/var/www" >/dev/null || true

# ---------------------------------------------------------------------
# 9. Nginx reverse proxy
# ---------------------------------------------------------------------
log "Konfigurasi Nginx..."
NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"
SERVER_NAME="${DOMAIN:-_}"
cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name ${SERVER_NAME};

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 90;
    }
}
EOF
ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/${APP_NAME}"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
systemctl enable nginx

# ---------------------------------------------------------------------
# 10. Firewall
# ---------------------------------------------------------------------
log "Konfigurasi UFW firewall..."
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
yes | ufw enable || true

# ---------------------------------------------------------------------
# 11. SSL (opsional, jika DOMAIN di-set)
# ---------------------------------------------------------------------
if [[ -n "$DOMAIN" ]]; then
  log "Install certbot & request SSL untuk ${DOMAIN}..."
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@${DOMAIN}" --redirect || \
    warn "Certbot gagal — pastikan DNS sudah arahkan ke server ini."
fi

log "Selesai!"
echo "----------------------------------------------------------------"
echo " Aplikasi : ${APP_NAME}"
echo " Direktori: ${APP_DIR}"
echo " Port     : ${APP_PORT}"
echo " Domain   : ${DOMAIN:-(belum di-set, akses via IP)}"
echo " DB Mode  : ${DB_MODE}"
if [[ "$DB_MODE" == "postgres" ]]; then
  echo " DB Name  : ${PG_DB}"
  echo " DB User  : ${PG_USER}"
  echo " DB Pass  : ${PG_PASSWORD}"
  echo " DB URL   : ${DATABASE_URL}"
  warn "Simpan password DB di tempat aman & hapus dari log!"
elif [[ "$DB_MODE" == "supabase" ]]; then
  echo " Supabase : http://<IP>:8000  (Studio)"
  echo " Stack    : /opt/supabase/project (docker compose)"
fi
echo " JWT Sec  : ${JWT_SECRET_VALUE}"
warn "Simpan JWT_SECRET di tempat aman."
echo ""
echo " >> Migrasi data dari Supabase Cloud (opsional, sekali jalan):"
echo "    1. Isi SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY di ${APP_DIR}/.env"
echo "    2. sudo -u ${APP_USER} bash -lc 'cd ${APP_DIR} && bun run db:seed-from-supabase'"
echo "    Lihat ${APP_DIR}/deploy/MIGRATION.md untuk detail."
echo ""
echo " Cek      : pm2 status | systemctl status nginx"
echo " Logs     : pm2 logs ${APP_NAME}"
echo "----------------------------------------------------------------"
