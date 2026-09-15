<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $roles = Role::all()->keyBy('code');

        $users = [
            [
                'nik' => 'VN10001',
                'name' => 'PT Maju Mundur (Vendor)',
                'email' => 'vendor@hse.com',
                'password' => Hash::make('password123'),
                'role_id' => $roles['pemohon']->id ?? null,
                'company_name' => 'PT Maju Mundur',
                'department' => 'Eksternal',
                'phone_number' => '081122334455',
            ],
            [
                'nik' => 'PC10002',
                'name' => 'PIC Vendor Widatra',
                'email' => 'pic@hse.com',
                'password' => Hash::make('password123'),
                'role_id' => $roles['pic_vendor']->id ?? null,
                'company_name' => 'PT Widatra Bhakti',
                'department' => 'Vendor Management',
                'phone_number' => '089988776655',
            ],
            [
                'nik' => 'HS10003',
                'name' => 'Tim K3 / HSE',
                'email' => 'hse@hse.com',
                'password' => Hash::make('password123'),
                'role_id' => $roles['hse']->id ?? null,
                'company_name' => 'PT Widatra Bhakti',
                'department' => 'Health Safety & Environment',
                'phone_number' => '085566778899',
            ],
            [
                'nik' => 'GA10004',
                'name' => 'P. Andaru',
                'email' => 'ga_dept@hse.com',
                'password' => Hash::make('password123'),
                'role_id' => $roles['ga_dept_head']->id ?? null,
                'company_name' => 'PT Widatra Bhakti',
                'department' => 'HRD & GA Department',
                'phone_number' => '081234567890',
            ],
            [
                'nik' => 'GA10005',
                'name' => 'P. Effendy',
                'email' => 'ga_div@hse.com',
                'password' => Hash::make('password123'),
                'role_id' => $roles['ga_div_head']->id ?? null,
                'company_name' => 'PT Widatra Bhakti',
                'department' => 'HRD & GA Division',
                'phone_number' => '082345678901',
            ],
            [
                'nik' => 'SA12345',
                'name' => 'System Administrator',
                'email' => 'admin@hse.com',
                'password' => Hash::make('password123'),
                'role_id' => $roles['admin']->id ?? null,
                'company_name' => 'PT Widatra Bhakti',
                'department' => 'IT & Systems',
                'phone_number' => '081199001122',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}
