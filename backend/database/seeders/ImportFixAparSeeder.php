<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SafetyFacility;
use App\Models\Location;
use App\Models\FacilityConsumableCycle;
use Carbon\Carbon;

class ImportFixAparSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = database_path('data/apar_fix_betul.json');
        if (!file_exists($jsonPath)) {
            $this->command->error("JSON data not found at: {$jsonPath}");
            return;
        }

        $items = json_decode(file_get_contents($jsonPath), true);
        if (!$items) {
            $this->command->error("Failed to decode JSON data or empty file.");
            return;
        }

        $this->command->info("Loaded " . count($items) . " APAR items from apar_fix_betul.json");

        // Map location names to Location models
        $locationsMap = [
            'Area Umum' => Location::firstOrCreate(
                ['name' => 'Area Umum'],
                ['description' => 'Area Umum, Perkantoran, Kantin, Parkir, dan Musholla', 'is_active' => true]
            ),
            'Area Factory 1' => Location::firstOrCreate(
                ['name' => 'Area Factory 1'],
                ['description' => 'Fasilitas Pabrik 1 (Unit 1, 2, 3, Clean Room, Steril, dan Utilitas Boiler 1 & 4)', 'is_active' => true]
            ),
            'Area Factory 2 & Workshop' => Location::firstOrCreate(
                ['name' => 'Area Factory 2 & Workshop'],
                ['description' => 'Fasilitas Pabrik 2, Ruang Mezanine 1-8, Weighing, dan Utilitas Boiler 2 & Gardu Listrik', 'is_active' => true]
            ),
            'Area Warehouse' => Location::firstOrCreate(
                ['name' => 'Area Warehouse'],
                ['description' => 'Gudang 1-7, Area Forklift, Transit Bahan Baku, dan Ruang Retained Sample', 'is_active' => true]
            ),
        ];

        // Standard zone codes matching system convention
        $zoneCodeMap = [
            'Area Umum' => 'UMUM',
            'Area Factory 1' => 'FACTORY 1',
            'Area Factory 2 & Workshop' => 'FACTORY 2 & WORKSHOP',
            'Area Warehouse' => 'WARE HOUSE',
        ];

        $updatedCount = 0;
        $createdCount = 0;
        $skippedCount = 0;
        $skippedList = [];

        foreach ($items as $item) {
            $code = strtoupper(trim($item['code']));
            $isVerified = !empty($item['is_verified']);

            // If not verified (empty keterangan), skip for next update per user requirement
            if (!$isVerified) {
                $skippedCount++;
                $skippedList[] = [
                    'code' => $code,
                    'location' => $item['location_name'],
                    'area' => $item['area'],
                    'reason' => 'Keterangan kosong di sheet fix betul'
                ];
                continue;
            }

            $areaName = $item['area'];
            $loc = $locationsMap[$areaName] ?? $locationsMap['Area Umum'];
            $zoneCode = $zoneCodeMap[$areaName] ?? 'UMUM';

            // Normalize type
            $rawType = str_replace('₂', '2', $item['type']);
            if (stripos($rawType, 'co2') !== false || (stripos($rawType, 'co') !== false && !stripos($rawType, 'powder'))) {
                $mediaType = 'CO2 (Carbon Dioxide)';
            } else {
                $mediaType = 'Dry Chemical Powder';
            }

            $lat = (float)$item['latitude'];
            $lng = (float)$item['longitude'];
            $namaItem = "APAR " . $code . " - " . $item['location_name'];

            // Find existing facility or instantiate new
            $facility = SafetyFacility::where('code', $code)->first();
            $isNew = false;

            if (!$facility) {
                $facility = new SafetyFacility();
                $facility->code = $code;
                $facility->category = 'apar';
                $facility->tipe_item = 'CONSUMABLE';
                $facility->qr_code_id = 'QR-APAR-' . $code;
                $facility->tanggal_daftar = Carbon::now()->toDateString();
                $facility->status = 'Good';
                $facility->status_aktif = true;
                $isNew = true;
            }

            // Update details & coordinates
            $facility->nama_item = $namaItem;
            $facility->location_id = $loc->id;
            $facility->area_zone = $zoneCode;
            $facility->latitude = $lat;
            $facility->longitude = $lng;

            // Merge specs so existing fields like capacity / pressure aren't wiped
            $specs = $facility->specifications ?? [];
            $specs['type'] = $mediaType;
            $specs['latitude'] = $lat;
            $specs['longitude'] = $lng;
            $specs['gps_coordinates'] = "{$lat}, {$lng}";
            $specs['detail_location'] = $item['location_name'];
            $specs['area_zone'] = $zoneCode;
            $specs['verified_coordinate'] = true;
            $specs['coordinate_source'] = 'Google Sheet fix betul';

            if (!isset($specs['pressure'])) {
                $specs['pressure'] = 'Normal';
            }
            if (!isset($specs['capacity'])) {
                $specs['capacity'] = (stripos($mediaType, 'CO2') !== false) ? '3 Kg' : '6 Kg';
            }

            $facility->specifications = $specs;
            $facility->save();

            // Ensure consumable cycle exists
            FacilityConsumableCycle::firstOrCreate(
                ['facility_id' => $facility->id],
                [
                    'expired_at' => Carbon::now()->addYears(2)->toDateString(),
                    'threshold_warning_hari' => 30,
                    'last_refilled_at' => null,
                ]
            );

            if ($isNew) {
                $createdCount++;
            } else {
                $updatedCount++;
            }
        }

        $this->command->info("=== HASIL SEEDING APAR FIX BETUL ===");
        $this->command->info("Data baru ditambahkan : {$createdCount}");
        $this->command->info("Data diperbarui koordinatnya : {$updatedCount}");
        $this->command->info("Total data tersimpan dengan koordinat: " . ($createdCount + $updatedCount));
        $this->command->warn("Data dilewati (menunggu update): {$skippedCount}");

        foreach ($skippedList as $s) {
            $this->command->line(" - [{$s['code']}] {$s['location']} ({$s['area']}): {$s['reason']}");
        }

        $totalWithCoords = SafetyFacility::where('category', 'apar')->whereNotNull('latitude')->count();
        $this->command->info("Total APAR di DB yang memiliki koordinat sekarang: {$totalWithCoords}");
    }
}
