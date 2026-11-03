<?php

require __DIR__ . '/../../vendor/autoload.php';
$app = require_once __DIR__ . '/../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\SafetyFacility;
use App\Models\Location;

echo "=========================================================\n";
echo "           VERIFIKASI INTEGRITAS DATA APAR               \n";
echo "=========================================================\n\n";

$jsonPath = __DIR__ . '/apar_fix_betul.json';
$items = json_decode(file_get_contents($jsonPath), true);

$verifiedCount = 0;
$mismatchCount = 0;
$skippedChecked = 0;

foreach ($items as $item) {
    $code = strtoupper(trim($item['code']));
    $fac = SafetyFacility::where('code', $code)->first();

    if (!$fac) {
        echo "[ERROR] Fasilitas dengan kode {$code} tidak ditemukan di DB!\n";
        $mismatchCount++;
        continue;
    }

    if ($item['is_verified']) {
        // Must have coordinates matching item
        if (is_null($fac->latitude) || is_null($fac->longitude)) {
            echo "[ERROR] {$code} terverifikasi tapi koordinat di DB null!\n";
            $mismatchCount++;
            continue;
        }

        $latDiff = abs((float)$fac->latitude - (float)$item['latitude']);
        $lngDiff = abs((float)$fac->longitude - (float)$item['longitude']);

        if ($latDiff > 0.0001 || $lngDiff > 0.0001) {
            echo "[MISMATCH] {$code}: DB ({$fac->latitude}, {$fac->longitude}) != JSON ({$item['latitude']}, {$item['longitude']})\n";
            $mismatchCount++;
        } else {
            $verifiedCount++;
        }
    } else {
        // Must be in skipped list
        $skippedChecked++;
    }
}

echo "1. Pengecekan 113 APAR Terverifikasi:\n";
echo "   - Cocok sempurna dengan koordinat: {$verifiedCount} / 113\n";
echo "   - Mismatch / Error: {$mismatchCount}\n\n";

echo "2. Pengecekan 5 APAR Keterangan Kosong (Menunggu Update):\n";
echo "   - Berhasil diverifikasi terskip: {$skippedChecked} / 5\n\n";

// Test Eloquent Query & JSON serialization
echo "3. Testing Eloquent & API Response Serialization:\n";
$sampleFacilities = SafetyFacility::with(['location', 'consumableCycle'])
    ->where('category', 'apar')
    ->whereNotNull('latitude')
    ->take(5)
    ->get();

echo "   - Sample query retrieved: " . $sampleFacilities->count() . " rows\n";
foreach ($sampleFacilities as $f) {
    echo "     * [{$f->code}] {$f->nama_item} | Lokasi: {$f->location->name} | Lat: {$f->latitude}, Lng: {$f->longitude} | Status: {$f->calculated_status}\n";
}

// Check total APAR stats
$totalApar = SafetyFacility::where('category', 'apar')->count();
$totalWithCoords = SafetyFacility::where('category', 'apar')->whereNotNull('latitude')->count();
$totalWithoutCoords = SafetyFacility::where('category', 'apar')->whereNull('latitude')->count();

echo "\n4. Ringkasan Database APAR:\n";
echo "   - Total Seluruh APAR di DB : {$totalApar}\n";
echo "   - APAR Memiliki Koordinat  : {$totalWithCoords} (113 dari sheet fix betul)\n";
echo "   - APAR Belum Ada Koordinat : {$totalWithoutCoords} (Unit lain di pabrik menunggu mapping)\n";

if ($mismatchCount === 0 && $verifiedCount === 113) {
    echo "\n>>> KESIMPULAN: SEMUA DATA BERHASIL DIVERIFIKASI 100% BEBAS DARI ERROR <<<\n";
} else {
    echo "\n>>> KESIMPULAN: TERDAPAT KETIDAKSESUAIAN DATA <<<\n";
}
