<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SafetyFacility;
use App\Models\FacilityConsumableCycle;
use App\Models\FacilityConditionSchedule;
use App\Models\FacilityRefillHistory;
use App\Models\FacilityInspection;
use App\Models\FacilityAlert;
use App\Models\InspectionCapa;
use App\Models\WorkPermit;
use App\Models\Location;
use Carbon\Carbon;

class MonitoringController extends Controller
{
    /**
     * Get safety facilities with branching data (Consumable vs Kondisi).
     */
    public function getFacilities(Request $request)
    {
        $query = SafetyFacility::with([
            'location',
            'consumableCycle',
            'conditionSchedule',
            'inspections' => function ($q) {
                $q->latest()->limit(1)->with('inspector:id,name');
            },
            'refillHistories' => function ($q) {
                $q->latest()->limit(1)->with('user:id,name');
            }
        ])->where('status_aktif', true);

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('tipe_item')) {
            $query->where('tipe_item', strtoupper($request->tipe_item));
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('code', 'like', "%{$s}%")
                  ->orWhere('nama_item', 'like', "%{$s}%")
                  ->orWhere('qr_code_id', 'like', "%{$s}%")
                  ->orWhereHas('location', function ($lq) use ($s) {
                      $lq->where('name', 'like', "%{$s}%");
                  });
            });
        }

        $facilities = $query->orderBy('code')->get();

        // Optional post-filter by calculated_status
        if ($request->filled('status_filter')) {
            $statusFilter = strtoupper($request->status_filter);
            $facilities = $facilities->filter(function ($item) use ($statusFilter) {
                return $item->calculated_status === $statusFilter;
            })->values();
        }

        return response()->json([
            'success' => true,
            'data' => $facilities,
        ]);
    }

    /**
     * Lookup facility by QR Code ID (For mobile inspector scanning).
     */
    public function getFacilityByQrId($qrCodeId)
    {
        $facility = SafetyFacility::with([
            'location',
            'consumableCycle',
            'conditionSchedule',
            'inspections' => function ($q) {
                $q->latest()->limit(5)->with('inspector:id,name');
            },
            'refillHistories' => function ($q) {
                $q->latest()->limit(5)->with('user:id,name');
            }
        ])->where('qr_code_id', $qrCodeId)
          ->orWhere('code', $qrCodeId)
          ->first();

        if (!$facility) {
            return response()->json([
                'success' => false,
                'message' => 'Fasilitas K3 dengan kode QR ini tidak ditemukan dalam database.',
            ], 404);
        }

        // Return checklist template questions along with facility data
        $template = ($facility->tipe_item === 'CONSUMABLE')
            ? [
                ['id' => 'segel_utuh', 'pertanyaan' => 'Segel / pin pengaman masih utuh & terpasang?', 'tipe' => 'boolean'],
                ['id' => 'fisik_tabung', 'pertanyaan' => 'Fisik tabung / kemasan tidak rusak, penyok, atau korosi?', 'tipe' => 'boolean'],
                ['id' => 'label_terbaca', 'pertanyaan' => 'Label identitas & tanggal kadaluarsa terbaca jelas?', 'tipe' => 'boolean'],
                ['id' => 'indikator_tekanan', 'pertanyaan' => 'Tekanan jarum indikator pada zona hijau (Normal)?', 'tipe' => 'pressure'],
                ['id' => 'aksesibilitas', 'pertanyaan' => 'Aksesibilitas bebas rintangan / tidak terhalang barang?', 'tipe' => 'boolean'],
            ]
            : [
                ['id' => 'kondisi_komponen', 'pertanyaan' => 'Kondisi fisik komponen (retak, getas, korosi, penyok)?', 'tipe' => 'skor'],
                ['id' => 'fungsi_mekanis', 'pertanyaan' => 'Fungsi mekanis (dapat dibuka / dioperasikan normal)?', 'tipe' => 'skor'],
                ['id' => 'kebocoran', 'pertanyaan' => 'Kebocoran / rembesan air atau fluida?', 'tipe' => 'skor'],
                ['id' => 'kelengkapan_aksesoris', 'pertanyaan' => 'Kelengkapan aksesoris (nozzle, kunci, selang, bracket)?', 'tipe' => 'skor'],
                ['id' => 'kebersihan_area', 'pertanyaan' => 'Kebersihan & area sekitar bebas obstruksi / penghalang?', 'tipe' => 'skor'],
            ];

        return response()->json([
            'success' => true,
            'data' => [
                'facility' => $facility,
                'checklist_template' => $template,
            ],
        ]);
    }

    /**
     * Store a new safety facility asset with branching logic.
     */
    public function storeFacility(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:safety_facilities,code|max:50',
            'nama_item' => 'nullable|string|max:150',
            'name' => 'nullable|string|max:150',
            'category' => 'required|in:apar,hydrant,emergency_door,p3k,safety_mirror,assembly_point',
            'tipe_item' => 'required|in:CONSUMABLE,KONDISI',
            'location' => 'required',
            'specifications' => 'nullable|array',
            // Consumable specific
            'expired_at' => 'required_if:tipe_item,CONSUMABLE|nullable|date',
            'threshold_warning_hari' => 'nullable|integer|min:1',
            // Kondisi specific
            'interval_pemeriksaan_hari' => 'nullable|integer|min:1',
        ]);

        $locationId = null;
        if (is_numeric($validated['location'])) {
            $locationId = $validated['location'];
        } else {
            $loc = Location::firstOrCreate(['name' => $validated['location']]);
            $locationId = $loc->id;
        }

        // Auto-generate unique QR Code ID
        $prefix = strtoupper($validated['category']);
        $cleanCode = strtoupper(str_replace([' ', '-', '/'], '', $validated['code']));
        $qrCodeId = 'QR-' . $cleanCode;
        if (SafetyFacility::where('qr_code_id', $qrCodeId)->exists()) {
            $qrCodeId .= '-' . strtoupper(substr(md5(uniqid()), 0, 4));
        }

        $namaItem = $validated['nama_item'] ?? ($validated['name'] ?? ($prefix . ' - ' . $validated['code']));

        $facility = SafetyFacility::create([
            'code' => $validated['code'],
            'nama_item' => $namaItem,
            'category' => $validated['category'],
            'tipe_item' => $validated['tipe_item'],
            'qr_code_id' => $qrCodeId,
            'tanggal_daftar' => now()->toDateString(),
            'location_id' => $locationId,
            'specifications' => $validated['specifications'] ?? null,
            'status' => 'Good',
            'status_aktif' => true,
        ]);

        if ($validated['tipe_item'] === 'CONSUMABLE') {
            FacilityConsumableCycle::create([
                'facility_id' => $facility->id,
                'expired_at' => $validated['expired_at'],
                'threshold_warning_hari' => $validated['threshold_warning_hari'] ?? 30,
                'last_refilled_at' => now()->toDateString(),
            ]);
        } else {
            FacilityConditionSchedule::create([
                'facility_id' => $facility->id,
                'interval_pemeriksaan_hari' => $validated['interval_pemeriksaan_hari'] ?? 30,
                'terakhir_diperiksa' => now()->toDateString(),
                'status_kondisi_terakhir' => 'BAIK',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Fasilitas K3 berhasil didaftarkan.',
            'data' => $facility->load(['location', 'consumableCycle', 'conditionSchedule']),
        ], 201);
    }

    /**
     * Submit an inspection checklist according to dual-mode branching logic.
     */
    public function storeInspection(Request $request)
    {
        $validated = $request->validate([
            'facility_id' => 'required|exists:safety_facilities,id',
            'checklist_results' => 'required|array',
            'tipe_checklist' => 'nullable|in:CONSUMABLE_CHECK,KONDISI_CHECK',
            'notes' => 'nullable|string',
            'foto_bukti' => 'nullable|array',

            // Optional CAPA fields
            'finding_description' => 'nullable|string',
            'severity' => 'nullable|in:Minor,Mayor,Kritis',
            'action_plan' => 'nullable|string',
            'pic_name' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        $user = $request->user();
        $facility = SafetyFacility::with(['consumableCycle', 'conditionSchedule'])->findOrFail($validated['facility_id']);

        $checklistType = $validated['tipe_checklist'] ?? ($facility->tipe_item === 'CONSUMABLE' ? 'CONSUMABLE_CHECK' : 'KONDISI_CHECK');
        $answers = $validated['checklist_results'];
        $hasilStatus = 'BAIK';
        $resultStatus = 'Pass';

        if ($checklistType === 'CONSUMABLE_CHECK') {
            // Jalur A: Consumable check
            $hasIssue = false;
            foreach ($answers as $ans) {
                if (isset($ans['passed']) && $ans['passed'] === false) {
                    $hasIssue = true;
                }
                if (isset($ans['jawaban']) && in_array(strtolower($ans['jawaban']), ['tidak', 'rendah', 'tinggi', 'false'])) {
                    $hasIssue = true;
                }
            }

            $currentExpiryStatus = $facility->calculated_status; // AMAN, MENDEKATI_KADALUARSA, KADALUARSA
            if ($currentExpiryStatus === 'KADALUARSA') {
                $hasilStatus = 'KADALUARSA';
                $resultStatus = 'Fail';
            } elseif ($hasIssue || $currentExpiryStatus === 'MENDEKATI_KADALUARSA') {
                $hasilStatus = $currentExpiryStatus === 'MENDEKATI_KADALUARSA' ? 'MENDEKATI_KADALUARSA' : 'PERLU_PERHATIAN';
                $resultStatus = $hasIssue ? 'Fail' : 'Pass';
            } else {
                $hasilStatus = 'AMAN';
                $resultStatus = 'Pass';
            }

            $facility->status = ($resultStatus === 'Pass') ? 'Good' : 'Needs Attention';
        } else {
            // Jalur B: Kondisi check (MAX Score: OK=0, Minor=1, Kritis=2)
            $maxScore = 0;
            foreach ($answers as $ans) {
                $val = strtolower($ans['jawaban'] ?? $ans['score'] ?? 'ok');
                if ($val === 'kritis' || $val === 'rusak' || $val == '2') {
                    $maxScore = max($maxScore, 2);
                } elseif ($val === 'minor' || $val === 'perhatian' || $val == '1') {
                    $maxScore = max($maxScore, 1);
                }
            }

            if ($maxScore === 2) {
                $hasilStatus = 'RUSAK';
                $resultStatus = 'Fail';
                $facility->status = 'Critical';
            } elseif ($maxScore === 1) {
                $hasilStatus = 'PERLU_PERHATIAN';
                $resultStatus = 'Fail';
                $facility->status = 'Needs Attention';
            } else {
                $hasilStatus = 'BAIK';
                $resultStatus = 'Pass';
                $facility->status = 'Good';
            }

            // Update schedule condition
            if ($facility->conditionSchedule) {
                $facility->conditionSchedule->update([
                    'terakhir_diperiksa' => now()->toDateString(),
                    'status_kondisi_terakhir' => $hasilStatus,
                ]);
            }
        }

        $facility->last_inspected_at = now()->toDateString();
        $facility->save();

        $inspection = FacilityInspection::create([
            'facility_id' => $facility->id,
            'inspector_id' => $user->id,
            'inspection_date' => now()->toDateString(),
            'tipe_checklist' => $checklistType,
            'checklist_results' => $answers,
            'result_status' => $resultStatus,
            'notes' => $validated['notes'] ?? null,
            'foto_bukti' => $validated['foto_bukti'] ?? null,
        ]);

        // Auto create alert if result requires attention
        if (in_array($hasilStatus, ['RUSAK', 'PERLU_PERHATIAN', 'KADALUARSA', 'MENDEKATI_KADALUARSA'])) {
            $alertType = match ($hasilStatus) {
                'RUSAK' => 'RUSAK',
                'KADALUARSA' => 'KADALUARSA',
                'MENDEKATI_KADALUARSA' => 'H-30',
                default => 'PERLU_PERHATIAN',
            };

            FacilityAlert::create([
                'facility_id' => $facility->id,
                'jenis_alert' => $alertType,
                'message' => "Inspeksi unit {$facility->code} ({$facility->nama_item}) di {$facility->location?->name}: Status {$hasilStatus}. {$validated['notes']}",
                'is_read' => false,
            ]);
        }

        // Create CAPA if fail and finding provided
        $capa = null;
        if ($resultStatus === 'Fail' && !empty($validated['finding_description'])) {
            $capa = InspectionCapa::create([
                'inspection_id' => $inspection->id,
                'finding_description' => $validated['finding_description'],
                'severity' => $validated['severity'] ?? ($hasilStatus === 'RUSAK' ? 'Kritis' : 'Mayor'),
                'action_plan' => $validated['action_plan'] ?? 'Perbaikan / pergantian fasilitas segera',
                'pic_name' => $validated['pic_name'] ?? 'Tim HSE',
                'due_date' => $validated['due_date'] ?? now()->addDays(7)->toDateString(),
                'status' => 'Open',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Inspeksi fasilitas berhasil disimpan.',
            'data' => [
                'inspection' => $inspection,
                'hasil_status' => $hasilStatus,
                'facility' => $facility->fresh(['location', 'consumableCycle', 'conditionSchedule']),
                'capa' => $capa,
            ],
        ], 201);
    }

    /**
     * Record refill / replacement for consumable items.
     */
    public function recordRefill(Request $request, $id)
    {
        $facility = SafetyFacility::with('consumableCycle')->findOrFail($id);

        if ($facility->tipe_item !== 'CONSUMABLE') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya item tipe CONSUMABLE yang memiliki alur refill/penggantian kadaluarsa.',
            ], 422);
        }

        $validated = $request->validate([
            'new_expired_at' => 'required|date|after:today',
            'vendor_name' => 'nullable|string|max:150',
            'seal_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $cycle = $facility->consumableCycle;
        $oldExp = $cycle ? $cycle->expired_at : null;

        if ($cycle) {
            $cycle->update([
                'expired_at' => $validated['new_expired_at'],
                'last_refilled_at' => now()->toDateString(),
            ]);
        } else {
            $cycle = FacilityConsumableCycle::create([
                'facility_id' => $facility->id,
                'expired_at' => $validated['new_expired_at'],
                'threshold_warning_hari' => 30,
                'last_refilled_at' => now()->toDateString(),
            ]);
        }

        // Log to history
        $history = FacilityRefillHistory::create([
            'facility_id' => $facility->id,
            'user_id' => $request->user()->id,
            'refill_date' => now()->toDateString(),
            'old_expired_at' => $oldExp,
            'new_expired_at' => $validated['new_expired_at'],
            'vendor_name' => $validated['vendor_name'] ?? 'Vendor Rekanan',
            'seal_number' => $validated['seal_number'] ?? null,
            'notes' => $validated['notes'] ?? 'Pengisian / pergantian media tabung baru',
        ]);

        $facility->status = 'Good';
        $facility->last_inspected_at = now()->toDateString();
        $facility->save();

        return response()->json([
            'success' => true,
            'message' => "Refill/penggantian unit {$facility->code} berhasil dicatat. Status kembali AMAN.",
            'data' => [
                'facility' => $facility->fresh(['location', 'consumableCycle', 'refillHistories']),
                'history' => $history,
            ],
        ]);
    }

    /**
     * Get summary metrics for HSE alerts.
     */
    public function getAlertsSummary()
    {
        $facilities = SafetyFacility::with(['consumableCycle', 'conditionSchedule'])->where('status_aktif', true)->get();

        $consumable = [
            'total' => 0,
            'aman' => 0,
            'h30' => 0,
            'kadaluarsa' => 0,
        ];

        $kondisi = [
            'total' => 0,
            'baik' => 0,
            'perlu_perhatian' => 0,
            'perhatian' => 0,
            'rusak' => 0,
            'jadwal_terlewat' => 0,
            'terlewat' => 0,
        ];

        foreach ($facilities as $f) {
            $st = $f->calculated_status;
            if ($f->tipe_item === 'CONSUMABLE') {
                $consumable['total']++;
                if ($st === 'AMAN') $consumable['aman']++;
                elseif ($st === 'MENDEKATI_KADALUARSA') $consumable['h30']++;
                elseif ($st === 'KADALUARSA') $consumable['kadaluarsa']++;
            } else {
                $kondisi['total']++;
                if ($st === 'BAIK') $kondisi['baik']++;
                elseif ($st === 'PERLU_PERHATIAN') {
                    $kondisi['perlu_perhatian']++;
                    $kondisi['perhatian']++;
                }
                elseif ($st === 'RUSAK') $kondisi['rusak']++;
                elseif ($st === 'JADWAL_TERLEWAT') {
                    $kondisi['jadwal_terlewat']++;
                    $kondisi['terlewat']++;
                }
            }
        }

        $unreadAlertsCount = FacilityAlert::where('is_read', false)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'consumable' => $consumable,
                'kondisi' => $kondisi,
                'unread_alerts_count' => $unreadAlertsCount,
            ],
        ]);
    }

    /**
     * Close a CAPA item with proof photo.
     */
    public function closeCapa(Request $request, $id)
    {
        $capa = InspectionCapa::findOrFail($id);

        $request->validate([
            'capa_photo' => 'nullable|file|mimes:jpeg,png,jpg|max:3072',
            'note' => 'nullable|string',
        ]);

        if ($request->hasFile('capa_photo')) {
            $file = $request->file('capa_photo');
            $fileName = time() . '_capa_' . $file->getClientOriginalName();
            $path = $file->storeAs('capa_evidence', $fileName, 'public');
            $capa->capa_photo = '/storage/' . $path;
        }

        $capa->status = 'Closed';
        $capa->save();

        return response()->json([
            'success' => true,
            'message' => 'Temuan CAPA berhasil ditutup dan diverifikasi.',
            'data' => $capa,
        ]);
    }

    /**
     * Safety Performance Index (SPI) & Safe Man-Hours Metrics.
     */
    public function getSpiMetrics()
    {
        $approvedPermits = WorkPermit::where('status', 'Disetujui')->get();
        $totalWorkers = $approvedPermits->sum('total_workers');
        $calculatedHours = 12500 + ($totalWorkers * 8 * 14);
        $openCapas = InspectionCapa::where('status', 'Open')->count();

        $chartData = [
            ['name' => 'Jan', 'compliance' => 95, 'temuan' => 12],
            ['name' => 'Feb', 'compliance' => 97, 'temuan' => 8],
            ['name' => 'Mar', 'compliance' => 94, 'temuan' => 15],
            ['name' => 'Apr', 'compliance' => 98, 'temuan' => 5],
            ['name' => 'Mei', 'compliance' => 99, 'temuan' => 3],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'safeWorkHours' => $calculatedHours,
                'nearMissReports' => 2,
                'incidents' => 0,
                'openFindings' => $openCapas,
                'safeDays' => 28,
                'chartData' => $chartData,
            ],
        ]);
    }
}
