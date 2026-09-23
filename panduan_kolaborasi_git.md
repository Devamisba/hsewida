# 📋 Panduan Kolaborasi Git & Monorepo

**Proyek:** HSE Digital Work Permit & Safety Monitoring (HSE Widatra Bhakti)
**Repository:** https://github.com/Devamisba/hsewida.git
**Branch Utama:** `main`

---

## 👥 1. Pembagian Tugas Tim

| Developer | Role | Tanggung Jawab & Fokus Folder |
|---|---|---|
| **Fayyadh** | Backend Developer | Folder `backend/`<br>• Endpoint API (`routes/api.php`)<br>• Controller & Logika Bisnis (`app/Http/Controllers/`)<br>• Database Migration & Seeder (`database/`)<br>• Model & Relasi Database (`app/Models/`) |
| **Misba** | Frontend Developer | Folder `frontend/`<br>• Tampilan Halaman & UI (`src/pages/`)<br>• Komponen & Form Input (`src/components/`)<br>• Styling Tailwind CSS & Desain Antarmuka<br>• Integrasi Fetch API (`src/services/api.ts`) |

---

## 🚀 2. Cara Menjalankan Project (Local Dev)

Pastikan XAMPP (Apache & MySQL) sudah aktif.

**Menjalankan Backend (Laravel 11):**
```bash
cd backend
php artisan serve
```
Backend aktif di `http://127.0.0.1:8000`

**Menjalankan Frontend (React + Vite):**
```bash
cd frontend
npm run dev
```
Frontend aktif di `http://localhost:5173`

---

## 🔄 3. Detail "Kirim" & "Terima" Masing-Masing Role

### 🎨 A. Untuk Frontend Developer (Misba)

**📤 Saat Selesai Bikin / Update Tampilan (Kirim):**

Pastikan hanya mengubah file di folder `frontend/`.

```bash
# 1. Simpan perubahan frontend
git add frontend/

# 2. Beri pesan commit yang jelas
git commit -m "feat(frontend): update tampilan dashboard dan styling card"

# 3. Kirim ke GitHub
git push origin main
```

**📥 Saat Mau Mengambil Update API / Database dari Backend (Terima):**

```bash
git pull origin main
```

> **PENTING** — Jika Backend menambah tabel database baru:
> ```bash
> cd backend
> php artisan migrate
> cd ..
> ```

> (Opsional) Jika Backend menginstal library PHP baru:
> ```bash
> cd backend
> composer install
> cd ..
> ```

---

### 🖥️ B. Untuk Backend Developer (Fayyadh)

**📤 Saat Selesai Bikin / Update API & Database (Kirim):**

Pastikan hanya mengubah file di folder `backend/`.

```bash
# 1. Simpan perubahan backend
git add backend/

# 2. Beri pesan commit yang jelas
git commit -m "feat(backend): buat endpoint api permit approval dan migration baru"

# 3. Kirim ke GitHub
git push origin main
```

**📥 Saat Mau Mengambil Update Tampilan dari Frontend (Terima):**

```bash
git pull origin main
```

> (Opsional) Jika Frontend menginstal library React/NPM baru:
> ```bash
> cd frontend
> npm install
> cd ..
> ```

---

## ⚡ 4. Aturan Emas (Biar Ga Konflik / No Merge Conflict)

- Selalu `git pull origin main` sebelum mulai ngoding.
- Jangan ngoding jika kode lokalmu belum sinkron dengan update teman di GitHub.
- Jangan saling mengutak-atik file `.env`.
- File `.env` di folder `backend/` dan `frontend/` sudah masuk `.gitignore`, sehingga tidak akan saling menimpa setelan komputer masing-masing.
- **Beri aba-aba via Chat:**
  - *Backend ke Frontend:* "Bro, gue abis push API permit baru + tabel baru ya. Jangan lupa `git pull` terus ketik `php artisan migrate` di folder backend!"
  - *Frontend ke Backend:* "Bro, gue abis push halaman baru ya, tinggal `git pull` aja!"

---

## 🔑 5. Akun Pengujian Default (Seeder)

**Password untuk semua akun:** `password123`

| Role | Akun NIK / Email | Fungsi Utama |
|---|---|---|
| Admin | `SA12345` / `admin@hse.com` | Pengaturan master data, RBAC, dan superuser |
| Vendor (Pemohon) | `VN10001` / `vendor@hse.com` | Pengajuan ijin kerja baru (Form 4 langkah) |
| PIC Vendor | `PC10002` / `pic@hse.com` | Review Tahap 1 (Verifikasi teknis & vendor) |
| Tim K3 (HSE) | `HS10003` / `hse@hse.com` | Review Tahap 2 (JSA, APD, inspeksi fasilitas) |
| GA Dept Head | `GA10004` / `ga_dept@hse.com` | Review Tahap 3 (Validasi pekerja & BPJS) |
| GA Div Head | `GA10005` / `ga_div@hse.com` | Review Tahap 4 (Final Approval & Aktivasi QR) |
