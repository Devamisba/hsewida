# 🚀 PANDUAN RESMI PUSH GIT & DEPLOYMENT SERVER aaPanel
## Proyek HSE PT Widatra Bhakti (SIM-K3)

Dokumen ini disusun sebagai **Standard Operating Procedure (SOP)** resmi bagi seluruh tim pengembang (Frontend, Backend, dan Sysadmin). Panduan ini memastikan alur kerja dari komputer lokal ke GitHub hingga server live aaPanel berjalan rapi, konsisten, dan **tepat pada direktori yang telah dikonfigurasi di aaPanel**.

---

## 1. PETA ARSITEKTUR FOLDER SERVER aaPanel

Sesuai konfigurasi situs web di aaPanel Anda:

```
/www/wwwroot/
│
├── api.hse.widatra.com/             <--- REPOSITORI UTAMA (GIT CLONE) & BACKEND
│   ├── .git/                        (Folder pelacak Git dari GitHub)
│   ├── backend/                     (Kode Laravel 11 - PHP 8.4)
│   │   ├── app/
│   │   ├── routes/
│   │   ├── storage/                 (Foto inspeksi, berkas izin, log, cache)
│   │   └── public/                  <--- Menjalankan API Laravel (/public)
│   ├── frontend/                    (Source Code React + Vite)
│   │   ├── src/
│   │   └── dist/                    (File terkompilasi hasil build produksi)
│   └── deploy.sh                    (Skrip otomatisasi deploy server)
│
└── hse.widatra.com/                 <--- INDUK FOLDER SITUS WEB FRONTEND
    │
    └── frontend/                    <--- DIREKTORI SITUS RESMI (DIKUNJUNGI USER)
        ├── assets/                  (Bundle JavaScript & CSS hasil build)
        ├── index.html               (Pintu masuk aplikasi Single Page Application)
        ├── logo-widatra.png         (Aset resmi logo)
        ├── widatra-building.jpg     (Aset resmi background login)
        └── .user.ini                (Keamanan PHP aaPanel)
```

---

## 2. PENGATURAN RESMI SITUS DI aaPANEL

Berikut adalah pengaturan baku menu **Situs web (Websites)** di aaPanel:

| Domain Situs | Direktori Situs | Direktori Menjalankan | Keterangan |
|---|---|---|---|
| **`api.hse.widatra.com`** | `/www/wwwroot/api.hse.widatra.com/backend` | `/public` | API Laravel (Backend) |
| **`hse.widatra.com`** | `/www/wwwroot/hse.widatra.com/frontend` | `/` | Web React (Frontend) |

> ⚠️ **CATATAN PENTING (MENGAPA SEBELUMNYA BINGUNG):**  
> Di folder `/www/wwwroot/hse.widatra.com/` (folder induk luar), sebelumnya sempat tercecer file `index.html`, folder `assets/`, dan file sampah bawaan template Next.js (`next.svg`, `vercel.svg`, dll).  
> **Padahal Nginx hanya membaca file di dalam folder `/frontend/`!**  
> File-file yang tercecer di luar tersebut tidak dibaca oleh website dan hanya membuat bingung.

---

## 3. PEMBERSIHAN SEKALI JALAN DI TERMINAL aaPanel (ONE-TIME CLEANUP)

Jalankan perintah ini **hanya 1 kali** melalui menu **Terminal** di aaPanel (atau SSH root) untuk merapikan seluruh file yang salah tempat dan membuang file sampah:

```bash
# 1. Bersihkan file-file tercecer & sampah template di folder induk luar
cd /www/wwwroot/hse.widatra.com
rm -f file.svg globe.svg next.svg vercel.svg window.svg
rm -f k3-logo.png logo.png widatra-logo.png logo-widatra.jpg
rm -f index.html widatra-building.jpg logo-widatra.png
rm -rf assets

# 2. Pastikan subfolder frontend ada dan bersih
mkdir -p /www/wwwroot/hse.widatra.com/frontend

# 3. Salin hasil build dist resmi terbaru ke dalam /www/wwwroot/hse.widatra.com/frontend/
cp -rf /www/wwwroot/api.hse.widatra.com/frontend/dist/* /www/wwwroot/hse.widatra.com/frontend/

# 4. Atur kepemilikan user www dan hak akses permission
chown -R www:www /www/wwwroot/hse.widatra.com
chmod -R 755 /www/wwwroot/hse.widatra.com

echo "=== PEMBERSIHAN SELESAI: FOLDER SUDAH BERSIH DAN SESUAI DIREKTORI aaPANEL ==="
```

