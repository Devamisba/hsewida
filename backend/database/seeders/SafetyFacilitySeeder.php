<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SafetyFacility;
use App\Models\Location;

class SafetyFacilitySeeder extends Seeder
{
    public function run(): void
    {
        $locations = Location::all()->keyBy('name');

        $facilities = [
            // APAR
            [
                'code' => 'AP-001',
                'category' => 'apar',
                'location_id' => $locations['Area Pabrik 1']?->id,
                'specifications' => ['type' => 'Dry Chemical Powder', 'capacity' => '6 Kg', 'pressure' => 'Normal'],
                'status' => 'Good',
                'last_inspected_at' => '2026-08-20',
            ],
            [
                'code' => 'AP-002',
                'category' => 'apar',
                'location_id' => $locations['Gedung A, Ruang Server']?->id,
                'specifications' => ['type' => 'Clean Agent / CO2', 'capacity' => '5 Kg', 'pressure' => 'Normal'],
                'status' => 'Good',
                'last_inspected_at' => '2026-08-20',
            ],
            [
                'code' => 'AP-003',
                'category' => 'apar',
                'location_id' => $locations['Gudang Utama (Bahan Baku)']?->id,
                'specifications' => ['type' => 'Foam AFFF', 'capacity' => '9 Liter', 'pressure' => 'Low'],
                'status' => 'Needs Attention',
                'last_inspected_at' => '2026-08-15',
            ],

            // Hydrant
            [
                'code' => 'HY-001',
                'category' => 'hydrant',
                'location_id' => $locations['Area Pabrik 1']?->id,
                'specifications' => ['type' => 'Pillar Hydrant 2-Way', 'pressure_bar' => 7.5, 'equipment' => 'Complete'],
                'status' => 'Good',
                'last_inspected_at' => '2026-08-20',
            ],
            [
                'code' => 'HY-002',
                'category' => 'hydrant',
                'location_id' => $locations['Area Parkir Basement 2']?->id,
                'specifications' => ['type' => 'Indoor Hydrant Box', 'pressure_bar' => 6.8, 'equipment' => 'Nozzle Checked'],
                'status' => 'Good',
                'last_inspected_at' => '2026-08-18',
            ],

            // Emergency Doors
            [
                'code' => 'ED-001',
                'category' => 'emergency_door',
                'location_id' => $locations['Area Pabrik 1']?->id,
                'specifications' => ['mechanism' => 'Push Panic Bar', 'exit_sign' => 'Lit', 'pathway' => 'Clear'],
                'status' => 'Good',
                'last_inspected_at' => '2026-08-20',
            ],
            [
                'code' => 'ED-002',
                'category' => 'emergency_door',
                'location_id' => $locations['Gedung B Lantai 2']?->id,
                'specifications' => ['mechanism' => 'Push Panic Bar', 'exit_sign' => 'Lit', 'pathway' => 'Clear'],
                'status' => 'Good',
                'last_inspected_at' => '2026-08-20',
            ],

            // P3K
            [
                'code' => 'FA-001',
                'category' => 'p3k',
                'location_id' => $locations['Area Pabrik 1']?->id,
                'specifications' => ['box_type' => 'Form B (50 Pekerja)', 'checklist' => '21 items full'],
                'status' => 'Good',
                'last_inspected_at' => '2026-08-20',
            ],
            [
                'code' => 'FA-002',
                'category' => 'p3k',
                'location_id' => $locations['Gudang Utama (Bahan Baku)']?->id,
                'specifications' => ['box_type' => 'Form A (25 Pekerja)', 'checklist' => 'Perban & Betadine Restocked'],
                'status' => 'Good',
                'last_inspected_at' => '2026-08-19',
            ],

            // Safety Mirror
            [
                'code' => 'SM-001',
                'category' => 'safety_mirror',
                'location_id' => $locations['Area Parkir Basement 2']?->id,
                'specifications' => ['diameter' => '80 cm', 'surface' => 'Convex Polycarbonate', 'view' => 'Clear'],
                'status' => 'Good',
                'last_inspected_at' => '2026-08-20',
            ],

            // Assembly Point
            [
                'code' => 'AP-POINT-1',
                'category' => 'assembly_point',
                'location_id' => $locations['Area Pabrik 1']?->id,
                'specifications' => ['capacity' => '200 Personel', 'signage' => 'Visible Reflective'],
                'status' => 'Good',
                'last_inspected_at' => '2026-08-20',
            ],
        ];

        foreach ($facilities as $facility) {
            SafetyFacility::updateOrCreate(
                ['code' => $facility['code']],
                $facility
            );
        }
    }
}
