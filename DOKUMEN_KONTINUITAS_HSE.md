=================================================================================================================================
                    DOKUMEN KONTINUITAS & SISTEM HSE (DIGITAL WORK PERMIT & SAFETY MONITORING)
                                              PT WIDATRA BHAKTI
=================================================================================================================================

A. Informasi Arsitektur & Lingkungan Server (LOKAL vs SERVER LIVE aaPanel)

+-----------------------+----------------------------------------------------+---------------------------------------------------+
| Komponen              | Lingkungan Lokal (Development)                     | Server LIVE / Production (aaPanel)                |
+-----------------------+----------------------------------------------------+---------------------------------------------------+
| Domain Frontend       | http://localhost:5173                              | https://hse.widatra.com (Static / Port 443 SSL)   |
| Path Root Frontend    | C:\Users\W I N D O W S\Documents\hse\frontend      | /www/wwwroot/hse.widatra.com/frontend             |
| Path Dist Frontend    | C:\Users\W I N D O W S\Documents\hse\frontend\dist | /www/wwwroot/hse.widatra.com/frontend (isi dist)  |
| Backend REST API      | http://127.0.0.1:8000                              | https://api.hse.widatra.com (PHP 8.4 / 443 SSL)   |
| Path Backend Server   | C:\Users\W I N D O W S\Documents\hse\backend       | /www/wwwroot/api.hse.widatra.com/backend          |
| Web Server & PHP      | PHP 8.2+ CLI / Artisan Serve                       | Nginx + PHP 8.4 (aaPanel Managed)                 |
| Database Engine       | MySQL / MariaDB (Port 3306, DB: hse_db)            | MySQL / MariaDB (aaPanel Managed, DB: hse_db)     |
| Paket Deploy Frontend | frontend_dist.zip (Root Proyek Lokal)              | Diekstrak langsung di folder frontend server      |
| Paket Deploy Backend  | backend.zip (Root Proyek Lokal, non-vendor/non-env)| Diekstrak langsung di folder backend server       |
+-----------------------+----------------------------------------------------+---------------------------------------------------+

=================================================================================================================================

B. Status Repositori & Git Terkini

1. Repositori Monorepo: Devamisba/hsewida.git
   - URL Remote   : https://github.com/Devamisba/hsewida.git
   - Branch Utama : main (Production Ready)
   - Struktur     :
     ├── backend/     (Laravel 11 REST API, Migrations, Seeders, Models)
     ├── frontend/    (React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Leaflet GIS)
     ├── hse_db.sql   (Baseline Database Dump Schema)
     ├── backend.zip  (Paket siap deploy Backend ke aaPanel)
     └── frontend_dist.zip (Paket siap deploy Frontend ke aaPanel)

=================================================================================================================================

C. Daftar Akun Pengujian & Matriks Otoritas Work Permit (4 Tahap Approval)

Semua akun default menggunakan Password: password

+----+-------------------+--------------------+---------------+----------------------------------------------------------+
| No | Role Sistem       | Akun NIK / Email   | Nama Pengguna | Tugas & Kewenangan Utama                                 |
+----+-------------------+--------------------+---------------+----------------------------------------------------------+
| 1  | Administrator     | SA12345            | Super Admin   | Akses penuh seluruh master data, RBAC, dan audit log     |
|    |                   | admin@hse.com      |               |                                                          |
+----+-------------------+--------------------+---------------+----------------------------------------------------------+
| 2  | Pemohon (Vendor)  | VN10001            | PT Maju       | Mengajukan Ijin Kerja Baru (Form 4 Langkah: Info Umum,   |
|    |                   | vendor@hse.com     | Mundur        | JSA, APD, Berkas Pekerja & BPJS Ketenagakerjaan)         |
+----+-------------------+--------------------+---------------+----------------------------------------------------------+
| 3  | PIC Internal      | PC10002            | PIC Widatra   | Review Tahap 1: Pengawas lapangan internal PT Widatra    |
|    | Widatra           | pic@hse.com        | (Internal)    | Bhakti yang memvalidasi teknis kontraktor di lapangan    |
+----+-------------------+--------------------+---------------+----------------------------------------------------------+
| 4  | Tim K3 / HSE      | HS10003            | Tim K3 / HSE  | Review Tahap 2: Validasi risiko bahaya JSA, APD khusus,  |
|    |                   | hse@hse.com        |               | inspeksi fasilitas K3, dan kepatuhan regulasi K3         |
+----+-------------------+--------------------+---------------+----------------------------------------------------------+
| 5  | PIC K3 Lapangan   | PK10006 / PK10007  | PIC K3        | Tim Verifikasi QR APAR Lapangan (Dual-Tier mobile scan,   |
|    |                   | pick3@hse.com      | Widatra       | evaluasi checklist fisik & pengajuan refill tabung)      |
+----+-------------------+--------------------+---------------+----------------------------------------------------------+
| 6  | HRD & GA Dept Head| GA10004            | GA Dept Head  | Review Tahap 3: Verifikasi legalitas pekerja, kepatuhan  |
|    |                   | ga_dept@hse.com    |               | jam kerja, dan validitas asuransi/BPJS tenaga kerja      |
+----+-------------------+--------------------+---------------+----------------------------------------------------------+
| 7  | HRD & GA Div Head | GA10005            | GA Div Head   | Review Tahap 4: Persetujuan akhir (Final Approval),      |
|    |                   | ga_div@hse.com     | penerbitan QR Permit resmi, dan otorisasi kerja aktif    |
+----+-------------------+--------------------+---------------+----------------------------------------------------------+

