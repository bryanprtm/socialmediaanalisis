#!/usr/bin/env bash
# =====================================================================
# Installer VPS FULL LOCAL - tanpa Lovable Cloud, tanpa Lovable API Key
# Stack:
#   - Supabase self-hosted (Docker): Postgres + Auth (GoTrue) + PostgREST
#     + Storage + Studio. App tetap pakai client Supabase, cukup arahkan
#     VITE_SUPABASE_URL ke http://<IP-VPS>:8000.
#   - Node.js 20 + Bun + PM2 + Nginx untuk aplikasi TanStack Start.
#   - OpenAI token (opsional, disimpan ke .env) untuk analisa AI.
#
# Target: Ubuntu Server 22.04 / 24.04, minimal 4GB RAM, 2 vCPU, 20GB disk.
#
# Cara pakai (dari dalam repo):
#   sudo bash deploy/install-local.sh
#
# Variabel opsional:
#   APP_NAME, APP_DIR, APP_PORT, DOMAIN, OPENAI_API_KEY
# =====================================================================
set -euo pipefail

APP_NAME="${APP_NAME:-socialmedia-analisis}"
APP_DIR="${APP_DIR:-/var/www/${APP_NAME}}"
APP_USER="${APP_USER:-www-data}"
APP_PORT="${APP_PORT:-3000}"
NODE_MAJOR="${NODE_MAJOR:-20}"
DOMAIN="${DOMAIN:-}"
OPENAI_API_KEY="${OPENAI_API_KEY:-}"

SUPA_DIR="/opt/supabase-local"
SUPA_PORT_KONG="${SUPA_PORT_KONG:-8000}"   # PostgREST + Auth gateway
SUPA_PORT_STUDIO="${SUPA_PORT_STUDIO:-8001}"

log()  { echo -e "\e[1;32m[+] $*\e[0m"; }
warn() { echo -e "\e[1;33m[!] $*\e[0m"; }
err()  { echo -e "\e[1;31m[x] $*\e[0m" >&2; }

if [[ $EUID -ne 0 ]]; then
  err "Jalankan sebagai root: sudo bash $0"; exit 1
fi

# ---------------------------------------------------------------------
# 0. IP publik untuk URL Supabase
# ---------------------------------------------------------------------
PUBLIC_IP="$(curl -fsSL ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
SUPA_PUBLIC_URL="${DOMAIN:+https://${DOMAIN}}"
SUPA_PUBLIC_URL="${SUPA_PUBLIC_URL:-http://${PUBLIC_IP}:${SUPA_PORT_KONG}}"
log "IP publik  : ${PUBLIC_IP}"
log "Supabase URL: ${SUPA_PUBLIC_URL}"

# ---------------------------------------------------------------------
# 1. Dependency dasar
# ---------------------------------------------------------------------
log "Install dependency dasar..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl wget git ca-certificates gnupg lsb-release openssl \
  build-essential python3 unzip ufw nginx rsync jq apt-transport-https

# ---------------------------------------------------------------------
# 2. Docker + Docker Compose plugin
# ---------------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "Install Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin || true
fi

# ---------------------------------------------------------------------
# 3. Supabase self-hosted stack
# ---------------------------------------------------------------------
if [[ ! -d "$SUPA_DIR/docker" ]]; then
  log "Clone Supabase self-hosted..."
  git clone --depth 1 https://github.com/supabase/supabase "$SUPA_DIR"
fi
cd "$SUPA_DIR/docker"
[[ -f .env ]] || cp .env.example .env

