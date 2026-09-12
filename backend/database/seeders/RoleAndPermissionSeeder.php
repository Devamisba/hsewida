<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Roles
        $roles = [
            [
                'code' => 'pemohon',
                'name' => 'Vendor / Kontraktor',
                'description' => 'Mengajukan permohonan ijin kerja baru/perpanjangan, data pekerja, APD, dan JSA.',
            ],
            [
                'code' => 'pic_vendor',
                'name' => 'PIC Vendor (Internal)',
                'description' => 'Penanggung jawab internal PT Widatra Bhakti atas vendor. Melakukan review tahap 1.',
            ],
            [
                'code' => 'hse',
                'name' => 'Tim K3 / HSE Officer',
                'description' => 'Melakukan review keselamatan tahap 2, validasi JSA, mitigasi risiko, inspeksi fasilitas K3, dan CAPA.',
            ],
            [
                'code' => 'ga_dept_head',
                'name' => 'HRD & GA Dept Head',
                'description' => 'Melakukan review administratif tahap 3 (validasi data pekerja eksternal, asuransi/BPJS, akses area).',
            ],
            [
                'code' => 'ga_div_head',
                'name' => 'HRD & GA Div Head',
                'description' => 'Melakukan validasi akhir tahap 4 (Final Sign-off) yang mengaktifkan status ijin kerja resmi.',
            ],
            [
                'code' => 'admin',
                'name' => 'System Administrator',
                'description' => 'Akses penuh ke konfigurasi sistem, master data, dan pengelolaan hak akses pengguna.',
            ],
        ];

        $roleModels = [];
        foreach ($roles as $roleData) {
            $roleModels[$roleData['code']] = Role::updateOrCreate(
                ['code' => $roleData['code']],
                $roleData
            );
        }

        // 2. Create Permissions
        $permissions = [
            // Work Permit
            ['code' => 'permits.create', 'name' => 'Ajukan Ijin Kerja Baru / Perpanjangan', 'group' => 'Work Permit'],
            ['code' => 'permits.view_own', 'name' => 'Lihat Ijin Kerja Milik Sendiri', 'group' => 'Work Permit'],
            ['code' => 'permits.review_pic', 'name' => 'Review Permit Tahap 1 (PIC Vendor)', 'group' => 'Work Permit'],
            ['code' => 'permits.review_hse', 'name' => 'Review Permit Tahap 2 (HSE)', 'group' => 'Work Permit'],
            ['code' => 'permits.review_ga_dept', 'name' => 'Review Permit Tahap 3 (HRD & GA Dept Head)', 'group' => 'Work Permit'],
            ['code' => 'permits.review_ga_div', 'name' => 'Review Permit Tahap 4 (HRD & GA Div Head)', 'group' => 'Work Permit'],
            ['code' => 'permits.view_all', 'name' => 'Lihat Seluruh Ijin Kerja & Riwayat', 'group' => 'Work Permit'],
            ['code' => 'permits.verify_qr', 'name' => 'Verifikasi Validitas Permit via QR Code', 'group' => 'Work Permit'],
            
            // Documents
            ['code' => 'documents.upload', 'name' => 'Upload Dokumen BPJS / Asuransi Pekerja', 'group' => 'Dokumen Pekerja'],
            ['code' => 'documents.verify', 'name' => 'Verifikasi Kelayakan Dokumen Pekerja', 'group' => 'Dokumen Pekerja'],

            // Monitoring & K3
            ['code' => 'monitoring.view', 'name' => 'Lihat Data Monitoring & Fasilitas K3', 'group' => 'Monitoring K3'],
            ['code' => 'inspections.create', 'name' => 'Input Hasil Inspeksi K3 (APAR, Hydrant, P3K, dll)', 'group' => 'Monitoring K3'],
            ['code' => 'capa.manage', 'name' => 'Kelola Temuan K3 & Tindakan CAPA', 'group' => 'Monitoring K3'],

            // Master Data
            ['code' => 'master.vendors', 'name' => 'Kelola Master Data Vendor', 'group' => 'Master Data'],
            ['code' => 'master.locations', 'name' => 'Kelola Master Data Lokasi', 'group' => 'Master Data'],
            ['code' => 'master.permit_options', 'name' => 'Kelola Opsi Kategori Ijin & APD', 'group' => 'Master Data'],
            ['code' => 'master.roles', 'name' => 'Kelola Master Hak Akses & Roles', 'group' => 'Master Data'],
        ];

        $permissionModels = [];
        foreach ($permissions as $permData) {
            $permissionModels[$permData['code']] = Permission::updateOrCreate(
                ['code' => $permData['code']],
                $permData
            );
        }

        // 3. Assign Permissions to Roles
        // Pemohon (Vendor)
        $roleModels['pemohon']->permissions()->sync([
            $permissionModels['permits.create']->id,
            $permissionModels['permits.view_own']->id,
            $permissionModels['documents.upload']->id,
            $permissionModels['permits.verify_qr']->id,
        ]);

        // PIC Vendor
        $roleModels['pic_vendor']->permissions()->sync([
            $permissionModels['permits.review_pic']->id,
            $permissionModels['permits.view_all']->id,
            $permissionModels['permits.verify_qr']->id,
        ]);

        // HSE
        $roleModels['hse']->permissions()->sync([
            $permissionModels['permits.create']->id,
            $permissionModels['permits.review_hse']->id,
            $permissionModels['permits.view_all']->id,
            $permissionModels['permits.verify_qr']->id,
            $permissionModels['monitoring.view']->id,
            $permissionModels['inspections.create']->id,
            $permissionModels['capa.manage']->id,
            $permissionModels['master.locations']->id,
            $permissionModels['master.permit_options']->id,
        ]);

        // GA Dept Head
        $roleModels['ga_dept_head']->permissions()->sync([
            $permissionModels['permits.review_ga_dept']->id,
            $permissionModels['permits.view_all']->id,
            $permissionModels['documents.verify']->id,
            $permissionModels['monitoring.view']->id,
            $permissionModels['master.vendors']->id,
            $permissionModels['master.locations']->id,
        ]);

        // GA Div Head
        $roleModels['ga_div_head']->permissions()->sync([
            $permissionModels['permits.review_ga_div']->id,
            $permissionModels['permits.view_all']->id,
            $permissionModels['documents.verify']->id,
            $permissionModels['monitoring.view']->id,
        ]);

        // Admin: all permissions
        $roleModels['admin']->permissions()->sync(
            collect($permissionModels)->pluck('id')->toArray()
        );
    }
}
