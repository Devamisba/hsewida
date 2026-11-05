#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DEPLOYMENT OTOMATIS HSE PT WIDATRA BHAKTI (VPS / aaPanel)
# Path Backend : /www/wwwroot/api.hse.widatra.com/backend
# Path Frontend: /www/wwwroot/hse.widatra.com/frontend
# ==============================================================================

set -e

BACKEND_DIR="/www/wwwroot/api.hse.widatra.com/backend"
FRONTEND_DIR="/www/wwwroot/hse.widatra.com/frontend"

echo "=========================================================="
echo "  MEMULAI DEPLOYMENT HSE PT WIDATRA BHAKTI"
echo "  Waktu: $(date)"
echo "=========================================================="

# ------------------------------------------------------------------------------
# 1. UPDATE & DEPLOY BACKEND (api.hse.widatra.com)
# ------------------------------------------------------------------------------
if [ -d "$BACKEND_DIR" ]; then
    echo ""
    echo "[1/2] Memproses Backend di: $BACKEND_DIR"
    cd "$BACKEND_DIR"

    # Jika folder adalah repo git langsung
    if [ -d ".git" ]; then
        echo "--> Menarik update terbaru dari GitHub (git pull)..."
        git pull origin main
    # Jika root repo ada di folder induk
    elif [ -d "../.git" ]; then
        echo "--> Menarik update terbaru dari folder induk..."
        cd .. && git pull origin main && cd "$BACKEND_DIR"
    fi

    # Optimize & Cache Laravel
    if [ -f "artisan" ]; then
        echo "--> Mengoptimasi cache Laravel..."
        php artisan optimize:clear
        php artisan config:cache
        php artisan route:cache
        php artisan view:cache
        
        # Atur permission storage & cache agar www-data / www dapat menulis
        echo "--> Memperbaiki hak akses direktori storage & bootstrap/cache..."
        chmod -R 775 storage bootstrap/cache 2>/dev/null || true
        chown -R www:www storage bootstrap/cache 2>/dev/null || chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
    fi
    echo "[✓] Backend berhasil diperbarui!"
else
    echo "[!] Direktori backend tidak ditemukan di: $BACKEND_DIR (Lewati)"
fi

# ------------------------------------------------------------------------------
# 2. UPDATE & DEPLOY FRONTEND (hse.widatra.com)
# ------------------------------------------------------------------------------
if [ -d "$FRONTEND_DIR" ]; then
    echo ""
    echo "[2/2] Memproses Frontend di: $FRONTEND_DIR"
    cd "$FRONTEND_DIR"

    # Jika folder adalah repo git langsung
    if [ -d ".git" ]; then
        echo "--> Menarik update terbaru dari GitHub (git pull)..."
        git pull origin main
    # Jika root repo ada di folder induk
    elif [ -d "../.git" ]; then
        echo "--> Menarik update terbaru dari folder induk..."
        cd .. && git pull origin main && cd "$FRONTEND_DIR"
    fi

    # Build production jika node/npm tersedia
    if command -v npm &> /dev/null; then
        echo "--> Mengompilasi bundle produksi (npm run build)..."
        npm run build
        echo "--> Memperbaiki hak akses direktori dist..."
        chmod -R 755 dist 2>/dev/null || true
        chown -R www:www dist 2>/dev/null || chown -R www-data:www-data dist 2>/dev/null || true
    else
        echo "--> npm tidak ditemukan di path server. Menggunakan file build dist/ yang telah dikompilasi dari repository."
    fi
    echo "[✓] Frontend berhasil diperbarui!"
else
    echo "[!] Direktori frontend tidak ditemukan di: $FRONTEND_DIR (Lewati)"
fi

echo ""
echo "=========================================================="
echo "  [SELESAI] SELURUH APLIKASI TELAH BERHASIL DIPERBARUI!"
echo "  Frontend : https://hse.widatra.com"
echo "  Backend  : https://api.hse.widatra.com"
echo "=========================================================="
