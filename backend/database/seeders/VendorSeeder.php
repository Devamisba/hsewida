<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vendor;
use App\Models\User;

class VendorSeeder extends Seeder
{
    public function run(): void
    {
        $picUser = User::where('email', 'pic@hse.com')->first();

        $vendors = [
            [
                'company_name' => 'PT Maju Mundur',
                'address' => 'Jl. Industri Rungkut No. 12, Surabaya',
                'main_contact_name' => 'Budi Santoso',
                'main_contact_phone' => '081234567890',
                'pic_vendor_user_id' => $picUser?->id,
                'status' => 'Aktif',
            ],
            [
                'company_name' => 'PT Bangun Karya',
                'address' => 'Jl. Pahlawan No. 45, Pasuruan',
                'main_contact_name' => 'Agus Supriyadi',
                'main_contact_phone' => '081298765432',
                'pic_vendor_user_id' => $picUser?->id,
                'status' => 'Aktif',
            ],
            [
                'company_name' => 'PT Amanah Karya',
                'address' => 'Kawasan Industri PIER Blok C-4, Pasuruan',
                'main_contact_name' => 'Rudi Hartono',
                'main_contact_phone' => '085566778899',
                'pic_vendor_user_id' => $picUser?->id,
                'status' => 'Aktif',
            ],
            [
                'company_name' => 'CV Konstruksi Jaya',
                'address' => 'Jl. Raya Pandaan KM 42, Pasuruan',
                'main_contact_name' => 'Denny Setiawan',
                'main_contact_phone' => '082233445566',
                'pic_vendor_user_id' => $picUser?->id,
                'status' => 'Aktif',
            ],
        ];

        foreach ($vendors as $vendor) {
            Vendor::updateOrCreate(
                ['company_name' => $vendor['company_name']],
                $vendor
            );
        }
    }
}
