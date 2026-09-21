<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\WorkPermit;
use App\Models\Vendor;
use App\Models\Location;
use App\Models\PermitTypeOption;
use App\Models\PpeOption;
use App\Models\Notification;
use App\Models\SystemSetting;

class WorkPermitController extends Controller
{
    /**
     * Generate auto sequential permit number: WP-YYMM-XXX
     */
    private function generatePermitNumber(): string
    {
        $prefix = 'WP-' . date('ym') . '-';
        $latest = WorkPermit::where('permit_number', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->value('permit_number');

        if ($latest) {
            $lastNumber = intval(substr($latest, -3));
            $nextNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $nextNumber = '001';
        }

        return $prefix . $nextNumber;
    }

    /**
     * Get permits submitted by the current authenticated contractor/vendor.
     */
    public function myRequests(Request $request)
    {
        $user = $request->user();

        $permits = WorkPermit::with(['location', 'vendor', 'permitTypes', 'ppes', 'workers', 'jsas', 'parentPermit:id,permit_number,start_date,end_date,job_title,request_type'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $permits,
        ]);
    }

    /**
     * Get review queue filtered by reviewer role.
     */
    public function reviewQueue(Request $request)
    {
        $user = $request->user();
        $roleCode = $user->role ? $user->role->code : '';

        $query = WorkPermit::with(['location', 'vendor', 'permitTypes', 'ppes', 'workers', 'jsas', 'user:id,name,company_name', 'approvals.user:id,name', 'parentPermit:id,permit_number,start_date,end_date,job_title,request_type']);

        switch ($roleCode) {
            case 'pic_vendor':
                $query->where('status', 'Menunggu PIC Vendor');
                break;
            case 'hse':
                $query->where('status', 'Menunggu HSE');
                break;
            case 'ga_dept_head':
                $query->where('status', 'Menunggu GA Dept Head');
                break;
            case 'ga_div_head':
                $query->where('status', 'Menunggu GA Div Head');
                break;
            case 'admin':
                $query->whereIn('status', [
                    'Menunggu PIC Vendor', 
                    'Menunggu HSE', 
                    'Menunggu GA Dept Head', 
                    'Menunggu GA Div Head'
                ]);
                break;
            default:
                return response()->json(['success' => true, 'data' => []]);
        }

        $permits = $query->orderBy('created_at', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $permits,
        ]);
    }