---

## 4. ALUR KERJA DEVELOPER DI KOMPUTER LOKAL (SEBELUM PUSH)

Sebelum mengirimkan kode ke GitHub, ikuti urutan langkah berikut:

### A. Untuk Frontend Developer (Misba):
```bash
# 1. Pastikan cabang lokal up-to-date
git pull origin main

# 2. Lakukan pengerjaan kode di frontend/src/

# 3. WAJIB: Lakukan build produksi lokal agar folder dist/ terupdate
cd frontend
npm run build
cd ..

# 4. Stage, commit, dan push
git add frontend/
git commit -m "feat(frontend): deskripsi pembaruan tampilan/fitur"
git push origin main
```

### B. Untuk Backend Developer (Fayyadh):
```bash
# 1. Pastikan cabang lokal up-to-date
git pull origin main

# 2. Lakukan pengerjaan kode di backend/

# 3. Jika ada migrasi baru, uji coba lokal:
cd backend
php artisan migrate
cd ..

# 4. Stage, commit, dan push
git add backend/
git commit -m "feat(backend): deskripsi penambahan API/migrasi"
git push origin main
```

---

## 5. CHEAT-SHEET PERINTAH DEPLOYMENT DI aaPANEL (SERVER LIVE)

Buka menu **Terminal** di aaPanel (atau SSH root), lalu pilih salah satu perintah sesuai kebutuhan:

### 🌟 Opsi 1: All-in-One Deployment (PALING DIREKOMENDASIKAN)
*Gunakan perintah ini setiap kali ada update. Perintah ini otomatis mengupdate Frontend ke folder `/www/wwwroot/hse.widatra.com/frontend/` sekaligus mengoptimasi Backend Laravel:*
```bash
cd /www/wwwroot/api.hse.widatra.com && cp -r /home/sysmin/.ssh/* /root/.ssh/ 2>/dev/null; git pull origin main && cp -rf frontend/dist/* /www/wwwroot/hse.widatra.com/frontend/ && cd backend && php artisan optimize:clear && echo "=== DEPLOYMENT SELESAI & WEB LIVE TERUPDATE ==="
```

### ⚡ Opsi 2: Update Tampilan Frontend Saja
*Gunakan jika hanya mengubah tombol, template Excel, styling Tailwind, atau teks:*
```bash
cd /www/wwwroot/api.hse.widatra.com && cp -r /home/sysmin/.ssh/* /root/.ssh/ 2>/dev/null; git pull origin main && cp -rf frontend/dist/* /www/wwwroot/hse.widatra.com/frontend/ && echo "=== FRONTEND SELESAI DIUPDATE ==="
```

### 🗄️ Opsi 3: Update Backend dengan Migrasi Database
*Gunakan jika tim backend menambahkan tabel atau kolom baru di database:*
```bash
cd /www/wwwroot/api.hse.widatra.com && cp -r /home/sysmin/.ssh/* /root/.ssh/ 2>/dev/null; git pull origin main && cp -rf frontend/dist/* /www/wwwroot/hse.widatra.com/frontend/ && cd backend && php artisan migrate --force && php artisan optimize:clear && echo "=== BACKEND & DATABASE TERSINKRONISASI ==="
```

### 🤖 Opsi 4: Menggunakan Skrip Otomatis `deploy.sh`
*Jika ingin mengeksekusi skrip bawaan yang ada di server:*
```bash
cd /www/wwwroot/api.hse.widatra.com && bash deploy.sh
```

---

## 6. TROUBLESHOOTING & PANDUAN ANTI-ERROR

### 1. Masalah: Error "Host key verification failed" atau "Permission denied (publickey)" saat `git pull`
**Penyebab:** Kunci SSH GitHub root belum terhubung.  
**Solusi:** Jalankan perintah penyalinan kunci SSH sebelum git pull:
```bash
cp -r /home/sysmin/.ssh/* /root/.ssh/ 2>/dev/null
```

### 2. Masalah: Error "Your local changes to the following files would be overwritten by merge"
**Penyebab:** Ada seseorang yang mengedit file langsung di dalam server aaPanel tanpa melalui Git.  
**Solusi:** Kembalikan (*discard*) perubahan tidak sah di server agar dapat menarik update resmi GitHub:
```bash
cd /www/wwwroot/api.hse.widatra.com
git reset --hard HEAD
git pull origin main
```

