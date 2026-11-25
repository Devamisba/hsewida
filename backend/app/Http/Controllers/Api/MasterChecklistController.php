<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FacilityChecklistTemplate;
use Illuminate\Support\Str;

class MasterChecklistController extends Controller
{
    /**
     * Mengambil seluruh template checklist (bisa difilter per kategori)
     */
    public function index(Request $request)
    {
        $query = FacilityChecklistTemplate::query();

        if ($request->filled('category') && $request->category !== 'all') {
            $cat = strtolower(trim($request->category));
            if ($cat === 'titik_kumpul') $cat = 'assembly_point';
            if ($cat === 'pintu_darurat') $cat = 'emergency_door';
            $query->where('facility_category', $cat);
        }

        if ($request->boolean('active_only', false)) {
            $query->where('is_active', true);
        }

        $templates = $query->orderBy('facility_category')
                           ->orderBy('sort_order', 'asc')
                           ->orderBy('id', 'asc')
                           ->get();

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }

    /**
     * Menyimpan butir parameter checklist baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'facility_category' => 'required|string|max:50',
            'title' => 'required|string|max:150',
            'param_code' => 'nullable|string|max:50',
            'badge_code' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'pass_label' => 'nullable|string|max:50',
            'fail_label' => 'nullable|string|max:50',
            'is_critical' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $cat = strtolower(trim($validated['facility_category']));
        if ($cat === 'titik_kumpul') $cat = 'assembly_point';
        if ($cat === 'pintu_darurat') $cat = 'emergency_door';
        $validated['facility_category'] = $cat;

        // Bersihkan prefix nomor urut dari judul jika ada (misal: "1. Fisik Tabung" -> "Fisik Tabung")
        $validated['title'] = trim(preg_replace('/^\d+[\.\s\-]+/', '', $validated['title']));

        if (empty($validated['param_code'])) {
            $validated['param_code'] = 'p_' . Str::slug(substr($validated['title'], 0, 15), '_') . '_' . rand(10, 99);
        }

        if (empty($validated['badge_code'])) {
            $cleaned = preg_replace('/^[0-9]+\.\s*/', '', $validated['title']);
            $validated['badge_code'] = substr(trim($cleaned), 0, 4);
        }

        if (empty($validated['pass_label'])) {
            $validated['pass_label'] = 'Baik';
        }

        if (empty($validated['fail_label'])) {
            $validated['fail_label'] = 'Rusak';
        }

        if (!isset($validated['sort_order']) || $validated['sort_order'] === null) {
            $maxSort = FacilityChecklistTemplate::where('facility_category', $cat)->max('sort_order') ?? 0;
            $validated['sort_order'] = $maxSort + 1;
        }

        $template = FacilityChecklistTemplate::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Parameter checklist berhasil ditambahkan.',
            'data' => $template,
        ], 201);
    }

    /**
     * Memperbarui data butir parameter checklist
     */
    public function update(Request $request, $id)
    {
        $template = FacilityChecklistTemplate::findOrFail($id);

        $validated = $request->validate([
            'facility_category' => 'sometimes|required|string|max:50',
            'title' => 'sometimes|required|string|max:150',
            'param_code' => 'sometimes|required|string|max:50',
            'badge_code' => 'sometimes|required|string|max:20',
            'description' => 'nullable|string',
            'pass_label' => 'sometimes|required|string|max:50',
            'fail_label' => 'sometimes|required|string|max:50',
            'is_critical' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
        ]);

        if (isset($validated['facility_category'])) {
            $cat = strtolower(trim($validated['facility_category']));
            if ($cat === 'titik_kumpul') $cat = 'assembly_point';
            if ($cat === 'pintu_darurat') $cat = 'emergency_door';
            $validated['facility_category'] = $cat;
        }

        // Bersihkan prefix nomor urut dari judul jika ada
        if (isset($validated['title'])) {
            $validated['title'] = trim(preg_replace('/^\d+[\.\s\-]+/', '', $validated['title']));
        }

        $template->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Parameter checklist berhasil diperbarui.',
            'data' => $template,
        ]);
    }

    /**
     * Menghapus parameter checklist
     */
    public function destroy($id)
    {
        $template = FacilityChecklistTemplate::findOrFail($id);
        $template->delete();

        return response()->json([
            'success' => true,
            'message' => 'Parameter checklist berhasil dihapus.',
        ]);
    }

    /**
     * Mengatur ulang urutan parameter checklist
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:facility_checklist_templates,id',
            'items.*.sort_order' => 'required|integer',
        ]);

        foreach ($validated['items'] as $item) {
            FacilityChecklistTemplate::where('id', $item['id'])
                ->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Urutan parameter checklist berhasil diperbarui.',
        ]);
    }

    /**
     * Endpoint publik/scan untuk mengambil template aktif per kategori
     */
    public function getCategoryChecklists($category = 'apar')
    {
        $cat = strtolower(trim($category));
        if ($cat === 'titik_kumpul') $cat = 'assembly_point';
        if ($cat === 'pintu_darurat') $cat = 'emergency_door';

        $templates = FacilityChecklistTemplate::where('facility_category', $cat)
            ->where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'category' => $cat,
            'data' => $templates,
        ]);
    }
}
