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
        $setting = [
            'key' => 'login_background_image',
            'value' => '/widatra-building.jpg',
            'label' => 'Foto Showcase Halaman Login',
            'description' => 'Foto gedung atau fasilitas utama pada kartu sisi kanan halaman login sistem HSE PT Widatra Bhakti.',
            'unit' => 'URL / Path Foto',
            'group' => 'branding',
            'type' => 'string',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        $exists = DB::table('system_settings')->where('key', $setting['key'])->exists();
        if (!$exists) {
            DB::table('system_settings')->insert($setting);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('system_settings')->where('key', 'login_background_image')->delete();
    }
};