    /**
     * Get permit history (Approved, Rejected, Completed).
     */
    public function history(Request $request)
    {
        $user = $request->user();
        $roleCode = $user->role ? $user->role->code : '';

        $query = WorkPermit::with(['location', 'vendor', 'permitTypes', 'ppes', 'workers', 'jsas', 'approvals.user:id,name', 'parentPermit:id,permit_number,start_date,end_date,job_title,request_type']);

        if ($roleCode === 'pemohon') {
            $query->where('user_id', $user->id);
        }

        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        $permits = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $permits,
        ]);
    }

    /**
     * Submit a new Work Permit (Wizard 4 Steps).
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // 1. Validate General Fields (Step 1)
        $validated = $request->validate([
            'requestType' => 'required|in:Baru,Perpanjangan',
            'parentPermitId' => 'nullable|exists:work_permits,id',
            'namaKontraktor' => 'required|string|max:255',
            'jenisPekerjaan' => 'required|string|max:255',
            'lokasi' => 'required', // can be location_id or location string
            'mulaiKerja' => 'required|date',
            'selesaiKerja' => 'required|date|after_or_equal:mulaiKerja',
            'jamKerjaMulai' => 'required',
            'jamKerjaAkhir' => 'required',
            'penanggungJawab' => 'required|string|max:255',
            'noHpPJ' => 'required|string|max:50',
            'pengawasPekerjaan' => 'required|string|max:255',
            'noHpPengawas' => 'required|string|max:50',
            'pengawasHse' => 'required|string|max:255',
            'noHpHse' => 'required|string|max:50',
            'totalTenagaKerja' => 'nullable|integer',

            // Step 2
            'permitTypes' => 'required|array|min:1',
            'otherPermitType' => 'nullable|string',
            'ppe' => 'required|array|min:1',
            'workEquipment' => 'nullable|array',

            // Step 3
            'pekerja' => 'required|array|min:1',
            'pekerja.*.nama' => 'required|string',
            'pekerja.*.jabatan' => 'required|string',
            'pekerja.*.alamat' => 'nullable|string',
            'pekerja.*.id_card_photo' => 'nullable|string',

            // Step 4
            'jsa' => 'required|array|min:1',
            'jsa.*.tahapan' => 'required|string',
            'jsa.*.peralatan' => 'nullable|string',
            'jsa.*.potensi' => 'required|string',
            'jsa.*.pengendalian' => 'required|string',
            'jsa.*.tanggapDarurat' => 'required|string',
        ], [
            'namaKontraktor.required' => 'Mohon isi Nama Perusahaan Vendor.',
            'jenisPekerjaan.required' => 'Mohon isi Jenis Pekerjaan.',
            'lokasi.required' => 'Mohon pilih atau ketik Lokasi Pekerjaan.',
            'mulaiKerja.required' => 'Mohon tentukan Tanggal Mulai Kerja.',
            'selesaiKerja.required' => 'Mohon tentukan Tanggal Selesai Kerja.',
            'jamKerjaMulai.required' => 'Mohon tentukan Jam Kerja Mulai.',
            'jamKerjaAkhir.required' => 'Mohon tentukan Jam Kerja Selesai.',
            'penanggungJawab.required' => 'Mohon isi Nama Penanggung Jawab Vendor.',
            'noHpPJ.required' => 'Mohon isi No. HP Penanggung Jawab Vendor.',
            'pengawasPekerjaan.required' => 'Mohon isi Nama Pengawas Pekerjaan (User Widatra).',
            'noHpPengawas.required' => 'Mohon isi No. HP Pengawas Pekerjaan.',
            'pengawasHse.required' => 'Mohon isi Nama Pengawas K3 / HSE Lapangan.',
            'noHpHse.required' => 'Mohon isi No. HP Pengawas K3 / HSE.',
            'permitTypes.required' => 'Mohon pilih minimal satu Jenis Ijin Kerja.',
            'permitTypes.min' => 'Mohon pilih minimal satu Jenis Ijin Kerja.',
            'ppe.required' => 'Mohon pilih minimal satu Alat Pelindung Diri (APD) Wajib.',
            'ppe.min' => 'Mohon pilih minimal satu Alat Pelindung Diri (APD) Wajib.',
            'pekerja.required' => 'Mohon isi data Tenaga Kerja minimal 1 orang.',
            'pekerja.min' => 'Mohon isi data Tenaga Kerja minimal 1 orang.',
            'pekerja.*.nama.required' => 'Mohon lengkapi Nama Tenaga Kerja.',
            'pekerja.*.jabatan.required' => 'Mohon lengkapi Jabatan Tenaga Kerja.',
            'jsa.required' => 'Mohon isi data Job Safety Analysis (JSA) minimal 1 tahapan kerja.',
            'jsa.min' => 'Mohon isi data Job Safety Analysis (JSA) minimal 1 tahapan kerja.',
            'jsa.*.tahapan.required' => 'Mohon isi kolom Tahapan Pekerjaan pada tabel JSA.',
            'jsa.*.potensi.required' => 'Mohon isi kolom Potensi Bahaya pada tabel JSA.',
            'jsa.*.pengendalian.required' => 'Mohon isi kolom Pengendalian Bahaya pada tabel JSA.',
            'jsa.*.tanggapDarurat.required' => 'Mohon isi kolom Tanggap Darurat pada tabel JSA.',
        ]);

        // 2. Business Rules Validation (Configurable via Master Data Settings)
        $maxPermitDays = (int) SystemSetting::getValue('max_permit_duration_days', 6);
        $minLeadDays = (int) SystemSetting::getValue('min_lead_time_days', 3);

        // Rule Lead Time: start_date >= today + minLeadDays (only for new requests)
        $start = Carbon::parse($validated['mulaiKerja'])->startOfDay();
        $minStart = Carbon::today()->addDays($minLeadDays)->startOfDay();
        if ($validated['requestType'] === 'Baru' && $start->lt($minStart)) {
            return response()->json([
                'success' => false,
                'message' => "Aturan K3: Pengajuan ijin kerja baru wajib diajukan minimal H-{$minLeadDays} sebelum tanggal pelaksanaan (" . $minStart->toDateString() . ")."
            ], 422);
        }

        // Rule Max Duration: end_date <= start_date + (maxPermitDays - 1)
        // If $maxPermitDays <= 0, it means unlimited duration (tanpa batasan hari)
        $end = Carbon::parse($validated['selesaiKerja'])->startOfDay();
        if ($end->lt($start)) {
            return response()->json([
                'success' => false,
                'message' => 'Tanggal selesai pekerjaan tidak boleh mendahului tanggal mulai pekerjaan.'
            ], 422);
        }

        if ($maxPermitDays > 0) {
            $maxEnd = $start->copy()->addDays($maxPermitDays - 1);
            if ($end->gt($maxEnd)) {
                return response()->json([
                    'success' => false,
                    'message' => "Aturan K3: Masa berlaku satu ijin kerja maksimal adalah {$maxPermitDays} hari kalender (" . $maxEnd->toDateString() . ")."
                ], 422);
            }
        }

        // Resolve or create Vendor
        $vendor = Vendor::firstOrCreate(
            ['company_name' => $validated['namaKontraktor']],
            [
                'main_contact_name' => $validated['penanggungJawab'],
                'main_contact_phone' => $validated['noHpPJ'],
                'status' => 'Aktif'
            ]
        );

        // Resolve Location ID
        $locationId = null;
        if (is_numeric($validated['lokasi'])) {
            $locationId = $validated['lokasi'];
        } else {
            $loc = Location::firstOrCreate(['name' => $validated['lokasi']]);
            $locationId = $loc->id;
        }

        // Determine Risk Level from Permit Types
        $highRiskTypes = ['Confined Space', 'Hot Work', 'Work at Height', 'High Voltage Electricity', 'Heavy Lifting'];
        $hasHighRisk = false;
        foreach ($validated['permitTypes'] as $ptName) {
            if (in_array($ptName, $highRiskTypes)) {
                $hasHighRisk = true;
                break;
            }
        }
        $riskLevel = $hasHighRisk ? 'Tinggi' : 'Rendah';

        // Execute Database Insertion in a Transaction
        return DB::transaction(function () use ($validated, $user, $vendor, $locationId, $riskLevel) {
            $permitNumber = $this->generatePermitNumber();
            $qrToken = 'QR-' . $permitNumber . '-' . Str::random(8);

            $permit = WorkPermit::create([
                'permit_number' => $permitNumber,
                'user_id' => $user->id,
                'vendor_id' => $vendor->id,
                'request_type' => $validated['requestType'],
                'parent_permit_id' => $validated['parentPermitId'] ?? null,
                'job_title' => $validated['jenisPekerjaan'],
                'location_id' => $locationId,
                'start_date' => $validated['mulaiKerja'],
                'end_date' => $validated['selesaiKerja'],
                'daily_start_time' => $validated['jamKerjaMulai'],
                'daily_end_time' => $validated['jamKerjaAkhir'],
                'pic_name' => $validated['penanggungJawab'],
                'pic_phone' => $validated['noHpPJ'],
                'supervisor_name' => $validated['pengawasPekerjaan'],
                'supervisor_phone' => $validated['noHpPengawas'],
                'hse_officer_name' => $validated['pengawasHse'],
                'hse_officer_phone' => $validated['noHpHse'],
                'total_workers' => count($validated['pekerja']),
                'risk_level' => $riskLevel,
                'status' => 'Menunggu PIC Vendor',
                'qr_code_token' => $qrToken,
            ]);

            // Sync Permit Types
            foreach ($validated['permitTypes'] as $ptName) {
                $opt = PermitTypeOption::firstOrCreate(['name' => $ptName]);
                $customText = ($ptName === 'Others') ? ($validated['otherPermitType'] ?? null) : null;
                $permit->permitTypes()->attach($opt->id, ['custom_type' => $customText]);
            }

            // Sync PPE
            foreach ($validated['ppe'] as $ppeName) {
                $opt = PpeOption::firstOrCreate(['name' => $ppeName]);
                $permit->ppes()->attach($opt->id);
            }

            // Equipments
            if (!empty($validated['workEquipment'])) {
                foreach ($validated['workEquipment'] as $eqName) {
                    if (trim($eqName) !== '') {
                        $permit->equipments()->create(['equipment_name' => trim($eqName)]);
                    }
                }
            }

            // Workers
            foreach ($validated['pekerja'] as $w) {
                $permit->workers()->create([
                    'worker_name' => $w['nama'],
                    'position' => $w['jabatan'],
                    'address' => $w['alamat'] ?? null,
                    'id_card_photo' => $w['id_card_photo'] ?? null,
                ]);
            }

            // JSA
            $seq = 1;
            foreach ($validated['jsa'] as $j) {
                $permit->jsas()->create([
                    'step_sequence' => $seq++,
                    'work_step' => $j['tahapan'],
                    'equipment_used' => $j['peralatan'] ?? null,
                    'hazard_potential' => $j['potensi'],
                    'mitigation_control' => $j['pengendalian'],
                    'emergency_response' => $j['tanggapDarurat'],
                ]);
            }

            // Initial Approval Audit Trail
            $permit->approvals()->create([
                'user_id' => $user->id,
                'role_at_action' => $user->role ? $user->role->code : 'pemohon',
                'action' => 'Submit',
                'note' => 'Pengajuan permit kerja baru oleh vendor.',
                'action_date' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ijin kerja berhasil diajukan dengan nomor ' . $permitNumber,
                'data' => $permit->load(['location', 'permitTypes', 'ppes', 'workers', 'jsas']),
            ], 201);
        });
    }

    /**
     * Get full details of a specific permit.
     */
    public function show($id)
    {
        $permit = WorkPermit::with([
            'user:id,name,email,company_name',
            'vendor',
            'location',
            'permitTypes',
            'ppes',
            'equipments',
            'workers.documents',
            'jsas',
            'approvals.user:id,name',
            'parentPermit:id,permit_number,start_date,end_date,job_title,request_type'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $permit,
        ]);
    }

    /**
     * Approve permit to next review stage.
     */
    public function approve(Request $request, $id)
    {
        $user = $request->user();
        $roleCode = $user->role ? $user->role->code : '';
        $permit = WorkPermit::findOrFail($id);

        $requiredRole = match ($permit->status) {
            'Menunggu PIC Vendor' => 'pic_vendor',
            'Menunggu HSE' => 'hse',
            'Menunggu GA Dept Head' => 'ga_dept_head',
            'Menunggu GA Div Head' => 'ga_div_head',
            default => null,
        };

        if (!$requiredRole) {
            return response()->json([
                'success' => false,
                'message' => 'Status permit tidak valid untuk disetujui (Status saat ini: ' . $permit->status . ').'
            ], 422);
        }

        // Strict sequential enforcement: only the designated role for the active stage (or admin) can approve!
        if ($roleCode !== 'admin' && $roleCode !== $requiredRole) {
            return response()->json([
                'success' => false,
                'message' => 'Wewenang terkunci: Tahap ' . $permit->status . ' hanya dapat disetujui oleh role ' . $requiredRole . '. Role Anda saat ini: ' . ($roleCode ?: 'unauthorized') . '.',
            ], 403);
        }

        $nextStatus = match ($permit->status) {
            'Menunggu PIC Vendor' => 'Menunggu HSE',
            'Menunggu HSE' => 'Menunggu GA Dept Head',
            'Menunggu GA Dept Head' => 'Menunggu GA Div Head',
            'Menunggu GA Div Head' => 'Disetujui',
            default => null,
        };

        $permit->status = $nextStatus;
        if ($nextStatus === 'Disetujui' && !$permit->qr_code_token) {
            $permit->qr_code_token = 'QR-' . $permit->permit_number . '-' . Str::random(8);
        }
        $permit->save();

        // Audit Trail
        $permit->approvals()->create([
            'user_id' => $user->id,
            'role_at_action' => $roleCode,
            'action' => 'Approve',
            'note' => $request->note ?? ('Disetujui oleh ' . ($user->role ? $user->role->name : $user->name)),
            'action_date' => now(),
        ]);

        // Send Notification to Vendor
        Notification::create([
            'user_id' => $permit->user_id,
            'type' => 'permit_approved',
            'reference_id' => $permit->id,
            'message' => 'Ijin kerja ' . $permit->permit_number . ' telah disetujui ke tahap: ' . $nextStatus,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ijin kerja berhasil disetujui ke tahap ' . $nextStatus . '.',
            'data' => $permit->load('approvals.user:id,name'),
        ]);
    }

    /**
     * Reject permit with mandatory reject reason.
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'reject_reason' => 'required|string|min:5',
        ]);

        $user = $request->user();
        $roleCode = $user->role ? $user->role->code : '';
        $permit = WorkPermit::findOrFail($id);

        $requiredRole = match ($permit->status) {
            'Menunggu PIC Vendor' => 'pic_vendor',
            'Menunggu HSE' => 'hse',
            'Menunggu GA Dept Head' => 'ga_dept_head',
            'Menunggu GA Div Head' => 'ga_div_head',
            default => null,
        };

        if (!$requiredRole) {
            return response()->json([
                'success' => false,
                'message' => 'Status permit tidak valid untuk ditolak (Status saat ini: ' . $permit->status . ').'
            ], 422);
        }

        // Strict sequential enforcement for rejection as well
        if ($roleCode !== 'admin' && $roleCode !== $requiredRole) {
            return response()->json([
                'success' => false,
                'message' => 'Wewenang terkunci: Penolakan pada tahap ' . $permit->status . ' hanya dapat dilakukan oleh role ' . $requiredRole . '. Role Anda saat ini: ' . ($roleCode ?: 'unauthorized') . '.',
            ], 403);
        }

        $permit->status = 'Ditolak';
        $permit->reject_reason = $request->reject_reason;
        $permit->save();

        // Audit Trail
        $permit->approvals()->create([
            'user_id' => $user->id,
            'role_at_action' => $roleCode,
            'action' => 'Reject',
            'note' => $request->reject_reason,
            'action_date' => now(),
        ]);

        // Send Notification to Vendor
        Notification::create([
            'user_id' => $permit->user_id,
            'type' => 'permit_rejected',
            'reference_id' => $permit->id,
            'message' => 'Ijin kerja ' . $permit->permit_number . ' ditolak pada tahap ' . $permit->status . '. Alasan: ' . $request->reject_reason,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ijin kerja telah ditolak.',
            'data' => $permit->load('approvals.user:id,name'),
        ]);
    }

    /**
     * Request extension for an approved permit (H-3 before expiry rule).
     */
    public function extend(Request $request, $id)
    {
        $parent = WorkPermit::findOrFail($id);

        if ($parent->status !== 'Disetujui') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya ijin kerja yang telah Disetujui yang dapat diajukan perpanjangan.'
            ], 422);
        }

        // Rule: Only eligible if remaining days <= extension_window_days
        $extensionWindowDays = (int) SystemSetting::getValue('extension_window_days', 3);
        $endDate = Carbon::parse($parent->end_date)->startOfDay();
        $today = Carbon::today();
        $diffDays = $today->diffInDays($endDate, false);

        if ($diffDays > $extensionWindowDays) {
            return response()->json([
                'success' => false,
                'message' => "Perpanjangan hanya dapat diajukan ketika masa berlaku permit tersisa {$extensionWindowDays} hari atau kurang (Sisa hari saat ini: {$diffDays} hari)."
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Permit valid untuk diajukan perpanjangan.',
            'data' => [
                'parent_permit' => $parent->load(['location', 'permitTypes', 'ppes', 'workers', 'jsas']),
                'suggested_start_date' => $endDate->copy()->addDay()->toDateString(),
                'suggested_end_date' => $endDate->copy()->addDays(6)->toDateString(),
            ]
        ]);
    }

    /**
     * Safety close-out / Housekeeping sign-off after work completion.
     */
    public function closePermit(Request $request, $id)
    {
        $user = $request->user();
        $roleCode = $user->role ? $user->role->code : '';
        $permit = WorkPermit::findOrFail($id);

        if ($permit->status !== 'Disetujui') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya ijin kerja berstatus Disetujui yang dapat ditutup/diselesaikan.'
            ], 422);
        }

        $permit->status = 'Selesai';
        $permit->save();

        $permit->approvals()->create([
            'user_id' => $user->id,
            'role_at_action' => $roleCode,
            'action' => 'Close',
            'note' => $request->note ?? 'Penutupan ijin kerja resmi & verifikasi safety housekeeping selesai.',
            'action_date' => now(),
        ]);

        Notification::create([
            'user_id' => $permit->user_id,
            'type' => 'permit_closed',
            'reference_id' => $permit->id,
            'message' => 'Ijin kerja ' . $permit->permit_number . ' telah resmi diselesaikan & ditutup oleh Tim K3 (HSE).',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ijin kerja berhasil ditutup dengan status Selesai.',
            'data' => $permit,
        ]);
    }

    /**
     * Public verification endpoint via QR Code Token.
     */
    public function verifyQrToken($token)
    {
        $permit = WorkPermit::with(['location', 'vendor', 'permitTypes', 'ppes', 'workers'])
            ->where('qr_code_token', $token)
            ->first();

        if (!$permit) {
            return response()->json([
                'success' => false,
                'message' => 'QR Code tidak valid atau ijin kerja tidak ditemukan di sistem HSE Widatra.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Ijin kerja terverifikasi resmi oleh sistem HSE PT Widatra Bhakti.',
            'data' => [
                'permit_number' => $permit->permit_number,
                'job_title' => $permit->job_title,
                'contractor' => $permit->vendor ? $permit->vendor->company_name : $permit->pic_name,
                'location' => $permit->location ? $permit->location->name : '-',
                'period' => $permit->start_date->format('d M Y') . ' s/d ' . $permit->end_date->format('d M Y'),
                'working_hours' => $permit->daily_start_time . ' - ' . $permit->daily_end_time,
                'risk_level' => $permit->risk_level,
                'status' => $permit->status,
                'total_workers' => $permit->total_workers,
                'workers' => $permit->workers->pluck('worker_name'),
            ]
        ]);
    }
}
