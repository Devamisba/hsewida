# 🚀 PANDUAN LENGKAP PUSH GIT & DEPLOYMENT SERVER aaPanel
## Proyek HSE PT Widatra Bhakti (SIM-K3)

Dokumen ini disusun sebagai **Standard Operating Procedure (SOP)** resmi bagi tim pengembang (Frontend, Backend, dan Sysadmin) agar alur sinkronisasi dari komputer lokal ke repositori GitHub hingga server produksi aaPanel berjalan rapi, konsisten, dan **bebas dari salah folder atau duplikasi file**.

---

## 1. PETA ARSITEKTUR FOLDER SERVER aaPanel

Di server VPS aaPanel, sistem menggunakan konfigurasi **2 domain terpisah**:

```
/www/wwwroot/
│
├── api.hse.widatra.com/             <--- REPOSITORI UTAMA (GIT CLONE) & BACKEND
│   ├── .git/                        (Folder pelacak Git dari GitHub)
│   ├── backend/                     (Kode Laravel 11 - PHP 8.4)
│   │   ├── app/
│   │   ├── routes/
│   │   ├── storage/                 (Foto inspeksi, berkas izin, cache)
│   │   └── public/                  <--- Menjalankan API Laravel (/public)
│   ├── frontend/                    (Source Code React + Vite)
│   │   ├── src/
│   │   └── dist/                    (File terkompilasi hasil build produksi)
│   └── deploy.sh                    (Skrip otomatisasi deploy server)
│
└── hse.widatra.com/                 <--- WEB ROOT FRONTEND (DIKUNJUNGI USER)
    ├── assets/                      (File bundle JS & CSS hasil build)
    ├── index.html                   (Pintu masuk aplikasi Single Page Application)
    ├── logo-widatra.png             (Aset resmi logo)
    ├── widatra-building.jpg         (Aset resmi background login)
    └── .user.ini                    (Keamanan PHP aaPanel)
```

> ⚠️ **ATURAN EMAS PATH:**  
> - Folder `hse.widatra.com/` **TIDAK MEMILIKI** subfolder `frontend/` lagi.
> - Seluruh file build dari `api.hse.widatra.com/frontend/dist/*` langsung disalin ke root `hse.widatra.com/`.

---

## 2. PENGATURAN RESMI SITUS DI aaPANEL

Pastikan pengaturan menu **Situs web (Websites)** di aaPanel mengikuti konfigurasi standar berikut:

| Domain | Direktori Situs | Direktori Menjalankan | Keterangan |
|---|---|---|---|
| **`api.hse.widatra.com`** | `/www/wwwroot/api.hse.widatra.com/backend` | `/public` | API Laravel (Backend) |
| **`hse.widatra.com`** | `/www/wwwroot/hse.widatra.com` | `/` | Web React (Frontend) |

---

## 3. PEMBERSIHAN SEKALI JALAN (ONE-TIME CLEANUP)

Jika di server Anda saat ini masih terdapat file-file sampah bekas template lama atau subfolder `frontend/` duplikat, jalankan perintah pembersihan ini **hanya 1 kali** melalui Terminal aaPanel / SSH:

```bash
# Masuk ke folder web frontend
cd /www/wwwroot/hse.widatra.com

# Hapus file-file sampah template Next.js/Vercel lama
rm -f file.svg globe.svg next.svg vercel.svg window.svg

# Hapus logo-logo lama yang sudah usang
rm -f k3-logo.png logo.png widatra-logo.png logo-widatra.jpg

# Hapus subfolder frontend duplikat lama
rm -rf frontend

# Salin ulang file dist resmi terbaru dari repositori
cp -rf /www/wwwroot/api.hse.widatra.com/frontend/dist/* /www/wwwroot/hse.widatra.com/

# Perbaiki kepemilikan dan hak akses file
chown -R www:www /www/wwwroot/hse.widatra.com
chmod -R 755 /www/wwwroot/hse.widatra.com

echo "=== PEMBERSIHAN SELESAI: FOLDER SUDAH BERSIH DAN RAPI ==="
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
*Gunakan perintah ini setiap kali ada update. Perintah ini otomatis mengupdate Frontend sekaligus Backend dan membersihkan cache Laravel:*
```bash
cd /www/wwwroot/api.hse.widatra.com && cp -r /home/sysmin/.ssh/* /root/.ssh/ 2>/dev/null; git pull origin main && cp -rf frontend/dist/* /www/wwwroot/hse.widatra.com/ && cd backend && php artisan optimize:clear && echo "=== DEPLOYMENT SELESAI & WEB LIVE TERUPDATE ==="
```

### ⚡ Opsi 2: Update Tampilan Frontend Saja
*Gunakan jika hanya mengubah tombol, template Excel, styling Tailwind, atau teks:*
```bash
cd /www/wwwroot/api.hse.widatra.com && cp -r /home/sysmin/.ssh/* /root/.ssh/ 2>/dev/null; git pull origin main && cp -rf frontend/dist/* /www/wwwroot/hse.widatra.com/ && echo "=== FRONTEND SELESAI DIUPDATE ==="
```

### 🗄️ Opsi 3: Update Backend dengan Migrasi Database
*Gunakan jika tim backend menambahkan tabel atau kolom baru di database:*
```bash
cd /www/wwwroot/api.hse.widatra.com && cp -r /home/sysmin/.ssh/* /root/.ssh/ 2>/dev/null; git pull origin main && cp -rf frontend/dist/* /www/wwwroot/hse.widatra.com/ && cd backend && php artisan migrate --force && php artisan optimize:clear && echo "=== BACKEND & DATABASE TERSINKRONISASI ==="
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

*Dokumen ini merupakan panduan operasional resmi Sistem HSE PT Widatra Bhakti.*
