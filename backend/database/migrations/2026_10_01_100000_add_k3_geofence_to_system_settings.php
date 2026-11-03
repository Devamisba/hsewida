<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $settings = [
            [
                'key' => 'geofence_plant_name',
                'value' => 'PT Widatra Bhakti — Kawasan Pabrik (Pandaan)',
                'label' => 'Nama Identitas Kawasan Pabrik',
                'description' => 'Nama resmi area/gedung pusat fasilitas yang muncul pada peta spasial GIS dan watermark digital foto.',
                'unit' => 'Teks',
                'group' => 'k3_geofence',
                'type' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'geofence_plant_lat',
                'value' => '-7.644263',
                'label' => 'Titik Pusat Latitude Pabrik (Induk)',
                'description' => 'Titik koordinat lintang geografis pusat kawasan pabrik PT Widatra Bhakti (Pandaan, Pasuruan).',
                'unit' => 'Derajat Lintang',
                'group' => 'k3_geofence',
                'type' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'geofence_plant_lng',
                'value' => '112.694194',
                'label' => 'Titik Pusat Longitude Pabrik (Induk)',
                'description' => 'Titik koordinat bujur geografis pusat kawasan pabrik PT Widatra Bhakti (Pandaan, Pasuruan).',
                'unit' => 'Derajat Bujur',
                'group' => 'k3_geofence',
                'type' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'geofence_plant_radius_meters',
                'value' => '500',
                'label' => 'Jangkauan Radius Pagar Pabrik (Induk)',
                'description' => 'Batas radius lingkaran geofence pabrik induk. PIC K3 dan Tim Pemeriksa wajib berada di dalam perimeter ini.',
                'unit' => 'Meter',
                'group' => 'k3_geofence',
                'type' => 'number',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'geofence_child_radius_meters',
                'value' => '25',
                'label' => 'Jangkauan Radius Mikro Scan QR Alat (Child)',
                'description' => 'Jarak toleransi maksimal posisi petugas terhadap titik koordinat alat saat memindai QR fisik unit di lapangan.',
                'unit' => 'Meter',
                'group' => 'k3_geofence',
                'type' => 'number',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($settings as $item) {
            $exists = DB::table('system_settings')->where('key', $item['key'])->exists();
            if (!$exists) {
                DB::table('system_settings')->insert($item);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('system_settings')->where('group', 'k3_geofence')->delete();
    }
};
