<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SafetyFacility;
use App\Models\Location;
use App\Models\FacilityConsumableCycle;
use App\Models\FacilityRefillHistory;
use Carbon\Carbon;

class RealAparWidatraSeeder extends Seeder
{
    public function run(): void
    {
        $csvPath = database_path('data/laporan_pemeriksaan_apar.csv');
        if (!file_exists($csvPath)) {
            $this->command->error("CSV file not found at: $csvPath");
            return;
        }

        // 1. Ensure the 4 primary factory zones exist in locations table
        $locationsMap = [
            'UMUM' => Location::firstOrCreate(
                ['name' => 'Area Umum'],
                ['description' => 'Area Umum, Perkantoran, Kantin, Parkir, dan Musholla', 'is_active' => true]
            ),
            'FACTORY 1' => Location::firstOrCreate(
                ['name' => 'Area Factory 1'],
                ['description' => 'Fasilitas Pabrik 1 (Unit 1, 2, 3, Clean Room, Steril, dan Utilitas Boiler 1 & 4)', 'is_active' => true]
            ),
            'FACTORY 2 & WORKSHOP' => Location::firstOrCreate(
                ['name' => 'Area Factory 2 & Workshop'],
                ['description' => 'Fasilitas Pabrik 2, Ruang Mezanine 1-8, Weighing, dan Utilitas Boiler 2 & Gardu Listrik', 'is_active' => true]
            ),
            'WARE HOUSE' => Location::firstOrCreate(
                ['name' => 'Area Warehouse'],
                ['description' => 'Gudang 1-7, Area Forklift, Transit Bahan Baku, dan Ruang Retained Sample', 'is_active' => true]
            ),
        ];

        // 2. Parse CSV
        $content = file_get_contents($csvPath);
        $lines = explode("\n", $content);

        $currentArea = 'UMUM';
        $items = [];
        $refillCodes = [];
        $isRefillSection = false;

        foreach ($lines as $line) {
            $line = trim($line);
            if (!$line) continue;

            if (strpos($line, 'DAFTAR ISI ULANG APAR') !== false) {
                $isRefillSection = true;
                continue;
            }

            if (preg_match('/AREA\s*:\s*([^,]+)/', $line, $m)) {
                $currentArea = trim($m[1]);
                continue;
            }

            $cols = str_getcsv($line);
            if (count($cols) < 5) continue;

            if ($cols[0] === 'No. Urut' || $cols[1] === 'No. Lokasi' || (empty($cols[0]) && empty($cols[1]))) {
                continue;
            }

            if ($isRefillSection) {
                if (is_numeric($cols[0]) && !empty($cols[1])) {
                    $code = trim($cols[1]);
                    $refillCodes[$code] = [
                        'raw_exp' => trim($cols[4] ?? ''),
                        'parsed_exp' => $this->parseIndonesianDate($cols[4] ?? ''),
                        'notes' => trim($cols[6] ?? '')
                    ];
                }
            } else {
                if (is_numeric($cols[0]) && !empty($cols[1])) {
                    $items[] = [
                        'no' => (int)$cols[0],
                        'area' => $currentArea,
                        'code' => trim($cols[1]),
                        'location' => trim($cols[2] ?? ''),
                        'type' => trim($cols[3] ?? 'Powder'),
                        'raw_exp' => trim($cols[4] ?? ''),
                        'parsed_exp' => $this->parseIndonesianDate($cols[4] ?? ''),
                        'capacity' => trim($cols[5] ?? '3')
                    ];
                }
            }
        }

        $today = Carbon::today();
        $importedCount = 0;

        foreach ($items as $item) {
            $code = $item['code'];
            $areaKey = $item['area'];
            $loc = $locationsMap[$areaKey] ?? $locationsMap['UMUM'];

            // Normalize type name
            $rawType = str_replace('₂', '2', $item['type']);
            if (stripos($rawType, 'co2') !== false || stripos($rawType, 'co') !== false && !stripos($rawType, 'powder')) {
                $mediaType = 'CO2 (Carbon Dioxide)';
            } elseif (stripos($rawType, 'gas') !== false) {
                $mediaType = 'Gas Kering (Clean Agent)';
            } else {
                $mediaType = 'Dry Chemical Powder';
            }

            $capacityStr = $item['capacity'] ? ($item['capacity'] . ' Kg') : '3 Kg';
            $namaItem = "APAR " . $code . " - " . $item['location'];

            // Check if this item is in the refill list (Februari 2026)
            $isNeedsRefill = isset($refillCodes[$code]);
            // Expiry date
            $expiredDateStr = $item['parsed_exp'] ?: '2028-04-06';
            $expiredDate = Carbon::parse($expiredDateStr);

            $statusExp = 'AMAN';
            if ($today->gt($expiredDate)) {
                $statusExp = 'KADALUARSA';
            } elseif ($today->diffInDays($expiredDate, false) <= 30) {
                $statusExp = 'MENDEKATI_KADALUARSA';
            }

            // Create or update SafetyFacility
            $facility = SafetyFacility::updateOrCreate(
                ['code' => $code],
                [
                    'nama_item' => $namaItem,
                    'category' => 'apar',
                    'tipe_item' => 'CONSUMABLE',
                    'qr_code_id' => 'QR-APAR-' . $code,
                    'tanggal_daftar' => '2026-01-01',
                    'location_id' => $loc->id,
                    'area_zone' => $areaKey,
                    'specifications' => [
                        'type' => $mediaType,
                        'capacity' => $capacityStr,
                        'pressure' => 'Normal',
                        'detail_location' => $item['location'],
                        'area_zone' => $areaKey,
                        'no_urut' => $item['no'],
                        'is_refill_queue' => $isNeedsRefill
                    ],
                    'status' => ($statusExp === 'KADALUARSA' ? 'Needs Attention' : 'Good'),
                    'status_aktif' => true,
                    'last_inspected_at' => '2026-08-20',
                ]
            );

            // Create or update FacilityConsumableCycle
            FacilityConsumableCycle::updateOrCreate(
                ['facility_id' => $facility->id],
                [
                    'expired_at' => $expiredDateStr,
                    'threshold_warning_hari' => 30,
                    'last_refilled_at' => ($isNeedsRefill ? '2021-02-01' : null)
                ]
            );

            // If in refill list, record history
            if ($isNeedsRefill) {
                FacilityRefillHistory::firstOrCreate(
                    [
                        'facility_id' => $facility->id,
                        'refill_date' => '2021-02-01'
                    ],
                    [
                        'user_id' => 1,
                        'old_expired_at' => '2021-02-01',
                        'new_expired_at' => $refillCodes[$code]['parsed_exp'] ?: '2026-02-01',
                        'vendor_name' => 'PT Servis Pemadam Mandiri',
                        'seal_number' => 'SEAL-REFILL-' . $code,
                        'notes' => 'Pengisian siklus 5 tahun sebelumnya (Habis berlaku Feb 2026, antrean isi ulang K3)'
                    ]
                );
            }

            $importedCount++;
        }

        $this->command->info("Successfully imported $importedCount real APAR units from PT Widatra Bhakti!");
        $this->command->info("Recorded " . count($refillCodes) . " units into the Refill Tracker Queue.");
    }