=================================================================================================================================

D. Daftar Fitur Utama & Modul Sistem yang Telah Tuntas

1. Alur Persetujuan Work Permit Digital 4 Tahap (Multi-Tier Sequential Approval):
   - Alur: Pemohon (Vendor) -> PIC Widatra (Internal) -> Tim K3 HSE -> GA Dept Head -> GA Div Head.
   - Status Permit: Draft -> Submitted -> Review PIC Widatra -> Review HSE -> Review GA Dept -> Approved / Rejected.
   - Fitur Perpanjangan Waktu (Extension Phase) tanpa perlu input ulang data pekerja & JSA dari nol.
   - Fitur QR Code Verifikasi Publik (/verify-permit/:token) untuk Satpam pos gerbang mengecek validitas permit via kamera HP tanpa login.

2. Sistem Informasi Geografis (GIS) Fasilitas K3 & Geofence Spasial:
   - File Frontend: src/pages/GisGeofencePage.tsx & src/components/FacilityGeofenceMap.tsx
   - Menggunakan peta interaktif Leaflet dengan titik pusat pabrik: Lat -7.644263, Lng 112.694194 (Radius Pagar: 500 Meter).
   - Menampilkan sebaran 118 APAR hasil survei lapangan PT Widatra Bhakti (113 unit terverifikasi presisi + 5 unit draft).
   - Marker kategori K3: APAR (🧯), Hydrant (💧), Pintu Emergency (🚪), Kotak P3K (➕), Titik Kumpul (🚩), Safety Mirror (🪞).
   - Micro-Geofence Child Radius (25m) untuk memastikan petugas berada tepat di depan unit saat melakukan pemindaian fisik.

3. Sistem Inspeksi Cepat APAR Mobile QR (Dual-Tier Scan):
   - Halaman: src/pages/AparScanPage.tsx (/scan/apar/:code)
   - Tier 1 (Petugas Lapangan): Checklist 5 poin (Tabung, Selang, Nozzle, Segel, Indikator Tekanan) + Foto Real-time Kamera.
   - Tier 2 (PIC K3): Otorisasi verifikasi kelayakan (Lolos / Perlu Revisi / Pengajuan Isi Ulang Refill).
   - Riwayat Refill & Pelacak Kadaluarsa: Tabel otomatis mendeteksi tabung kadaluarsa (H-30) dan siklus refill 5 tahunan.

4. Ekspor Dokumen Laporan K3 & Cetak Resmi:
   - Ekspor Laporan Inspeksi Excel (.xlsx) di halaman Monitoring K3 memuat seluruh detail status, foto realtime, dan log PIC.
   - Format cetak PDF Surat Ijin Kerja resmi berstandar dokumen operasional HSE industri farmasi.

=================================================================================================================================

E. Standar Operasional Prosedur (SOP) Deployment ke Server LIVE aaPanel

PENTING: Jangan menjalankan build TypeScript mentah di server jika resource RAM terbatas.
Gunakan paket deploy zip yang sudah terkompilasi bersih dari lokal.

--- METODE 1: VIA FILE MANAGER aaPANEL (REKOMENDASI CEPAT & AMAN) ---

1. Langkah Deploy Frontend (hse.widatra.com):
   a. Masuk ke aaPanel -> Menu "Files".
   b. Buka direktori: /www/wwwroot/hse.widatra.com/frontend
   c. Klik tombol "Upload" -> Pilih file "frontend_dist.zip" dari komputer lokal.
   d. Klik kanan "frontend_dist.zip" -> Klik "Unzip" (Centang opsi Overwrite).
   e. Hapus file zip setelah selesai diekstrak.

2. Langkah Deploy Backend (api.hse.widatra.com):
   a. Di aaPanel -> Buka direktori: /www/wwwroot/api.hse.widatra.com/backend
   b. Klik tombol "Upload" -> Pilih file "backend.zip" dari komputer lokal.
   c. Klik kanan "backend.zip" -> Klik "Unzip" (Centang opsi Overwrite).
      (Catatan: File .env server aman dan TIDAK AKAN tertimpa karena dikecualikan dari paket zip).
   d. Hapus file zip setelah selesai diekstrak.

3. Langkah Sinkronisasi Database di Terminal aaPanel:
   a. Klik tombol "Terminal" pada toolbar atas File Manager aaPanel.
   b. Jalankan perintah berikut:
      cd /www/wwwroot/api.hse.widatra.com/backend
      php artisan migrate --force
      php artisan db:seed --class=ImportFixAparSeeder --force
      php artisan optimize:clear

--- METODE 2: VIA TERMINAL GIT aaPANEL (JIKA SERVER TERKONEKSI GIT) ---

1. Tarik pembaruan dari GitHub:
   cd /www/wwwroot/api.hse.widatra.com/backend
   git pull origin main
   php artisan migrate --force
   php artisan db:seed --class=ImportFixAparSeeder --force
   php artisan optimize:clear

=================================================================================================================================
Dokumen ini disusun sebagai pedoman kontinuitas teknis resmi proyek HSE PT Widatra Bhakti.
=================================================================================================================================
