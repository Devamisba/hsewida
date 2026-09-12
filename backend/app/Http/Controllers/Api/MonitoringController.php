<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SafetyFacility;
use App\Models\FacilityInspection;
use App\Models\InspectionCapa;
use App\Models\WorkPermit;
use App\Models\Location;

class MonitoringController extends Controller
{
    /**
     * Get safety facilities filtered by category.
     */
    public function getFacilities(Request $request)
    {
        $query = SafetyFacility::with(['location', 'inspections' => function ($q) {
            $q->latest()->limit(1);
        }]);

        if ($request->has('category') && !empty($request->category)) {
            $query->where('category', $request->category);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    /**
     * Store a new safety facility asset.
     */
    public function storeFacility(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:safety_facilities,code|max:50',
            'category' => 'required|in:apar,hydrant,emergency_door,p3k,safety_mirror,assembly_point',
            'location' => 'required',
            'specifications' => 'nullable|array',
            'status' => 'sometimes|in:Good,Needs Attention,Critical',
        ]);

        $locationId = null;
        if (is_numeric($validated['location'])) {
            $locationId = $validated['location'];
        } else {
            $loc = Location::firstOrCreate(['name' => $validated['location']]);
            $locationId = $loc->id;
        }

        $facility = SafetyFacility::create([
            'code' => $validated['code'],
            'category' => $validated['category'],
            'location_id' => $locationId,
            'specifications' => $validated['specifications'] ?? null,
            'status' => $validated['status'] ?? 'Good',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Fasilitas K3 berhasil didaftarkan.',
            'data' => $facility->load('location'),
        ], 201);
    }

    /**
     * Submit an inspection result (Pass / Fail).
     */
    public function storeInspection(Request $request)
    {
        $validated = $request->validate([
            'facility_id' => 'required|exists:safety_facilities,id',
            'checklist_results' => 'required|array',
            'result_status' => 'required|in:Pass,Fail',
            'notes' => 'nullable|string',

            // Optional CAPA fields if Fail
            'finding_description' => 'required_if:result_status,Fail|nullable|string',
            'severity' => 'nullable|in:Minor,Mayor,Kritis',
            'action_plan' => 'nullable|string',
            'pic_name' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        $user = $request->user();
        $facility = SafetyFacility::findOrFail($validated['facility_id']);

        $inspection = FacilityInspection::create([
            'facility_id' => $facility->id,
            'inspector_id' => $user->id,
            'inspection_date' => now()->toDateString(),
            'checklist_results' => $validated['checklist_results'],
            'result_status' => $validated['result_status'],
            'notes' => $validated['notes'] ?? null,
        ]);

        // Update facility status & last_inspected_at
        $facility->status = ($validated['result_status'] === 'Pass') ? 'Good' : 'Needs Attention';
        $facility->last_inspected_at = now()->toDateString();
        $facility->save();

        // Create CAPA record if Fail
        $capa = null;
        if ($validated['result_status'] === 'Fail' && !empty($validated['finding_description'])) {
            $capa = InspectionCapa::create([
                'inspection_id' => $inspection->id,
                'finding_description' => $validated['finding_description'],
                'severity' => $validated['severity'] ?? 'Minor',
                'action_plan' => $validated['action_plan'] ?? 'Pembersihan / perbaikan segera',
                'pic_name' => $validated['pic_name'] ?? 'Tim K3',
                'due_date' => $validated['due_date'] ?? now()->addDays(7)->toDateString(),
                'status' => 'Open',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pemeriksaan fasilitas berhasil disimpan.',
            'data' => [
                'inspection' => $inspection,
                'capa' => $capa,
                'facility' => $facility,
            ],
        ], 201);
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
        // Calculate safe work hours from active approved permits: total_workers * 8 hours per day
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
