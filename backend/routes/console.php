<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Artisan::command('hse:reset-passwords', function () {
    $count = DB::table('users')->update([
        'password' => Hash::make('password'),
        'updated_at' => now(),
    ]);
    $this->info("Sukses! Sebanyak {$count} akun pengguna telah berhasil di-reset kata sandinya menjadi 'password'.");
    return 0;
})->purpose('Reset all user passwords in database to password');

Artisan::command('hse:clean-history {--force : Force cleanup without confirmation}', function () {
    $force = $this->option('force');
    if (!$force && !$this->confirm('Apakah Anda yakin ingin membersihkan seluruh riwayat perizinan, inspeksi dummy, dan vendor pengujian?')) {
        $this->warn('Pembersihan dibatalkan.');
        return 0;
    }

    $this->info('Memulai pembersihan data riwayat pengujian...');

    try {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $tablesToTruncate = [
            'permit_documents',
            'permit_approvals',
            'permit_equipments',
            'permit_types_pivot',
            'permit_ppes_pivot',
            'permit_jsas',
            'permit_workers',
            'work_permits',
            'notifications',
            'facility_inspections',
            'facility_alerts',
            'inspection_capas',
            'personal_access_tokens',
        ];

        foreach ($tablesToTruncate as $tbl) {
            $count = DB::table($tbl)->count();
            DB::table($tbl)->truncate();
            $this->line("  ✓ Tabel '{$tbl}' dibersihkan ({$count} baris dihapus)");
        }

        $deletedUsers = DB::table('users')
            ->where('email', 'like', 'operator_test_%')
            ->orWhere('email', '=', 'golong@gmail.com')
            ->orWhere('company_name', '=', 'PT GOLONGKOMENG')
            ->delete();
        $this->line("  ✓ {$deletedUsers} akun user dummy dihapus.");

        $deletedVendors = DB::table('vendors')
            ->where('company_name', 'like', '%GOLONGKOMENG%')
            ->orWhere('company_name', 'like', '%Test MultiPhase%')
            ->delete();
        $this->line("  ✓ {$deletedVendors} vendor dummy dihapus.");

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->info("\nRingkasan Master Data Inti (Tetap Terlindungi):");
        $this->line('  - Master Fasilitas K3 : ' . DB::table('safety_facilities')->count() . ' unit');
        $this->line('  - Pengguna Resmi      : ' . DB::table('users')->count() . ' orang');
        $this->line('  - Vendor Resmi        : ' . DB::table('vendors')->count() . ' mitra');
        $this->line('  - Pengaturan Geofence : ' . DB::table('system_settings')->count() . ' konfigurasi');

        $this->info("\nSukses! Sistem HSE bersih dan siap digunakan.");
        return 0;
    } catch (\Throwable $e) {
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        $this->error('Gagal: ' . $e->getMessage());
        return 1;
    }
})->purpose('Clean all dummy/test work permits, inspections, and test vendor data while preserving master data');