### 3. Masalah: Upload Foto Inspeksi atau Berkas Vendor Gagal (Error 500 / Permission Denied)
**Penyebab:** Hak akses folder `storage` ter-reset ke root.  
**Solusi:** Berikan izin akses penuh ke user web `www`:
```bash
cd /www/wwwroot/api.hse.widatra.com/backend
chmod -R 775 storage bootstrap/cache
chown -R www:www storage bootstrap/cache
```

### 4. Masalah: Tampilan di Browser Belum Berubah setelah Deploy
**Penyebab:** Browser menyimpan cache file JavaScript/CSS lama.  
**Solusi:**
- Tekan **`Ctrl + F5`** (Hard Refresh) di browser pengunjung.
- Buka website melalui tab *Incognito / Mode Penyamaran*.

---

## 7. PANDUAN SETUP & DEPLOY SERVER DEV (BRANCH `dev`)

Untuk memfasilitasi pengujian fitur baru tanpa mengganggu sistem produksi, server development (dev) menggunakan branch `dev` dan database terpisah.

### ⚙️ Pengaturan Situs Dev di aaPanel
1. **Database:** Buat database baru bernama `hse_db_dev` di menu **Database** aaPanel.
2. **Backend Dev (`api.hsedev.widatra.com` - Port: `9787`):**
   - Domain di aaPanel: `api.hsedev.widatra.com:9787`
   - Direktori Situs: `/www/wwwroot/api.hsedev.widatra.com/backend`
   - Direktori Menjalankan: `/public`
   - Versi PHP: PHP-8.2
3. **Frontend Dev (`hsedev.widatra.com` - Port: `9686`):**
   - Domain di aaPanel: `hsedev.widatra.com:9686`
   - Direktori Situs: `/www/wwwroot/hsedev.widatra.com/frontend`

### 🚀 Perintah Inisialisasi Pertama Kali Server Dev (Terminal aaPanel):
```bash
# 1. Clone repository khusus branch dev
cd /www/wwwroot
git clone -b dev https://github.com/Devamisba/hsewida.git api.hsedev.widatra.com

# 2. Setup .env Backend Dev (Gunakan DB hse_db_dev & port 9787)
cd /www/wwwroot/api.hsedev.widatra.com/backend
cp .env.example .env
sed -i 's/APP_ENV=production/APP_ENV=local/g' .env
sed -i 's/APP_DEBUG=false/APP_DEBUG=true/g' .env
sed -i 's/DB_DATABASE=hse_db/DB_DATABASE=hse_db_dev/g' .env
sed -i 's|APP_URL=.*|APP_URL=http://api.hsedev.widatra.com:9787|g' .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan storage:link

# 3. Setup Frontend Dev (hsedev.widatra.com)
mkdir -p /www/wwwroot/hsedev.widatra.com/frontend
cp -rf /www/wwwroot/api.hsedev.widatra.com/frontend/dist/* /www/wwwroot/hsedev.widatra.com/frontend/

# 4. Set Hak Akses
chown -R www:www /www/wwwroot/api.hsedev.widatra.com 2>/dev/null || true
chown -R www:www /www/wwwroot/hsedev.widatra.com 2>/dev/null || true
chmod -R 755 /www/wwwroot/api.hsedev.widatra.com
chmod -R 755 /www/wwwroot/hsedev.widatra.com
echo "=== INISIALISASI SERVER DEV SELESAI 100% ==="
```

### 🔄 Perintah Deploy Rutin Server Dev (Setiap Ada Update di Branch `dev`):
```bash
cd /www/wwwroot/api.hsedev.widatra.com && git pull origin dev && php backend/artisan migrate --force && php backend/artisan config:clear && php backend/artisan route:clear && php backend/artisan cache:clear && mkdir -p /www/wwwroot/hsedev.widatra.com/frontend && cp -rf frontend/dist/* /www/wwwroot/hsedev.widatra.com/frontend/ && chown -R www:www /www/wwwroot/hsedev.widatra.com/frontend 2>/dev/null || true && echo "=== SERVER DEV TERUPDATE 100% ==="
```

---

*Dokumen ini merupakan panduan operasional resmi Sistem HSE PT Widatra Bhakti.*
