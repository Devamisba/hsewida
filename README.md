# HSE Digital Work Permit & Safety Monitoring System (HSE Widatra)

Platform digital enterprise untuk manajemen perizinan kerja (*Work Permit / Surat Ijin Kerja Aman*), verifikasi pekerja eksternal/kontraktor, kepatuhan *Job Safety Analysis* (JSA), serta pemantauan & inspeksi berkala fasilitas K3 (APAR, Hydrant, P3K, Pintu Darurat, dll).

---

## 📁 Struktur Monorepo

Repository ini menggabungkan Frontend dan Backend dalam satu monorepo yang rapi untuk kolaborasi 2 orang (Frontend Developer & Backend Developer):

```text
hse/
├── frontend/             # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
│
├── backend/              # Laravel 11 (RESTful API) + MySQL + Sanctum
│   ├── app/
│   │   ├── Http/Controllers/Api/   # API Controllers (Auth, Permit, Monitoring, dll)
│   │   └── Models/                 # Eloquent Models (16+ model relasional)
│   ├── database/
│   │   ├── migrations/             # 19 tabel database dengan SoftDeletes
│   │   └── seeders/                # Akun tester & master data awal
│   ├── routes/api.php              # 43 endpoint RESTful API (/api/v1)
│   ├── composer.json
│   └── .env.example
│
├── .gitignore            # Mengabaikan node_modules, vendor, dan .env
└── README.md             # Panduan setup & kolaborasi tim
```

---

## 🚀 Panduan Menjalankan Sistem (Local Development)

### 1. Prasyarat Sistem
- **PHP** $\ge$ 8.2 (dengan ekstensi `pdo_mysql`, `zip`, `mbstring`, `fileinfo`)
- **Composer** $\ge$ 2.x
- **Node.js** $\ge$ 18.x & **npm**
- **XAMPP / MySQL** (Pastikan service MySQL aktif di port 3306)

---

### 2. Setup Backend (Laravel 11)

1. Buka terminal di folder `backend/`:
   ```bash
   cd backend
   ```
2. Pastikan file `.env` sudah sesuai (terhubung ke MySQL XAMPP):
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=hse_db
   DB_USERNAME=root
   DB_PASSWORD=
   DB_COLLATION=utf8mb4_unicode_ci
   ```
3. Jalankan migrasi dan seeding database:
   ```bash
   php artisan migrate:fresh --seed
   ```
4. Hubungkan storage symlink (untuk foto upload):
   ```bash
   php artisan storage:link
   ```
5. Jalankan server backend:
   ```bash
   php artisan serve
   ```
   *(Backend akan aktif di `http://localhost:8000`)*.

---

### 3. Setup Frontend (React + Vite)

1. Buka terminal di folder `frontend/`:
   ```bash
   cd frontend
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Jalankan server development frontend:
   ```bash
   npm run dev
   ```
   *(Akses aplikasi via browser di `http://localhost:5173` atau `http://localhost:5174`)*.

---

## 👥 Akun Default untuk Pengujian (Seeder)

Seluruh akun default menggunakan password: **`password`**

| Email | Role | Nama Lengkap / Departemen | Wewenang Utama |
|---|---|---|---|
| `vendor@hse.com` | `pemohon` | PT Maju Mundur (Vendor) | Pengajuan ijin kerja baru (Wizard 4 Steps), riwayat permohonan |
| `pic@hse.com` | `pic_vendor` | PIC Widatra (Internal) | Review Tahap 1: Pengawas lapangan internal Widatra Bhakti |
| `hse@hse.com` | `hse` | Tim K3 / HSE Officer | Review Tahap 2: Keselamatan, JSA, APD, inspeksi fasilitas & CAPA |
| `ga_dept@hse.com` | `ga_dept_head`| P. Andaru (HRD & GA Dept Head) | Review Tahap 3: Validasi pekerja eksternal, BPJS/asuransi, akses area |
| `ga_div@hse.com` | `ga_div_head` | P. Effendy (HRD & GA Div Head)| Review Tahap 4: Validasi akhir (*Final Approval*) & aktivasi QR Permit |
| `admin@hse.com` | `admin` | System Administrator | Akses penuh master data & manajemen hak akses (*RBAC*) |

