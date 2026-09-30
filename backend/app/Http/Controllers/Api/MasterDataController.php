<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Location;
use App\Models\PermitTypeOption;
use App\Models\PpeOption;
use App\Models\Vendor;
use App\Models\SystemSetting;

class MasterDataController extends Controller
{
    // --- LOCATIONS ---
    public function getLocations(Request $request)
    {
        $query = Location::query();
        if ($request->boolean('active_only', false)) {
            $query->where('is_active', true);
        }
        return response()->json(['success' => true, 'data' => $query->orderBy('name')->get()]);
    }

    public function storeLocation(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:locations,name|max:100',
            'description' => 'nullable|string|max:255',
        ]);
        $loc = Location::create($validated);
        return response()->json(['success' => true, 'message' => 'Lokasi berhasil ditambahkan.', 'data' => $loc], 201);
    }

    public function updateLocation(Request $request, $id)
    {
        $loc = Location::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100|unique:locations,name,' . $loc->id,
            'description' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);
        $loc->update($validated);
        return response()->json(['success' => true, 'message' => 'Lokasi berhasil diperbarui.', 'data' => $loc]);
    }

    public function deleteLocation($id)
    {
        $loc = Location::findOrFail($id);
        $loc->delete();
        return response()->json(['success' => true, 'message' => 'Lokasi berhasil dihapus.']);
    }

    // --- PERMIT TYPES ---
    public function getPermitTypes(Request $request)
    {
        $query = PermitTypeOption::with('defaultPpes');
        if ($request->boolean('active_only', false)) {
            $query->where('is_active', true);
        }
        return response()->json(['success' => true, 'data' => $query->orderBy('name')->get()]);
    }

    public function storePermitType(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:permit_type_options,name|max:100',
            'risk_level' => 'sometimes|nullable|in:High Risk,General Risk',
            'is_active' => 'sometimes|boolean',
            'ppe_ids' => 'sometimes|nullable|array',
            'ppe_ids.*' => 'exists:ppe_options,id',
        ]);

        $pt = PermitTypeOption::create([
            'name' => $validated['name'],
            'risk_level' => $validated['risk_level'] ?? 'General Risk',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (isset($validated['ppe_ids']) && is_array($validated['ppe_ids'])) {
            $pt->defaultPpes()->sync($validated['ppe_ids']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Opsi kategori ijin berhasil ditambahkan.',
            'data' => $pt->load('defaultPpes')
        ], 201);
    }

    public function updatePermitType(Request $request, $id)
    {
        $pt = PermitTypeOption::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100|unique:permit_type_options,name,' . $pt->id,
            'risk_level' => 'sometimes|nullable|in:High Risk,General Risk',
            'is_active' => 'sometimes|boolean',
            'ppe_ids' => 'sometimes|nullable|array',
            'ppe_ids.*' => 'exists:ppe_options,id',
        ]);

        $pt->update($request->only(['name', 'risk_level', 'is_active']));

        if ($request->has('ppe_ids')) {
            $pt->defaultPpes()->sync($request->input('ppe_ids', []));
        }

        return response()->json([
            'success' => true,
            'message' => 'Kategori ijin berhasil diperbarui.',
            'data' => $pt->load('defaultPpes')
        ]);
    }

    public function updatePermitTypePpes(Request $request, $id)
    {
        $pt = PermitTypeOption::findOrFail($id);
        $validated = $request->validate([
            'ppe_ids' => 'present|array',
            'ppe_ids.*' => 'exists:ppe_options,id',
        ]);

        $pt->defaultPpes()->sync($validated['ppe_ids']);

        return response()->json([
            'success' => true,
            'message' => 'Standar APD wajib K3 berhasil diperbarui.',
            'data' => $pt->load('defaultPpes'),
        ]);
    }

    public function deletePermitType($id)
    {
        $pt = PermitTypeOption::findOrFail($id);
        $pt->delete();
        return response()->json(['success' => true, 'message' => 'Kategori ijin berhasil dihapus.']);
    }

    // --- PPE OPTIONS ---
    public function getPpeOptions(Request $request)
    {
        $query = PpeOption::query();
        if ($request->boolean('active_only', false)) {
            $query->where('is_active', true);
        }
        return response()->json(['success' => true, 'data' => $query->orderBy('name')->get()]);
    }

    public function storePpeOption(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:ppe_options,name|max:100',
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);
        $ppe = PpeOption::create($validated);
        return response()->json(['success' => true, 'message' => 'Opsi APD berhasil ditambahkan.', 'data' => $ppe], 201);
    }

    public function updatePpeOption(Request $request, $id)
    {
        $ppe = PpeOption::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100|unique:ppe_options,name,' . $ppe->id,
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);
        $ppe->update($validated);
        return response()->json(['success' => true, 'message' => 'Opsi APD berhasil diperbarui.', 'data' => $ppe]);
    }

    public function deletePpeOption($id)
    {
        $ppe = PpeOption::findOrFail($id);
        $ppe->delete();
        return response()->json(['success' => true, 'message' => 'Opsi APD berhasil dihapus.']);
    }

    // --- VENDORS ---
    public function getVendors(Request $request)
    {
        $vendors = Vendor::with('picVendorUser:id,name,email,phone_number')
            ->withCount('workPermits')
            ->orderBy('company_name')
            ->get();
        return response()->json(['success' => true, 'data' => $vendors]);
    }

    public function storeVendor(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'main_contact_name' => 'nullable|string|max:255',
            'main_contact_phone' => 'nullable|string|max:50',
            'pic_vendor_user_id' => 'nullable|exists:users,id',
            'status' => 'sometimes|in:Aktif,Nonaktif,Blacklist',
        ]);
        $vendor = Vendor::create($validated);
        return response()->json(['success' => true, 'message' => 'Vendor berhasil didaftarkan.', 'data' => $vendor->load('picVendorUser')], 201);
    }

    public function updateVendor(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);
        $validated = $request->validate([
            'company_name' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string',
            'main_contact_name' => 'nullable|string|max:255',
            'main_contact_phone' => 'nullable|string|max:50',
            'pic_vendor_user_id' => 'nullable|exists:users,id',
            'status' => 'sometimes|in:Aktif,Nonaktif,Blacklist',
        ]);
        $vendor->update($validated);
        return response()->json(['success' => true, 'message' => 'Data vendor berhasil diperbarui.', 'data' => $vendor->load('picVendorUser')]);
    }

    public function deleteVendor($id)
    {
        $vendor = Vendor::findOrFail($id);
        $vendor->delete();
        return response()->json(['success' => true, 'message' => 'Vendor berhasil dihapus.']);
    }

    // --- WORKFLOW APPROVAL STAGES ---
    public function getWorkflowStages()
    {
        $stages = [
            [
                'step' => 1,
                'stage_code' => 'submission',
                'status_name' => 'Draft / Diajukan',
                'reviewer_role' => 'pemohon',
                'role_name' => 'Vendor / Kontraktor (Pemohon)',
                'sla_hours' => 0,
                'sla_label' => 'Maksimal H-3 Sebelum Pelaksanaan',
                'description' => 'Pengisian formulir 4 langkah: data pekerjaan, permit types & APD, daftar pekerja, dan analisis bahaya JSA.',
                'mandatory_items' => ['Nama Kontraktor & PJ', 'Tanggal & Jam Kerja', 'Checklist APD', 'Daftar Pekerja', 'Mitigasi JSA'],
                'badge_color' => 'blue',
            ],
            [
                'step' => 2,
                'stage_code' => 'pic_review',
                'status_name' => 'Menunggu PIC Vendor',
                'reviewer_role' => 'pic_vendor',
                'role_name' => 'PIC Vendor Internal (PT Widatra Bhakti)',
                'sla_hours' => 8,
                'sla_label' => '8 Jam Kerja',
                'description' => 'Verifikasi keabsahan SPK/kontrak kerja, kelayakan vendor rekanan, data pekerja, dan dokumen BPJS/asuransi aktif.',
                'mandatory_items' => ['Validasi Kontrak / SPK', 'Verifikasi Identitas Pekerja', 'Bukti Kepesertaan BPJS Ketenagakerjaan'],
                'badge_color' => 'indigo',
            ],
            [
                'step' => 3,
                'stage_code' => 'hse_review',
                'status_name' => 'Menunggu HSE',
                'reviewer_role' => 'hse',
                'role_name' => 'Tim K3 / HSE Officer',
                'sla_hours' => 24,
                'sla_label' => '24 Jam Kerja',
                'description' => 'Pemeriksaan aspek keselamatan kerja: validasi potensi bahaya JSA, sertifikasi pekerja khusus (Welder/Scaffolder), kecukupan APD, dan safety induction.',
                'mandatory_items' => ['Validasi JSA & Pengendalian Bahaya', 'Kecukupan APD Standar', 'Sertifikasi Keahlian Khusus', 'Safety Induction Checklist'],
                'badge_color' => 'emerald',
            ],
            [
                'step' => 4,
                'stage_code' => 'ga_dept_review',
                'status_name' => 'Menunggu Head Dept HRD&GA',
                'reviewer_role' => 'ga_dept_head',
                'role_name' => 'Head Dept HRD&GA',
                'sla_hours' => 24,
                'sla_label' => '24 Jam Kerja',
                'description' => 'Validasi ketersediaan area kerja pabrik, izin akses fasilitas industri, serta koordinasi utilitas dan personil pengawas operasional.',
                'mandatory_items' => ['Kesesuaian Lokasi Pabrik', 'Izin Akses Pintu Gerbang', 'Koordinasi Pengawas Area'],
                'badge_color' => 'amber',
            ],
            [
                'step' => 5,
                'stage_code' => 'ga_div_final',
                'status_name' => 'Menunggu Head Division HRD&GA',
                'reviewer_role' => 'ga_div_head',
                'role_name' => 'Head Division HRD&GA',
                'sla_hours' => 24,
                'sla_label' => '24 Jam Kerja',
                'description' => 'Persetujuan eksekutif final (Final Sign-off) yang mengaktifkan status ijin kerja secara resmi dan menerbitkan QR Code terenkripsi.',
                'mandatory_items' => ['Final Approval Sign-off', 'Penerbitan QR Code Digital', 'Notifikasi Resmi Terdistribusi'],
                'badge_color' => 'rose',
            ],
        ];

        $terminalStatuses = [
            ['code' => 'Disetujui', 'name' => 'Ijin Kerja Disetujui (Aktif)', 'type' => 'active', 'description' => 'Permit aktif dan pekerjaan di lapangan diizinkan berjalan sesuai tanggal & jam kerja.'],
            ['code' => 'Ditolak', 'name' => 'Permohonan Ditolak', 'type' => 'rejected', 'description' => 'Ijin kerja ditolak pada salah satu tahap verifikasi disertai alasan penolakan wajib.'],
            ['code' => 'Perpanjangan', 'name' => 'Pengajuan Perpanjangan Berfase', 'type' => 'extension', 'description' => 'Permohonan penambahan durasi kerja berfase (maksimal 6 hari kalender per lembar SIKA).'],
            ['code' => 'Selesai', 'name' => 'Ijin Kerja Ditutup / Selesai', 'type' => 'closed', 'description' => 'Pekerjaan fisik selesai, area telah dibersihkan (housekeeping), dan inspeksi akhir HSE terpenuhi.'],
            ['code' => 'Kadaluwarsa', 'name' => 'Masa Berlaku Habis', 'type' => 'expired', 'description' => 'Tanggal selesai permit telah terlewati otomatis tanpa perpanjangan.'],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'stages' => $stages,
                'terminal_statuses' => $terminalStatuses,
            ]
        ]);
    }

    // --- SYSTEM & POLICY SETTINGS ---
    public function getSettings(Request $request)
    {
        $group = $request->query('group');
        $query = SystemSetting::query();
        if ($group) {
            $query->where('group', $group);
        }
        $settings = $query->orderBy('id')->get();

        $settingsMap = [];
        foreach ($settings as $s) {
            $settingsMap[$s->key] = $s->type === 'number' && is_numeric($s->value) ? (int)$s->value : $s->value;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'list' => $settings,
                'map' => $settingsMap,
            ]
        ]);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required',
        ]);

        foreach ($validated['settings'] as $item) {
            $setting = SystemSetting::where('key', $item['key'])->first();
            if ($setting) {
                if ($item['key'] === 'max_permit_duration_days' && (int)$item['value'] < 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Masa berlaku maksimal izin kerja tidak boleh bernilai negatif.'
                    ], 422);
                }
                if ($item['key'] === 'min_lead_time_days' && (int)$item['value'] < 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Lead time pengajuan izin tidak boleh bernilai negatif.'
                    ], 422);
                }
                if ($item['key'] === 'extension_window_days' && (int)$item['value'] < 1) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Jendela perpanjangan izin minimal 1 hari sebelum kedaluwarsa.'
                    ], 422);
                }

                $setting->update(['value' => (string)$item['value']]);
            }
        }

        $allSettings = SystemSetting::orderBy('id')->get();
        $settingsMap = [];
        foreach ($allSettings as $s) {
            $settingsMap[$s->key] = $s->type === 'number' && is_numeric($s->value) ? (int)$s->value : $s->value;
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan kebijakan SIKA berhasil diperbarui.',
            'data' => [
                'list' => $allSettings,
                'map' => $settingsMap,
            ]
        ]);
    }
}
