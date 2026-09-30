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
                $q->latest()->limit(10)->with('inspector:id,name');
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

        if ($request->filled('area_zone') && $request->area_zone !== 'all') {
            $query->where('area_zone', $request->area_zone);
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
        ])->where(function ($query) use ($qrCodeId) {
            $clean = strtoupper(trim($qrCodeId));
            $query->where('qr_code_id', $clean)
                  ->orWhere('code', $clean)
                  ->orWhere('qr_code_id', 'QR-APAR-' . $clean);
          })->first();

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
     * Get inspection history for a specific safety facility.
     */
    public function getFacilityInspections($id)
    {
        $facility = SafetyFacility::with(['location', 'consumableCycle', 'conditionSchedule'])->findOrFail($id);
        $inspections = FacilityInspection::where('facility_id', $facility->id)
            ->with('inspector:id,name')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'facility' => $facility,
                'inspections' => $inspections,
            ]
        ]);
    }

    /**
     * Get all facility inspection statuses with multi-criteria filtering (Modul Inspeksi).
     * Encompasses the full facility fleet so inspectors know which are Checked vs Unchecked.
     */
    public function getAllInspections(Request $request)
    {
        $category = $request->input('category', 'all');
        $areaZone = $request->input('area_zone', 'ALL');
        $checkStatus = $request->input('check_status', 'ALL'); // ALL, UNCHECKED, CHECKED, PENDING, VERIFIED
        $verificationStatus = $request->input('verification_status', 'ALL');
        $resultStatus = $request->input('result_status', 'ALL');
        $dateRange = $request->input('date_range', 'all');
        $search = trim($request->input('search', ''));
        $sortBy = $request->input('sort_by', 'code_asc'); // code_asc, unchecked_first, checked_first, latest

        $query = SafetyFacility::with([
            'location',
            'consumableCycle',
            'conditionSchedule',
            'latestInspection.inspector:id,name',
        ])->where('status_aktif', true);

        // 1. Filter Category (apar, hydrant, emergency_door, p3k, safety_mirror, assembly_point, all)
        if ($category && $category !== 'all' && $category !== 'ALL') {
            $query->where('category', strtolower($category));
        }

        // 2. Filter Area Zone (UMUM, FACTORY 1, FACTORY 2 & WORKSHOP, WARE HOUSE)
        if ($areaZone && $areaZone !== 'ALL' && $areaZone !== 'all') {
            $query->where('area_zone', strtoupper($areaZone));
        }

        // 3. Search Keyword
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('nama_item', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('qr_code_id', 'like', "%{$search}%")
                  ->orWhereHas('location', function ($lq) use ($search) {
                      $lq->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('latestInspection', function ($iq) use ($search) {
                      $iq->where('inspector_name', 'like', "%{$search}%")
                         ->orWhere('pic_name', 'like', "%{$search}%")
                         ->orWhere('notes', 'like', "%{$search}%")
                         ->orWhere('verification_notes', 'like', "%{$search}%");
                  });
            });
        }

        // 4. Filter Date Range on inspection
        if ($dateRange !== 'all') {
            $query->whereHas('latestInspection', function ($iq) use ($dateRange) {
                if ($dateRange === 'today') {
                    $iq->whereDate('created_at', Carbon::today());
                } elseif ($dateRange === 'last_7_days') {
                    $iq->whereDate('created_at', '>=', Carbon::today()->subDays(7));
                } elseif ($dateRange === 'this_month') {
                    $iq->whereMonth('created_at', Carbon::now()->month)
                       ->whereYear('created_at', Carbon::now()->year);
                }
            });
        }

        // 5. Filter Check Status (UNCHECKED vs CHECKED)
        if ($checkStatus === 'UNCHECKED') {
            $query->doesntHave('latestInspection');
        } elseif ($checkStatus === 'CHECKED') {
            $query->has('latestInspection');
        } elseif ($checkStatus === 'PENDING') {
            $query->whereHas('latestInspection', function ($q) {
                $q->where(function ($sq) {
                    $sq->whereNull('verification_status')
                       ->orWhere('verification_status', '!=', 'VERIFIED')
                       ->orWhere('inspection_stage', 'PETUGAS')
                       ->orWhere('inspection_stage', 'PETUGAS_SUBMITTED');
                })->where('inspection_stage', '!=', 'PIC_VERIFIED');
            });
        } elseif ($checkStatus === 'VERIFIED') {
            $query->whereHas('latestInspection', function ($q) {
                $q->where('verification_status', 'VERIFIED')
                  ->orWhere('inspection_stage', 'PIC_VERIFIED');
            });
        }

        // 6. Filter verification_status (if passed specifically)
        if ($verificationStatus && $verificationStatus !== 'ALL') {
            $vst = strtoupper($verificationStatus);
            if (in_array($vst, ['VERIFIED', 'TERVERIFIKASI'])) {
                $query->whereHas('latestInspection', function ($q) {
                    $q->where('verification_status', 'VERIFIED')
                      ->orWhere('inspection_stage', 'PIC_VERIFIED');
                });
            } elseif (in_array($vst, ['PENDING', 'WAITING', 'MENUNGGU', 'MENUNGGU_VERIFIKASI'])) {
                $query->whereHas('latestInspection', function ($q) {
                    $q->where(function ($sq) {
                        $sq->whereNull('verification_status')
                           ->orWhere('verification_status', '!=', 'VERIFIED')
                           ->orWhere('inspection_stage', 'PETUGAS')
                           ->orWhere('inspection_stage', 'PETUGAS_SUBMITTED');
                    })->where('inspection_stage', '!=', 'PIC_VERIFIED');
                });
            } elseif ($vst === 'REFILL_REQUESTED' || $vst === 'REVISE') {
                $query->whereHas('latestInspection', fn($q) => $q->where('verification_status', $vst));
            }
        }

        // 7. Filter result_status (Pass vs Fail)
        if ($resultStatus && $resultStatus !== 'ALL') {
            $query->whereHas('latestInspection', fn($q) => $q->where('result_status', $resultStatus));
        }

        // Calculate KPI summary on base query (category + zone)
        $baseQuery = SafetyFacility::where('status_aktif', true);
        if ($category && $category !== 'all' && $category !== 'ALL') {
            $baseQuery->where('category', strtolower($category));
        }
        if ($areaZone && $areaZone !== 'ALL' && $areaZone !== 'all') {
            $baseQuery->where('area_zone', strtoupper($areaZone));
        }

        $totalFacilities = (clone $baseQuery)->count();
        $checkedFacilities = (clone $baseQuery)->has('latestInspection')->count();
        $uncheckedFacilities = max(0, $totalFacilities - $checkedFacilities);

        $verifiedCount = (clone $baseQuery)->whereHas('latestInspection', function ($q) {
            $q->where('verification_status', 'VERIFIED')
              ->orWhere('inspection_stage', 'PIC_VERIFIED');
        })->count();

        $pendingCount = (clone $baseQuery)->whereHas('latestInspection', function ($q) {
            $q->where(function ($sq) {
                $sq->whereNull('verification_status')
                   ->orWhere('verification_status', '!=', 'VERIFIED')
                   ->orWhere('inspection_stage', 'PETUGAS')
                   ->orWhere('inspection_stage', 'PETUGAS_SUBMITTED');
            })->where('inspection_stage', '!=', 'PIC_VERIFIED');
        })->count();

        $findingsCount = (clone $baseQuery)->whereHas('latestInspection', fn($q) => $q->where('result_status', 'Fail'))->count();
        $passedCount = (clone $baseQuery)->whereHas('latestInspection', fn($q) => $q->where('result_status', 'Pass'))->count();

        // Zone counts for active category
        $zoneBase = SafetyFacility::where('status_aktif', true);
        if ($category && $category !== 'all' && $category !== 'ALL') {
            $zoneBase->where('category', strtolower($category));
        }

        $zoneCounts = [
            'ALL' => (clone $zoneBase)->count(),
            'UMUM' => (clone $zoneBase)->where('area_zone', 'UMUM')->count(),
            'FACTORY 1' => (clone $zoneBase)->where('area_zone', 'FACTORY 1')->count(),
            'FACTORY 2 & WORKSHOP' => (clone $zoneBase)->where('area_zone', 'FACTORY 2 & WORKSHOP')->count(),
            'WARE HOUSE' => (clone $zoneBase)->where('area_zone', 'WARE HOUSE')->count(),
        ];

        // Category counts (Fleet wide)
        $categoryCounts = [
            'all' => SafetyFacility::where('status_aktif', true)->count(),
            'apar' => SafetyFacility::where('status_aktif', true)->where('category', 'apar')->count(),
            'hydrant' => SafetyFacility::where('status_aktif', true)->where('category', 'hydrant')->count(),
            'emergency_door' => SafetyFacility::where('status_aktif', true)->where('category', 'emergency_door')->count(),
            'p3k' => SafetyFacility::where('status_aktif', true)->where('category', 'p3k')->count(),
            'safety_mirror' => SafetyFacility::where('status_aktif', true)->where('category', 'safety_mirror')->count(),
            'assembly_point' => SafetyFacility::where('status_aktif', true)->where('category', 'assembly_point')->count(),
        ];

        // Apply Sorting (default: code_asc A-01, A-02, A-03...)
        if ($sortBy === 'unchecked_first') {
            $query->leftJoin('facility_inspections as fi_sort', 'fi_sort.facility_id', '=', 'safety_facilities.id')
                  ->orderByRaw('CASE WHEN fi_sort.id IS NULL THEN 0 ELSE 1 END')
                  ->orderBy('safety_facilities.code', 'asc')
                  ->select('safety_facilities.*')
                  ->distinct();
        } elseif ($sortBy === 'checked_first') {
            $query->leftJoin('facility_inspections as fi_sort', 'fi_sort.facility_id', '=', 'safety_facilities.id')
                  ->orderByRaw('CASE WHEN fi_sort.id IS NOT NULL THEN 0 ELSE 1 END')
                  ->orderBy('safety_facilities.code', 'asc')
                  ->select('safety_facilities.*')
                  ->distinct();
        } elseif ($sortBy === 'latest') {
            $query->leftJoin('facility_inspections as fi_sort', 'fi_sort.facility_id', '=', 'safety_facilities.id')
                  ->orderByRaw('CASE WHEN fi_sort.id IS NOT NULL THEN 0 ELSE 1 END')
                  ->orderByDesc('fi_sort.created_at')
                  ->orderBy('safety_facilities.code', 'asc')
                  ->select('safety_facilities.*')
                  ->distinct();
        } else {
            // Default: strict alphabetical / natural code sorting
            $query->orderBy('code', 'asc');
        }

        // Pagination
        $perPage = (int) $request->input('per_page', 50);
        $page = max(1, (int) $request->input('page', 1));

        $totalFiltered = (clone $query)->count();
        if ($perPage > 0) {
            $facilities = $query->skip(($page - 1) * $perPage)->take($perPage)->get();
        } else {
            $facilities = $query->get();
        }

        // Transform into uniform inspection view items
        $items = $facilities->map(function ($fac) {
            $latest = $fac->latestInspection;
            $hasInspection = !is_null($latest);

            // Determine unified check status
            $checkStatus = 'UNCHECKED';
            $checkStatusLabel = 'Belum Dicek';
            if ($hasInspection) {
                if ($latest->verification_status === 'VERIFIED' || $latest->inspection_stage === 'PIC_VERIFIED') {
                    $checkStatus = 'VERIFIED';
                    $checkStatusLabel = 'Terverifikasi PIC';
                } elseif ($latest->verification_status === 'REVISE') {
                    $checkStatus = 'REVISE';
                    $checkStatusLabel = 'Perlu Revisi';
                } elseif ($latest->verification_status === 'REFILL_REQUESTED') {
                    $checkStatus = 'REFILL_REQUESTED';
                    $checkStatusLabel = 'Perlu Refill';
                } else {
                    $checkStatus = 'PENDING';
                    $checkStatusLabel = 'Menunggu Verifikasi PIC';
                }
            }

            return [
                'facility_id' => $fac->id,
                'facility_code' => $fac->code,
                'facility_name' => $fac->nama_item,
                'category' => $fac->category,
                'area_zone' => $fac->area_zone,
                'location_name' => $fac->location?->name ?? 'Pabrik Widatra',
                'calculated_status' => $fac->calculated_status,
                'has_inspection' => $hasInspection,
                'check_status' => $checkStatus,
                'check_status_label' => $checkStatusLabel,
                // Latest inspection details (if inspected)
                'inspection_id' => $latest?->id,
                'inspection_date' => $latest?->inspection_date ?? $latest?->created_at,
                'inspector_name' => $latest?->inspector_name ?? ($latest?->inspector?->name ?? null),
                'pic_name' => $latest?->pic_name ?? null,
                'tipe_checklist' => $latest?->tipe_checklist,
                'checklist_results' => $latest?->checklist_results ?? [],
                'result_status' => $latest?->result_status,
                'inspection_stage' => $latest?->inspection_stage,
                'verification_status' => $latest?->verification_status,
                'verification_notes' => $latest?->verification_notes,
                'verified_at' => $latest?->verified_at,
                'notes' => $latest?->notes,
                'foto_bukti' => $latest?->foto_bukti ?? [],
                'facility' => $fac,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
                'inspections' => $items, // backward-compatible alias
                'pagination' => [
                    'total' => $totalFiltered,
                    'per_page' => $perPage,
                    'current_page' => $page,
                    'last_page' => $perPage > 0 ? (int) ceil($totalFiltered / $perPage) : 1,
                ],
                'summary' => [
                    'total' => $totalFacilities,
                    'total_facilities' => $totalFacilities,
                    'checked' => $checkedFacilities,
                    'unchecked' => $uncheckedFacilities,
                    'verified' => $verifiedCount,
                    'pending_verification' => $pendingCount,
                    'findings' => $findingsCount,
                    'passed' => $passedCount,
                ],
                'category_counts' => $categoryCounts,
                'zone_counts' => $zoneCounts,
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

    /**
     * Get APAR detail by scan code (code or QR code ID).
     */
    public function getAparByScanCode($code)
    {
        $cleanCode = strtoupper(trim($code));
        $facility = SafetyFacility::with([
            'location',
            'consumableCycle',
            'inspections' => function ($q) {
                $q->latest()->limit(5)->with('inspector:id,name');
            },
            'refillHistories' => function ($q) {
                $q->latest()->limit(5);
            }
        ])->where('code', $cleanCode)
          ->orWhere('qr_code_id', $cleanCode)
          ->orWhere('qr_code_id', 'QR-APAR-' . $cleanCode)
          ->first();

        if (!$facility) {
            return response()->json([
                'success' => false,
                'message' => "Tabung APAR dengan kode '$code' tidak ditemukan dalam sistem.",
            ], 404);
        }

        $latestInspection = $facility->inspections->first();
        $specs = $facility->specifications ?? [];

        $totalApar = SafetyFacility::where('category', 'apar')->count();
        $monitoredCount = SafetyFacility::where('category', 'apar')
            ->where(function ($q) {
                $q->whereMonth('last_inspected_at', now()->month)
                  ->whereYear('last_inspected_at', now()->year);
            })->count();
        $unmonitoredCount = max(0, $totalApar - $monitoredCount);

        return response()->json([
            'success' => true,
            'data' => [
                'facility' => $facility,
                'latest_inspection' => $latestInspection,
                'latest_inspector_name' => $latestInspection?->inspector_name ?? ($specs['last_inspector_name'] ?? null),
                'latest_pic_name' => $latestInspection?->pic_name ?? ($specs['last_pic_name'] ?? null),
                'inspection_stage' => $latestInspection?->inspection_stage ?? ($specs['inspection_stage'] ?? 'INITIAL'),
                'inspection_status_label' => $specs['inspection_status_label'] ?? null,
                'is_refill_queue' => $specs['is_refill_queue'] ?? ($facility->calculated_status === 'KADALUARSA'),
                'stats' => [
                    'total_apar' => $totalApar,
                    'monitored_count' => $monitoredCount,
                    'unmonitored_count' => $unmonitoredCount,
                ],
            ],
        ]);
    }

    /**
     * FORM 1: Submit Petugas Tim HSE Inspection.
     */
    public function submitPetugasInspection(Request $request, $code)
    {
        $cleanCode = strtoupper(trim($code));
        $facility = SafetyFacility::where('code', $cleanCode)
            ->orWhere('qr_code_id', $cleanCode)
            ->orWhere('qr_code_id', 'QR-APAR-' . $cleanCode)
            ->firstOrFail();

        $validated = $request->validate([
            'inspector_name' => 'required|string|max:150', // Native text input
            'notes' => 'required|string|min:3',           // Mandatory catatan
            'tbg' => 'required|boolean',                  // Tabung
            'slg' => 'required|boolean',                  // Selang
            'nozz' => 'required|boolean',                 // Nozzle
            'sgl' => 'required|boolean',                  // Segel & pin
            'lev' => 'required|boolean',                  // Lever & tekanan
            'foto_bukti' => 'nullable|string',            // Real-time camera photo
        ]);

        $allPassed = $validated['tbg'] && $validated['slg'] && $validated['nozz'] && $validated['sgl'] && $validated['lev'];
        $resultStatus = $allPassed ? 'Pass' : 'Fail';

        // Checklists breakdown matching official 5 parameters
        $checklistResults = [
            ['id' => 'tbg', 'code' => 'Tbg', 'label' => 'Kondisi Tabung', 'passed' => $validated['tbg'], 'jawaban' => $validated['tbg'] ? 'Baik' : 'Karat / Rusak'],
            ['id' => 'slg', 'code' => 'Slg', 'label' => 'Selang (Hose)', 'passed' => $validated['slg'], 'jawaban' => $validated['slg'] ? 'Baik / Fleksibel' : 'Retak / Tersumbat'],
            ['id' => 'nozz', 'code' => 'Nozz', 'label' => 'Nozzle (Corong)', 'passed' => $validated['nozz'], 'jawaban' => $validated['nozz'] ? 'Bersih / Utuh' : 'Pecah / Buntu'],
            ['id' => 'sgl', 'code' => 'Sgl', 'label' => 'Segel & Pin', 'passed' => $validated['sgl'], 'jawaban' => $validated['sgl'] ? 'Utuh Terkunci' : 'Putus / Hilang'],
            ['id' => 'lev', 'code' => 'Lev', 'label' => 'Lever & Tekanan', 'passed' => $validated['lev'], 'jawaban' => $validated['lev'] ? 'Normal (Zona Hijau)' : 'Kurang / Macet'],
        ];

        $photos = !empty($validated['foto_bukti']) ? [$validated['foto_bukti']] : [];

        $inspection = FacilityInspection::create([
            'facility_id' => $facility->id,
            'inspector_id' => auth()->id(),
            'inspector_name' => $validated['inspector_name'],
            'inspection_date' => now()->toDateString(),
            'tipe_checklist' => 'CONSUMABLE_CHECK',
            'checklist_results' => $checklistResults,
            'result_status' => $resultStatus,
            'inspection_stage' => 'PETUGAS',
            'notes' => $validated['notes'],
            'foto_bukti' => $photos,
        ]);

        // Update facility specifications with tracking metadata
        $specs = $facility->specifications ?? [];
        $specs['last_inspector_name'] = $validated['inspector_name'];
        $specs['inspection_stage'] = 'PETUGAS_SUBMITTED';
        $specs['inspection_status_label'] = "Diinspeksi oleh {$validated['inspector_name']} — Menunggu Verifikasi PIC";
        $specs['last_inspection_id'] = $inspection->id;

        $facility->specifications = $specs;
        $facility->last_inspected_at = now()->toDateString();
        $facility->status = $allPassed ? 'Good' : 'Needs Attention';
        $facility->save();

        return response()->json([
            'success' => true,
            'message' => "Inspeksi oleh Petugas {$validated['inspector_name']} berhasil disimpan. Menunggu verifikasi PIC.",
            'data' => [
                'facility' => $facility,
                'inspection' => $inspection,
            ]
        ]);
    }

    /**
     * FORM 2: Submit PIC HSE Verification.
     */
    public function submitPicVerification(Request $request, $code)
    {
        $cleanCode = strtoupper(trim($code));
        $facility = SafetyFacility::where('code', $cleanCode)
            ->orWhere('qr_code_id', $cleanCode)
            ->orWhere('qr_code_id', 'QR-APAR-' . $cleanCode)
            ->firstOrFail();

        $validated = $request->validate([
            'pic_name' => 'required|string|max:150', // Native text input
            'verification_status' => 'required|in:VERIFIED,REVISE,REFILL_REQUESTED',
            'verification_notes' => 'nullable|string',
        ]);

        $latestInspection = FacilityInspection::where('facility_id', $facility->id)
            ->latest()
            ->first();

        $inspectorName = $latestInspection?->inspector_name
            ?? ($facility->specifications['last_inspector_name'] ?? 'Petugas Lapangan');

        if ($latestInspection) {
            $latestInspection->update([
                'pic_name' => $validated['pic_name'],
                'inspection_stage' => 'PIC_VERIFIED',
                'verified_at' => now(),
                'verification_status' => $validated['verification_status'],
                'verification_notes' => $validated['verification_notes'],
            ]);
        }

        // Update facility specifications
        $specs = $facility->specifications ?? [];
        $specs['last_pic_name'] = $validated['pic_name'];
        $specs['inspection_stage'] = 'PIC_VERIFIED';
        $specs['inspection_status_label'] = "Terverifikasi Penuh oleh PIC {$validated['pic_name']} (Pemeriksa: {$inspectorName})";

        if ($validated['verification_status'] === 'REFILL_REQUESTED') {
            $specs['is_refill_queue'] = true;
        }

        $facility->specifications = $specs;
        $facility->save();

        return response()->json([
            'success' => true,
            'message' => "Verifikasi oleh PIC {$validated['pic_name']} atas pemeriksaan {$inspectorName} berhasil disimpan.",
            'data' => [
                'facility' => $facility,
                'status_label' => $specs['inspection_status_label'],
            ]
        ]);
    }

    /**
     * Get Refill Tracker summary (27 units or any active refill queues).
     */
    public function getRefillSummary(Request $request)
    {
        $facilities = SafetyFacility::with(['location', 'consumableCycle', 'refillHistories'])
            ->where('category', 'apar')
            ->where('status_aktif', true)
            ->get();

        $refillList = $facilities->filter(function ($item) {
            $specs = $item->specifications ?? [];
            return !empty($specs['is_refill_queue']) || $item->calculated_status === 'KADALUARSA';
        })->sort(function ($a, $b) {
            $aKadaluarsa = $a->calculated_status === 'KADALUARSA' ? 1 : 0;
            $bKadaluarsa = $b->calculated_status === 'KADALUARSA' ? 1 : 0;
            if ($aKadaluarsa !== $bKadaluarsa) {
                return $bKadaluarsa <=> $aKadaluarsa;
            }
            $aDate = $a->consumableCycle?->expired_at ? strtotime($a->consumableCycle->expired_at) : 0;
            $bDate = $b->consumableCycle?->expired_at ? strtotime($b->consumableCycle->expired_at) : 0;
            if ($aDate !== $bDate) {
                return $aDate <=> $bDate;
            }
            return $b->id <=> $a->id;
        })->values();

        // Breakdown by media type and capacity
        $breakdown = [];
        foreach ($refillList as $item) {
            $specs = $item->specifications ?? [];
            $media = $specs['type'] ?? 'Dry Chemical Powder';
            $cap = $specs['capacity'] ?? '3 Kg';
            $key = $media . ' - ' . $cap;
            $breakdown[$key] = ($breakdown[$key] ?? 0) + 1;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_refill_needed' => $refillList->count(),
                'breakdown' => $breakdown,
                'list' => $refillList,
            ]
        ]);
    }
}
