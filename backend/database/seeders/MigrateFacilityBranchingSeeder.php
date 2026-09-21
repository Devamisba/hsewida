<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SafetyFacility;
use App\Models\FacilityConsumableCycle;
use App\Models\FacilityConditionSchedule;
use Carbon\Carbon;

class MigrateFacilityBranchingSeeder extends Seeder
{
    public function run(): void
    {
        $facilities = SafetyFacility::all();

        foreach ($facilities as $f) {
            $categoryUpper = strtoupper($f->category);
            $cleanCode = str_replace('-', '', $f->code);

            // 1. qr_code_id
            if (empty($f->qr_code_id)) {
                $f->qr_code_id = 'QR-' . $cleanCode;
            }

            // 2. tanggal_daftar
            if (empty($f->tanggal_daftar)) {
                $f->tanggal_daftar = $f->created_at ? $f->created_at->toDateString() : '2026-01-15';
            }

            // 3. tipe_item & nama_item
            if (in_array($f->category, ['apar', 'p3k'])) {
                $f->tipe_item = 'CONSUMABLE';
                if (empty($f->nama_item)) {
                    $spec = $f->specifications;
                    if ($f->category === 'apar') {
                        $f->nama_item = 'APAR ' . ($spec['type'] ?? 'Powder') . ' (' . ($spec['capacity'] ?? '6 Kg') . ')';
                    } else {
                        $f->nama_item = 'Kotak P3K ' . ($spec['box_type'] ?? 'Standar');
                    }
                }
            } else {
                $f->tipe_item = 'KONDISI';
                if (empty($f->nama_item)) {
                    $spec = $f->specifications;
                    if ($f->category === 'hydrant') {
                        $f->nama_item = 'Pilar Hydrant (' . ($spec['type'] ?? '2-Way') . ')';
                    } elseif ($f->category === 'emergency_door') {
                        $f->nama_item = 'Pintu Darurat (' . ($f->location?->name ?? 'Gedung') . ')';
                    } elseif ($f->category === 'safety_mirror') {
                        $f->nama_item = 'Safety Mirror (' . ($spec['diameter'] ?? '80 cm') . ')';
                    } elseif ($f->category === 'assembly_point') {
                        $f->nama_item = 'Titik Kumpul (' . ($spec['capacity'] ?? 'Kapasitas 100') . ')';
                    } else {
                        $f->nama_item = 'Fasilitas K3 ' . $f->code;
                    }
                }
            }

            $f->status_aktif = true;
            $f->save();

            // 4. Create consumableCycle or conditionSchedule
            if ($f->tipe_item === 'CONSUMABLE') {
                if (!$f->consumableCycle) {
                    // Seed diverse realistic expiry dates for testing alerts:
                    // AP-001: Aman (exp in 8 months)
                    // AP-002: Aman (exp in 14 months)
                    // AP-003: Mendekati kadaluarsa H-14 hari
                    // FA-002: Kadaluarsa (yesterday)
                    $expDate = Carbon::now()->addMonths(8)->toDateString();
                    if ($f->code === 'AP-003') {
                        $expDate = Carbon::now()->addDays(14)->toDateString();
                    } elseif ($f->code === 'FA-002') {
                        $expDate = Carbon::now()->subDays(5)->toDateString();
                    }

                    FacilityConsumableCycle::create([
                        'facility_id' => $f->id,
                        'expired_at' => $expDate,
                        'threshold_warning_hari' => 30,
                        'last_refilled_at' => Carbon::now()->subMonths(4)->toDateString(),
                    ]);
                }
            } else {
                if (!$f->conditionSchedule) {
                    FacilityConditionSchedule::create([
                        'facility_id' => $f->id,
                        'interval_pemeriksaan_hari' => 30,
                        'terakhir_diperiksa' => $f->last_inspected_at ? $f->last_inspected_at->toDateString() : Carbon::now()->subDays(10)->toDateString(),
                        'status_kondisi_terakhir' => ($f->status === 'Needs Attention' ? 'PERLU_PERHATIAN' : ($f->status === 'Critical' ? 'RUSAK' : 'BAIK')),
                    ]);
                }
            }
        }
    }
}