    private function parseIndonesianDate($str): ?string
    {
        $str = trim($str);
        if (empty($str)) return null;

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $str)) {
            return $str;
        }

        $months = [
            'januari' => '01', 'jan' => '01',
            'februari' => '02', 'feb' => '02',
            'maret' => '03', 'mar' => '03',
            'april' => '04', 'apr' => '04',
            'mei' => '05', 'may' => '05',
            'juni' => '06', 'jun' => '06',
            'juli' => '07', 'jul' => '07',
            'agustus' => '08', 'agu' => '08', 'agt' => '08',
            'september' => '09', 'sep' => '09',
            'oktober' => '10', 'okt' => '10',
            'november' => '11', 'nov' => '11',
            'desember' => '12', 'des' => '12',
        ];

        // Format: "26 Februari 2031", "10 Januari  2029", "03 Okt 2028"
        if (preg_match('/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/', $str, $m)) {
            $day = str_pad($m[1], 2, '0', STR_PAD_LEFT);
            $monthName = strtolower(trim($m[2]));
            $month = $months[$monthName] ?? '01';
            $year = $m[3];
            return "$year-$month-$day";
        }

        // Format: "Februari 2026"
        if (preg_match('/([a-zA-Z]+)\s+(\d{4})/', $str, $m)) {
            $monthName = strtolower(trim($m[1]));
            $month = $months[$monthName] ?? '01';
            $year = $m[2];
            return "$year-$month-01";
        }

        return null;
    }
}