---

## 🔄 Alur Persetujuan Ijin Kerja (State Machine)

```text
[Draft] 
   └──> [Menunggu PIC Widatra] (Submit Pengajuan, Min H-3)
           └──> [Menunggu HSE] (Approved by PIC Widatra)
                   └──> [Menunggu GA Dept Head] (Approved by HSE)
                           └──> [Menunggu GA Div Head] (Approved by GA Dept)
                                   └──> [Disetujui] (Final Sign-off + QR Code)
                                           └──> [Selesai]
```
*(Catatan: Penolakan pada tahap mana pun akan mengubah status menjadi `Ditolak` dengan kewajiban mengisi alasan penolakan `reject_reason`)*.

---

## 🌐 Ringkasan Endpoint API Utama (`/api/v1`)

| Method | Endpoint | Akses Role | Deskripsi |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | Login pengguna & penerbitan Bearer Token Sanctum |
| `POST` | `/api/v1/auth/logout` | Authenticated | Logout & revoke token |
| `GET` | `/api/v1/auth/me` | Authenticated | Profil & wewenang user login |
| `GET` | `/api/v1/master/roles` | `admin`, `ga_*` | Daftar master hak akses & permission roles |
| `GET` | `/api/v1/master/locations` | All | Master lokasi pabrik |
| `GET` | `/api/v1/master/permit-types` | All | Master kategori ijin kerja |
| `GET` | `/api/v1/master/ppe-options` | All | Master APD wajib |
| `GET` | `/api/v1/permits/my-requests` | `pemohon` | Daftar pengajuan ijin kerja vendor terkait |
| `GET` | `/api/v1/permits/review-queue` | Peninjau | Antrean permohonan yang menunggu approval user |
| `POST` | `/api/v1/permits` | `pemohon`, `hse`| Pengajuan ijin kerja baru (Wizard 4 Steps) |
| `POST` | `/api/v1/permits/{id}/approve` | Peninjau | Setujui permit ke tahapan berikutnya |
| `POST` | `/api/v1/permits/{id}/reject` | Peninjau | Tolak permit (alasan penolakan wajib) |
| `GET` | `/api/v1/permits/verify/{token}`| Public | Verifikasi keabsahan dokumen permit via scan QR Code |
| `GET` | `/api/v1/monitoring/facilities`| `hse`, `ga_*` | Pemantauan fasilitas K3 (APAR, Hydrant, P3K, dll) |
| `POST` | `/api/v1/monitoring/inspections`| `hse` | Input hasil inspeksi berkala fasilitas K3 |
| `GET` | `/api/v1/dashboard/contractor` | `pemohon` | Metrik analitik dashboard vendor |
| `GET` | `/api/v1/dashboard/hse` | `hse` | Metrik analitik dashboard HSE |
| `GET` | `/api/v1/dashboard/ga` | `ga_*` | Metrik analitik dashboard GA & pekerja aktif |

---

## 🤝 Aturan Git & Kolaborasi Tim

- **Format Commit:** Menggunakan [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat(backend): ...` / `feat(frontend): ...` (Penambahan fitur baru)
  - `fix(backend): ...` / `fix(frontend): ...` (Perbaikan bug)
  - `refactor: ...` (Refaktorisasi kode)
  - `docs: ...` (Pembaruan dokumentasi)
- **Branching:**
  - `main`: Versi stabil siap rilis/demo.
  - `develop`: Integrasi pengembangan aktif.
  - `feature/backend-...` & `feature/frontend-...`: Branch fitur masing-masing pengembang.