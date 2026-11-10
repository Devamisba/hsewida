#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DEPLOYMENT RESMI HSE PT WIDATRA BHAKTI (VPS / aaPanel)
# Repository Monorepo: /www/wwwroot/api.hse.widatra.com
# Path Backend (API) : /www/wwwroot/api.hse.widatra.com/backend (Running: /public)
# Path Frontend (Web): /www/wwwroot/hse.widatra.com/frontend (Running: /)
# ==============================================================================

set -e

REPO_DIR="/www/wwwroot/api.hse.widatra.com"
BACKEND_DIR="/www/wwwroot/api.hse.widatra.com/backend"
FRONTEND_WEB_DIR="/www/wwwroot/hse.widatra.com/frontend"

echo "=========================================================="
echo "  MEMULAI DEPLOYMENT RESMI HSE PT WIDATRA BHAKTI"
echo "  Waktu: $(date)"
echo "=========================================================="

# ------------------------------------------------------------------------------
# 1. PULL REPOSITORY TERBARU DARI GITHUB
# ------------------------------------------------------------------------------
echo ""
echo "[1/3] Menarik kode terbaru dari GitHub (git pull origin main)..."
cd "$REPO_DIR"

# Pastikan credential SSH root tersedia
cp -r /home/sysmin/.ssh/* /root/.ssh/ 2>/dev/null || true

git pull origin main

# ------------------------------------------------------------------------------
# 2. UPDATE & OPTIMASI BACKEND (api.hse.widatra.com)
# ------------------------------------------------------------------------------
echo ""
echo "[2/3] Memproses Backend Laravel di: $BACKEND_DIR"
if [ -d "$BACKEND_DIR" ]; then
    cd "$BACKEND_DIR"

    if [ -f "artisan" ]; then
        echo "--> Mengoptimasi cache Laravel..."
        php artisan optimize:clear
        php artisan config:cache
        php artisan route:cache
        php artisan view:cache
        
        # Atur permission storage & cache
        echo "--> Memperbaiki hak akses direktori storage & bootstrap/cache..."
        chmod -R 775 storage bootstrap/cache 2>/dev/null || true
        chown -R www:www storage bootstrap/cache 2>/dev/null || chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
    fi
    echo "[✓] Backend berhasil dioptimasi!"
else
    echo "[!] Direktori backend tidak ditemukan di: $BACKEND_DIR"
fi

# ------------------------------------------------------------------------------
# 3. DEPLOY FRONTEND DIST KE WEB ROOT (hse.widatra.com)
# ------------------------------------------------------------------------------
echo ""
echo "[3/3] Mendistribusikan Frontend ke Web Root: $FRONTEND_WEB_DIR"
if [ -d "$REPO_DIR/frontend/dist" ]; then
    mkdir -p "$FRONTEND_WEB_DIR"
    
    # Salin seluruh isi dist ke web root hse.widatra.com
    echo "--> Menyalin berkas frontend dist..."
    cp -rf "$REPO_DIR/frontend/dist/"* "$FRONTEND_WEB_DIR/"

    # Atur permission agar web server Nginx dapat melayani file statis
    echo "--> Memperbaiki hak akses direktori web root frontend..."
    chown -R www:www "$FRONTEND_WEB_DIR" 2>/dev/null || chown -R www-data:www-data "$FRONTEND_WEB_DIR" 2>/dev/null || true
    chmod -R 755 "$FRONTEND_WEB_DIR" 2>/dev/null || true

    echo "[✓] Frontend berhasil dideploy!"
else
    echo "[!] Direktori frontend/dist tidak ditemukan di $REPO_DIR/frontend/dist"
fi

echo ""
echo "=========================================================="
echo "  [SELESAI] SELURUH APLIKASI TELAH BERHASIL DIPERBARUI!"
echo "  Frontend Web : https://hse.widatra.com"
echo "  Backend API  : https://api.hse.widatra.com"
echo "=========================================================="