# Generate secret unik (Postgres pass, JWT secret, anon+service JWT)
if ! grep -q "LOVABLE_LOCAL_INIT=1" .env; then
  log "Generate secret Supabase (Postgres, JWT anon/service)..."
  POSTGRES_PASSWORD="$(openssl rand -hex 24)"
  JWT_SECRET="$(openssl rand -hex 32)"          # >=32 char wajib
  DASHBOARD_USER="admin"
  DASHBOARD_PASS="$(openssl rand -hex 12)"

  # Buat JWT anon + service_role pakai container node sementara
  gen_jwt() {
    local role="$1"
    docker run --rm -e SECRET="$JWT_SECRET" -e ROLE="$role" node:20-alpine sh -c '
      npm i -s jsonwebtoken >/dev/null 2>&1
      node -e "const j=require(\"jsonwebtoken\");console.log(j.sign({role:process.env.ROLE,iss:\"supabase\",iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+60*60*24*365*10},process.env.SECRET))"
    '
  }
  ANON_KEY="$(gen_jwt anon)"
  SERVICE_ROLE_KEY="$(gen_jwt service_role)"

  sed -i \
    -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" \
    -e "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" \
    -e "s|^ANON_KEY=.*|ANON_KEY=${ANON_KEY}|" \
    -e "s|^SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}|" \
    -e "s|^DASHBOARD_USERNAME=.*|DASHBOARD_USERNAME=${DASHBOARD_USER}|" \
    -e "s|^DASHBOARD_PASSWORD=.*|DASHBOARD_PASSWORD=${DASHBOARD_PASS}|" \
    -e "s|^SITE_URL=.*|SITE_URL=${SUPA_PUBLIC_URL%/}|" \
    -e "s|^API_EXTERNAL_URL=.*|API_EXTERNAL_URL=${SUPA_PUBLIC_URL%/}|" \
    -e "s|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=${SUPA_PUBLIC_URL%/}|" \
    -e "s|^KONG_HTTP_PORT=.*|KONG_HTTP_PORT=${SUPA_PORT_KONG}|" \
    -e "s|^STUDIO_PORT=.*|STUDIO_PORT=${SUPA_PORT_STUDIO}|" \
    -e "s|^ENABLE_EMAIL_SIGNUP=.*|ENABLE_EMAIL_SIGNUP=true|" \
    -e "s|^ENABLE_EMAIL_AUTOCONFIRM=.*|ENABLE_EMAIL_AUTOCONFIRM=true|" \
    .env
  echo "LOVABLE_LOCAL_INIT=1" >> .env
  echo "${POSTGRES_PASSWORD}" > "$SUPA_DIR/.postgres_password"
  echo "${DASHBOARD_PASS}"    > "$SUPA_DIR/.dashboard_password"
  echo "${ANON_KEY}"          > "$SUPA_DIR/.anon_key"
  echo "${SERVICE_ROLE_KEY}"  > "$SUPA_DIR/.service_key"
  chmod 600 "$SUPA_DIR"/.postgres_password "$SUPA_DIR"/.dashboard_password \
            "$SUPA_DIR"/.anon_key "$SUPA_DIR"/.service_key
else
  log "Supabase .env sudah diinisialisasi sebelumnya — pakai secret existing."
  ANON_KEY="$(cat "$SUPA_DIR/.anon_key")"
  SERVICE_ROLE_KEY="$(cat "$SUPA_DIR/.service_key")"
  POSTGRES_PASSWORD="$(cat "$SUPA_DIR/.postgres_password")"
  DASHBOARD_PASS="$(cat "$SUPA_DIR/.dashboard_password")"
fi

log "Pull & start container Supabase (mungkin 3-5 menit pertama kali)..."
docker compose pull
docker compose up -d

# Tunggu Postgres siap
log "Tunggu Postgres siap..."
for i in {1..60}; do
  if docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
    log "Postgres READY."; break
  fi
  sleep 2
done

# ---------------------------------------------------------------------
# 4. Import skema migrasi aplikasi ke Postgres lokal
# ---------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$REPO_ROOT/supabase/migrations"
if [[ -d "$MIGRATIONS_DIR" ]]; then
  log "Import migrasi aplikasi ke Postgres lokal..."
  for f in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
    echo "  -> $(basename "$f")"
    docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=0 < "$f" \
      >/tmp/mig.log 2>&1 || warn "Migrasi $(basename "$f") ada error — cek /tmp/mig.log"
  done
else
  warn "Folder supabase/migrations tidak ditemukan, skip import skema."
fi

# ---------------------------------------------------------------------
# 5. Node + Bun + PM2
# ---------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  log "Install Node.js ${NODE_MAJOR}.x..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
  apt-get install -y nodejs
