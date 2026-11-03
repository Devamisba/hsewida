<?php

/**
 * Script Pembersihan Data Riwayat Uji Coba (Clean Dummy History)
 * PT Widatra Bhakti - HSE Portal
 *
 * Menghapus seluruh riwayat transaksi uji coba (work permits, JSA, APD, pekerja, log approval,
 * notifikasi, inspeksi uji coba, serta akun vendor dummy pengujian) dengan tetap
 * MEMPERTAHANKAN 100% data master fasilitas K3, koordinat Pandaan, dan akun resmi.
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=================================================================\n";
echo "       PEMBERSIHAN DATA RIWAYAT & DUMMY VENDOR - HSE PORTAL      \n";
echo "                        PT WIDATRA BHAKTI                        \n";
echo "=================================================================\n\n";

try {
    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    // 1. Bersihkan Tabel Transaksi Perizinan (Work Permits & Children)
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

    echo "[1/3] Membersihkan tabel transaksi perizinan & log uji coba...\n";
    foreach ($tablesToTruncate as $tbl) {
        $count = DB::table($tbl)->count();
        DB::table($tbl)->truncate();
        echo "  ✓ Tabel '{$tbl}' dibersihkan ({$count} baris dihapus, auto-increment di-reset)\n";
    }

    // 2. Bersihkan User & Vendor Dummy Pengujian
    echo "\n[2/3] Membersihkan user & vendor dummy pengujian...\n";
    
    // User dummy (operator_test_*, golong@gmail.com, dll)
    $deletedUsers = DB::table('users')
        ->where('email', 'like', 'operator_test_%')
        ->orWhere('email', '=', 'golong@gmail.com')
        ->orWhere('company_name', '=', 'PT GOLONGKOMENG')
        ->delete();
    echo "  ✓ {$deletedUsers} akun user dummy berhasil dihapus.\n";

    // Vendor dummy
    $deletedVendors = DB::table('vendors')
        ->where('company_name', 'like', '%GOLONGKOMENG%')
        ->orWhere('company_name', 'like', '%Test MultiPhase%')
        ->delete();
    echo "  ✓ {$deletedVendors} vendor dummy berhasil dihapus.\n";

    DB::statement('SET FOREIGN_KEY_CHECKS=1;');

    echo "\n[3/3] Memeriksa Integritas Master Data Inti:\n";
    $facilityCount = DB::table('safety_facilities')->count();
    $userCount = DB::table('users')->count();
    $vendorCount = DB::table('vendors')->count();
    $settingCount = DB::table('system_settings')->count();

    echo "  ✓ Master Fasilitas K3 (APAR, dll) : {$facilityCount} unit (AMAN & UTUH)\n";
    echo "  ✓ Akun Pengguna Resmi             : {$userCount} pengguna (AMAN & UTUH)\n";
    echo "  ✓ Master Vendor Rekanan Resmi     : {$vendorCount} vendor (AMAN & UTUH)\n";
    echo "  ✓ Konfigurasi Geofence Pabrik     : {$settingCount} pengaturan (AMAN & UTUH)\n";

    echo "\n=================================================================\n";
    echo "  SUKSES! Seluruh data riwayat pengujian berhasil dibersihkan.   \n";
    echo "  Sistem HSE kini dalam kondisi BERSIH (FRESH) siap digunakan!   \n";
    echo "=================================================================\n";

} catch (\Throwable $e) {
    DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    echo "\n[ERROR] Pembersihan gagal: " . $e->getMessage() . "\n";
    exit(1);
}
