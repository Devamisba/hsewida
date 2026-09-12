<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Location;
use App\Models\PermitTypeOption;
use App\Models\PpeOption;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Locations
        $locations = [
            ['name' => 'Area Pabrik 1', 'description' => 'Gedung Produksi Farmasi & Infus Utama'],
            ['name' => 'Area Pabrik 2', 'description' => 'Area Pengemasan & Gudang Sekunder'],
            ['name' => 'Gedung A, Ruang Server', 'description' => 'Fasilitas IT & Server Utama'],
            ['name' => 'Gedung B Lantai 2', 'description' => 'Area Kantor Administrasi & HRD'],
            ['name' => 'Lobi Utama Gedung B', 'description' => 'Area Resepsionis & Pintu Masuk Tamu'],
            ['name' => 'Area Tangki A', 'description' => 'Area Penampungan Bahan Baku Cair'],
            ['name' => 'Gudang Utama (Bahan Baku)', 'description' => 'Gudang Penyimpanan Logistik Utama'],
            ['name' => 'Area Parkir Basement 2', 'description' => 'Area Parkir & Jalur Pipa Hydrant'],
            ['name' => 'Area Rooftop Gedung A', 'description' => 'Atap Bangunan & Sistem Pendingin Chiller'],
            ['name' => 'Area Silo & Boiler', 'description' => 'Ruang Utilitas Pembangkit Uap & Silo'],
        ];

        foreach ($locations as $loc) {
            Location::updateOrCreate(['name' => $loc['name']], $loc);
        }

        // 2. Permit Type Options
        $permitTypes = [
            'Confined Space',
            'High Voltage Electricity',
            'Heavy Lifting',
            'Hot Work',
            'Excavation (LOTO)',
            'Work at Height',
            'Others',
        ];

        foreach ($permitTypes as $pt) {
            PermitTypeOption::updateOrCreate(['name' => $pt]);
        }

        // 3. PPE Options
        $ppes = [
            'Safety Helmet',
            'Safety Shoes',
            'Body Harness',
            'Safety Net',
            'Scaffolding',
            'Safety Glasses',
            'Face Shield',
            'Respiratory Protection',
            'Safety Line',
            'Ear Plug/Muff',
            'Gloves',
            'Breathing Apparatus',
            'Stairs',
            'Fire Extinguisher',
            'Lifeline',
            'Sign',
            'Barricade',
        ];

        foreach ($ppes as $ppe) {
            PpeOption::updateOrCreate(['name' => $ppe]);
        }
    }
}