fi
command -v bun >/dev/null 2>&1 || { curl -fsSL https://bun.sh/install | bash; ln -sf "$HOME/.bun/bin/bun" /usr/local/bin/bun; }
command -v pm2 >/dev/null 2>&1 || npm install -g pm2

# ---------------------------------------------------------------------
# 6. Copy source & bikin .env aplikasi
# ---------------------------------------------------------------------
mkdir -p "$APP_DIR"
if [[ -f "$REPO_ROOT/package.json" ]]; then
  log "Copy source ke ${APP_DIR}..."
  rsync -a --delete \
    --exclude node_modules --exclude .git --exclude dist --exclude .output \
    "$REPO_ROOT"/ "$APP_DIR"/
fi
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

log "Tulis .env aplikasi (arahkan ke Supabase lokal)..."
cat > "$APP_DIR/.env" <<EOF
# === App ===
PORT=${APP_PORT}
NODE_ENV=production

# === Supabase LOKAL (self-hosted di VPS ini) ===
VITE_SUPABASE_URL=${SUPA_PUBLIC_URL%/}
VITE_SUPABASE_PUBLISHABLE_KEY=${ANON_KEY}
VITE_SUPABASE_PROJECT_ID=local
SUPABASE_URL=${SUPA_PUBLIC_URL%/}
SUPABASE_PUBLISHABLE_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}

# === AI: OpenAI langsung, tanpa Lovable Gateway ===
OPENAI_API_KEY=${OPENAI_API_KEY}
# Kosongkan supaya kode fallback ke Lovable Gateway tidak dipakai
LOVABLE_API_KEY=
EOF
chown "$APP_USER":"$APP_USER" "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"

# ---------------------------------------------------------------------
# 7. Install deps + build + PM2
# ---------------------------------------------------------------------
log "bun install + build..."
sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && bun install && bun run build"

cat > "$APP_DIR/ecosystem.config.cjs" <<EOF
module.exports = {
  apps: [{
    name: "${APP_NAME}",
    script: "bun",
    args: "run preview -- --host 0.0.0.0 --port ${APP_PORT}",
    cwd: "${APP_DIR}",
    env: { NODE_ENV: "production", PORT: "${APP_PORT}", HOST: "0.0.0.0" },
    max_memory_restart: "512M"
  }]
};
EOF
if [[ -f "$APP_DIR/.output/server/index.mjs" ]]; then
  sed -i 's|script: "bun"|script: "node"|; s|args: "run preview.*"|args: ".output/server/index.mjs"|' \
    "$APP_DIR/ecosystem.config.cjs"
fi
chown "$APP_USER":"$APP_USER" "$APP_DIR/ecosystem.config.cjs"
sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && pm2 start ecosystem.config.cjs && pm2 save"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp /var/www >/dev/null || true

# ---------------------------------------------------------------------
# 8. Nginx reverse proxy
# ---------------------------------------------------------------------
log "Konfigurasi Nginx..."
NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"
cat > "$NGINX_CONF" <<EOF
server {
  listen 80;
  server_name ${DOMAIN:-_};
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
nginx -t && systemctl reload nginx && systemctl enable nginx

# ---------------------------------------------------------------------
# 9. Firewall + SSL opsional
# ---------------------------------------------------------------------
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw allow "${SUPA_PORT_KONG}"/tcp || true
ufw allow "${SUPA_PORT_STUDIO}"/tcp || true
yes | ufw enable || true

if [[ -n "$DOMAIN" ]]; then
  log "Request SSL Let's Encrypt untuk ${DOMAIN}..."
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@${DOMAIN}" --redirect \
    || warn "Certbot gagal — pastikan DNS sudah pointing ke ${PUBLIC_IP}."
fi

# ---------------------------------------------------------------------
# 10. Ringkasan
# ---------------------------------------------------------------------
log "SELESAI!"
cat <<EOF
----------------------------------------------------------------
 Aplikasi        : http://${DOMAIN:-$PUBLIC_IP}
 Supabase API    : ${SUPA_PUBLIC_URL}
 Supabase Studio : http://${PUBLIC_IP}:${SUPA_PORT_STUDIO}
   user: admin
   pass: ${DASHBOARD_PASS}
 Postgres        : localhost:5432  (user: postgres  pass: ${POSTGRES_PASSWORD})
 App dir         : ${APP_DIR}
 App .env        : ${APP_DIR}/.env  (OPENAI_API_KEY di sini, atau isi via UI /settings)
----------------------------------------------------------------
 CATATAN:
 - Tidak pakai Lovable Cloud, tidak pakai LOVABLE_API_KEY.
 - Analisa AI pakai OPENAI_API_KEY. Admin bisa ganti/isi dari
   halaman /settings tanpa perlu redeploy.
 - Semua data (auth, artikel, RLS) tersimpan di Postgres VPS ini.
 - Backup: docker compose exec -T db pg_dumpall -U postgres > backup.sql
----------------------------------------------------------------
EOF
