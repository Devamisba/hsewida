<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;

class PicK3Seeder extends Seeder
{
    public function run(): void
    {
        // 1. Create or Update Role: pic_k3
        $role = Role::updateOrCreate(
            ['code' => 'pic_k3'],
            [
                'name' => 'PIC K3 (Monitoring & Inspeksi)',
                'description' => 'Penanggung jawab pemantauan fasilitas K3 lapangan (APAR, Hydrant, P3K), verifikasi hasil inspeksi petugas, dan pelaporan K3.',
                'is_active' => true,
            ]
        );

        // 2. Assign Specific Permissions for K3 Monitoring & Inspections
        $permissionCodes = [
            'monitoring.view',      // Lihat Data Monitoring & Fasilitas K3
            'inspections.create',   // Input & Verifikasi Hasil Inspeksi K3
            'capa.manage',          // Kelola Temuan K3 & Tindakan CAPA
            'permits.verify_qr',    // Verifikasi Ijin Kerja via QR Code
            'permits.view_all',     // Lihat Data Ijin Kerja Pabrik
            'master.locations',     // Akses Master Data Lokasi Pabrik
        ];

        $permissionIds = Permission::whereIn('code', $permissionCodes)->pluck('id')->toArray();
        $role->permissions()->sync($permissionIds);

        // 3. Create or Update PIC K3 User Accounts
        $users = [
            [
                'nik' => 'PK10006',
                'name' => 'PIC K3 Widatra',
                'email' => 'pick3@hse.com',
                'password' => Hash::make('password123'),
                'role_id' => $role->id,
                'company_name' => 'PT Widatra Bhakti',
                'department' => 'Health Safety & Environment',
                'phone_number' => '081234567899',
            ],
            [
                'nik' => 'PK10007',
                'name' => 'PIC K3 Widatra',
                'email' => 'pick3@widatra.com',
                'password' => Hash::make('password123'),
                'role_id' => $role->id,
                'company_name' => 'PT Widatra Bhakti',
                'department' => 'Health Safety & Environment',
                'phone_number' => '081234567899',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }

        echo "Role 'pic_k3' and PIC K3 user accounts seeded successfully.\n";
    }
}
