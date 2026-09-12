<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WorkPermit;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Location;
use App\Models\PermitTypeOption;
use App\Models\PpeOption;

class WorkPermitSeeder extends Seeder
{
    public function run(): void
    {
        $vendorUser = User::where('email', 'vendor@hse.com')->first();
        $vendor = Vendor::where('company_name', 'PT Maju Mundur')->first() ?? Vendor::first();
        $locations = Location::all()->keyBy('name');
        $permitTypes = PermitTypeOption::all()->keyBy('name');
        $ppes = PpeOption::all()->keyBy('name');

        if (!$vendorUser || !$vendor) {
            return;
        }

        // Permit 1: WP-2608-058 (Menunggu HSE)
        $wp1 = WorkPermit::updateOrCreate(
            ['permit_number' => 'WP-2608-058'],
            [
                'user_id' => $vendorUser->id,
                'vendor_id' => $vendor->id,
                'request_type' => 'Baru',
                'job_title' => 'Pengelasan Pipa Jalur Utama',
                'location_id' => $locations['Area Tangki A']?->id,
                'start_date' => date('Y-m-d', strtotime('+3 days')),
                'end_date' => date('Y-m-d', strtotime('+6 days')),
                'daily_start_time' => '08:00',
                'daily_end_time' => '16:00',
                'pic_name' => 'Budi Santoso',
                'pic_phone' => '081233445566',
                'supervisor_name' => 'Agus',
                'supervisor_phone' => '081122334455',
                'hse_officer_name' => 'Dina',
                'hse_officer_phone' => '087788990011',
                'total_workers' => 3,
                'risk_level' => 'Tinggi',
                'status' => 'Menunggu HSE',
                'qr_code_token' => 'QR-WP-2608-058-' . bin2hex(random_bytes(6)),
            ]
        );

        if (isset($permitTypes['Hot Work'])) {
            $wp1->permitTypes()->syncWithoutDetaching([$permitTypes['Hot Work']->id]);
        }
        $wp1Ppes = collect(['Safety Helmet', 'Safety Shoes', 'Face Shield', 'Gloves', 'Fire Extinguisher'])
            ->map(fn($name) => $ppes[$name]->id ?? null)
            ->filter()->toArray();
        $wp1->ppes()->sync($wp1Ppes);

        $wp1->equipments()->createMany([
            ['equipment_name' => 'Mesin Las Inverter'],
            ['equipment_name' => 'Tabung Gas Argon'],
            ['equipment_name' => 'APAR Powder 6kg'],
            ['equipment_name' => 'Gerinda Tangan'],
        ]);

        $wp1->workers()->createMany([
            ['worker_name' => 'Tono', 'position' => 'Welder 6G', 'address' => 'Jl. Pahlawan No 45'],
            ['worker_name' => 'Budi', 'position' => 'Fitter', 'address' => 'Perum Indah Blok C2'],
            ['worker_name' => 'Andi', 'position' => 'Helper', 'address' => 'Jl. Melati Raya No 8'],
        ]);

        $wp1->jsas()->createMany([
            [
                'step_sequence' => 1,
                'work_step' => 'Persiapan area dan peralatan las',
                'equipment_used' => 'Mesin Las, Kabel Power',
                'hazard_potential' => 'Kebocoran arus listrik, kabel terkelupas',
                'mitigation_control' => 'Inspeksi grounding & kabel, pastikan area kering',
                'emergency_response' => 'Matikan panel breaker utama jika ada korsleting',
            ],
            [
                'step_sequence' => 2,
                'work_step' => 'Proses pengelasan pipa',
                'equipment_used' => 'Welding Torch, Gerinda',
                'hazard_potential' => 'Percikan api mengenai bahan mudah terbakar',
                'mitigation_control' => 'Pasang fire blanket, bersihkan area 10m dari flammable, siapkan APAR standby',
                'emergency_response' => 'Gunakan APAR segera, tekan tombol alarm kebakaran terdekat',
            ],
        ]);

        $wp1->approvals()->create([
            'user_id' => $vendorUser->id,
            'role_at_action' => 'pemohon',
            'action' => 'Submit',
            'note' => 'Pengajuan permit pengelasan pipa baru',
            'action_date' => now(),
        ]);

        // Permit 2: WP-2608-062 (Menunggu GA Dept Head)
        $wp2 = WorkPermit::updateOrCreate(
            ['permit_number' => 'WP-2608-062'],
            [
                'user_id' => $vendorUser->id,
                'vendor_id' => $vendor->id,
                'request_type' => 'Baru',
                'job_title' => 'Instalasi AC Split Kantor Lantai 2',
                'location_id' => $locations['Gedung B Lantai 2']?->id,
                'start_date' => date('Y-m-d', strtotime('+3 days')),
                'end_date' => date('Y-m-d', strtotime('+5 days')),
                'daily_start_time' => '09:00',
                'daily_end_time' => '17:00',
                'pic_name' => 'Rudi Hartono',
                'pic_phone' => '085566778899',
                'supervisor_name' => 'Samsul',
                'supervisor_phone' => '082233445566',
                'hse_officer_name' => 'Rian',
                'hse_officer_phone' => '083344556677',
                'total_workers' => 2,
                'risk_level' => 'Rendah',
                'status' => 'Menunggu GA Dept Head',
                'qr_code_token' => 'QR-WP-2608-062-' . bin2hex(random_bytes(6)),
            ]
        );

        if (isset($permitTypes['Work at Height'])) {
            $wp2->permitTypes()->syncWithoutDetaching([$permitTypes['Work at Height']->id]);
        }
        $wp2Ppes = collect(['Safety Helmet', 'Safety Shoes', 'Gloves'])
            ->map(fn($name) => $ppes[$name]->id ?? null)
            ->filter()->toArray();
        $wp2->ppes()->sync($wp2Ppes);

        $wp2->equipments()->createMany([
            ['equipment_name' => 'Tangga Aluminium Lipat'],
            ['equipment_name' => 'Bor Tembok'],
            ['equipment_name' => 'Toolbox Set'],
        ]);

        $wp2->workers()->createMany([
            ['worker_name' => 'Doni', 'position' => 'Teknisi AC', 'address' => 'Jl. Anggrek No 12'],
            ['worker_name' => 'Feri', 'position' => 'Helper Teknisi', 'address' => 'Jl. Mawar Indah 3'],
        ]);

        $wp2->jsas()->createMany([
            [
                'step_sequence' => 1,
                'work_step' => 'Pemasangan bracket indoor unit',
                'equipment_used' => 'Bor Listrik, Tangga',
                'hazard_potential' => 'Terjatuh dari tangga, debu dinding',
                'mitigation_control' => 'Tangga dipegangi helper, gunakan kacamata & masker',
                'emergency_response' => 'Pertolongan pertama pada kotak P3K',
            ],
        ]);

        // Permit 3: WP-2608-050 (Disetujui / Aktif)
        $wp3 = WorkPermit::updateOrCreate(
            ['permit_number' => 'WP-2608-050'],
            [
                'user_id' => $vendorUser->id,
                'vendor_id' => $vendor->id,
                'request_type' => 'Baru',
                'job_title' => 'Pembersihan & Inspeksi Silo Utama',
                'location_id' => $locations['Area Silo & Boiler']?->id,
                'start_date' => date('Y-m-d'),
                'end_date' => date('Y-m-d', strtotime('+2 days')),
                'daily_start_time' => '08:00',
                'daily_end_time' => '16:00',
                'pic_name' => 'Heri Susanto',
                'pic_phone' => '081223344556',
                'supervisor_name' => 'Denny Caknan',
                'supervisor_phone' => '085566778899',
                'hse_officer_name' => 'Sinta Maharani',
                'hse_officer_phone' => '089911223344',
                'total_workers' => 2,
                'risk_level' => 'Tinggi',
                'status' => 'Disetujui',
                'qr_code_token' => 'QR-WP-2608-050-' . bin2hex(random_bytes(6)),
            ]
        );

        if (isset($permitTypes['Confined Space'])) {
            $wp3->permitTypes()->syncWithoutDetaching([$permitTypes['Confined Space']->id]);
        }
    }
}
