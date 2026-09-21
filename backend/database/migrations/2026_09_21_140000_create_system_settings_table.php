<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique();
            $table->text('value');
            $table->string('label', 255);
            $table->text('description')->nullable();
            $table->string('unit', 50)->nullable();
            $table->string('group', 50)->default('permit_policy');
            $table->string('type', 30)->default('number');
            $table->timestamps();
        });

        // Seed default initial policy values
        DB::table('system_settings')->insert([
            [
                'key' => 'max_permit_duration_days',
                'value' => '6',
                'label' => 'Masa Berlaku Maksimal Satu Izin Kerja (SIKA)',
                'description' => 'Maksimal rentang hari kalender pelaksanaan pekerjaan untuk 1 lembar dokumen izin kerja. Jika melebihi batas ini, vendor wajib mengajukan perpanjangan izin.',
                'unit' => 'Hari Kalender',
                'group' => 'permit_policy',
                'type' => 'number',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'min_lead_time_days',
                'value' => '3',
                'label' => 'Batas Waktu Pengajuan Izin Baru (Lead Time)',
                'description' => 'Batas minimal hari pengajuan sebelum tanggal pelaksanaan kerja (Aturan H-X) untuk keperluan verifikasi lapangan dan persetujuan bertingkat.',
                'unit' => 'Hari Sebelum Mulai (H-X)',
                'group' => 'permit_policy',
                'type' => 'number',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'extension_window_days',
                'value' => '3',
                'label' => 'Jendela Pembukaan Perpanjangan Izin',
                'description' => 'Batas hari sebelum izin kedaluwarsa (H-X) di mana tombol perpanjangan izin mulai dibuka untuk pemohon/kontraktor pada modul Ijin Saya.',
                'unit' => 'Hari Sebelum Kedaluwarsa (H-X)',
                'group' => 'permit_policy',
                'type' => 'number',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
