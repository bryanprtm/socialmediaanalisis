#!/usr/bin/env bash
# Update aplikasi dari git lalu rebuild & restart PM2
set -euo pipefail
APP_NAME="${APP_NAME:-socialmedia-analisis}"
APP_DIR="${APP_DIR:-/var/www/${APP_NAME}}"
APP_USER="${APP_USER:-www-data}"

cd "$APP_DIR"
sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && git pull --ff-only && bun install && bun run build && pm2 restart ${APP_NAME}"
echo "[+] Update selesai."
