#!/usr/bin/env bash
# =====================================================================
# Quick-start installer untuk Ubuntu Server 24.04 LTS
# One-liner:
#   curl -fsSL https://raw.githubusercontent.com/USERNAME/REPO/main/deploy/ubuntu24-quickstart.sh | sudo bash
#
# Variabel opsional (export sebelum jalan):
#   REPO_URL   : URL git repo (wajib bila script ini dijalankan via curl)
#   APP_NAME   : nama aplikasi (default: socialmedia-analisis)
#   APP_DIR    : direktori install (default: /var/www/${APP_NAME})
#   APP_PORT   : port internal Node (default: 3000)
#   DOMAIN     : domain untuk Nginx + SSL Let's Encrypt (opsional)
#   DB_MODE    : postgres | supabase | none (default: postgres)
# =====================================================================
set -euo pipefail

APP_NAME="${APP_NAME:-socialmedia-analisis}"
APP_DIR="${APP_DIR:-/var/www/${APP_NAME}}"
REPO_URL="${REPO_URL:-}"

log()  { echo -e "\e[1;32m[+] $*\e[0m"; }
warn() { echo -e "\e[1;33m[!] $*\e[0m"; }
err()  { echo -e "\e[1;31m[x] $*\e[0m" >&2; }

if [[ $EUID -ne 0 ]]; then
  err "Jalankan sebagai root. Contoh: sudo bash $0"
  exit 1
fi

# Pastikan jalan di Ubuntu 24.04 (tetap dilanjut untuk 22.04 / 20.04)
if [[ -r /etc/os-release ]]; then
  . /etc/os-release
  if [[ "${ID:-}" != "ubuntu" ]]; then
    warn "Distro terdeteksi: ${PRETTY_NAME:-unknown}. Script ini dioptimalkan untuk Ubuntu 24.04."
  else
    log "Detected: ${PRETTY_NAME}"
  fi
fi

log "Install prasyarat dasar (git, curl, sudo, openssl)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl sudo ca-certificates openssl lsb-release

# ---------------------------------------------------------------------
# Clone / update repo
# ---------------------------------------------------------------------
if [[ ! -d "$APP_DIR/.git" ]]; then
  if [[ -z "$REPO_URL" ]]; then
    err "REPO_URL belum di-set. Jalankan ulang:"
    err "  sudo REPO_URL=https://github.com/USER/REPO.git bash $0"
    exit 1
  fi
  log "Clone repo $REPO_URL ke $APP_DIR..."
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPO_URL" "$APP_DIR"
else
  log "Repo sudah ada di $APP_DIR — git pull..."
  git -C "$APP_DIR" pull --ff-only || warn "git pull gagal, lanjut dengan source lokal."
fi

if [[ ! -f "$APP_DIR/deploy/install.sh" ]]; then
  err "deploy/install.sh tidak ditemukan di $APP_DIR. Pastikan REPO_URL benar."
  exit 1
fi

# ---------------------------------------------------------------------
# Jalankan installer utama
# ---------------------------------------------------------------------
log "Menjalankan installer utama (deploy/install.sh)..."
chmod +x "$APP_DIR/deploy/install.sh" "$APP_DIR/deploy/update.sh" 2>/dev/null || true
bash "$APP_DIR/deploy/install.sh"

log "Selesai. Cek status: pm2 status && systemctl status nginx"
