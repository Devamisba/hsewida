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
            $catPrefix = match($cat) {
                'emergency_door' => 'door',
                'assembly_point' => 'assembly',
                'safety_mirror' => 'mirror',
                'p3k' => 'p3k',
                'hydrant' => 'hydrant',
                default => 'p',
            };
            $slug = Str::slug($validated['title'], '_');
            $validated['param_code'] = substr($catPrefix . '_' . $slug, 0, 45);
        }

        if (empty($validated['badge_code'])) {
            $cleaned = trim(preg_replace('/^[0-9]+\.\s*/', '', $validated['title']));
            $words = preg_split('/\s+/', $cleaned);
            if (count($words) === 1) {
                $validated['badge_code'] = strtoupper(substr($words[0], 0, 5));
            } else {
                $initials = '';
                foreach ($words as $w) {
                    if (!empty($w)) $initials .= strtoupper($w[0]);
                }
                $validated['badge_code'] = substr($initials, 0, 5) ?: strtoupper(substr($cleaned, 0, 4));
            }
        }

        if (empty($validated['pass_label'])) {
            $validated['pass_label'] = 'Baik';
        }

        if (empty($validated['fail_label'])) {
            $validated['fail_label'] = 'Rusak';
        }

        $totalCount = FacilityChecklistTemplate::where('facility_category', $cat)->count();
        if (isset($validated['sort_order']) && $validated['sort_order'] !== null) {
            $targetOrder = max(1, min($totalCount + 1, (int) $validated['sort_order']));
            // Jika disisipkan sebelum item terakhir, geser item yang ada ke bawah (+1)
            if ($targetOrder <= $totalCount) {
                FacilityChecklistTemplate::where('facility_category', $cat)
                    ->where('sort_order', '>=', $targetOrder)
                    ->increment('sort_order');
            }
            $validated['sort_order'] = $targetOrder;
        } else {
            $validated['sort_order'] = $totalCount + 1;
        }

        $template = FacilityChecklistTemplate::create($validated);
        $this->resequenceCategory($cat);
        $template->refresh();

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
            'param_code' => 'nullable|string|max:50',
            'badge_code' => 'nullable|string|max:20',
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

        if (empty($validated['param_code'])) {
            $validated['param_code'] = $template->param_code ?: ('p_' . Str::slug($validated['title'] ?? $template->title, '_'));
        }
        if (empty($validated['badge_code'])) {
            $validated['badge_code'] = $template->badge_code ?: strtoupper(substr($validated['title'] ?? $template->title, 0, 4));
        }

        $oldCategory = $template->facility_category;
        $targetCategory = $validated['facility_category'] ?? $oldCategory;
        $oldOrder = (int) $template->sort_order;

        if (isset($validated['sort_order'])) {
            $totalCount = FacilityChecklistTemplate::where('facility_category', $targetCategory)->count();
            // Batasi nomor urut baru antara 1 dan total item yang ada (tidak boleh lebih dari jumlah item)
            $newOrder = max(1, min($totalCount, (int) $validated['sort_order']));
            $validated['sort_order'] = $newOrder;

            // Jika ada perubahan urutan di dalam kategori yang sama
            if ($targetCategory === $oldCategory && $newOrder !== $oldOrder) {
                if ($newOrder < $oldOrder) {
                    // Geser item di rentang [newOrder, oldOrder - 1] naik (+1)
                    FacilityChecklistTemplate::where('facility_category', $targetCategory)
                        ->where('id', '!=', $template->id)
                        ->where('sort_order', '>=', $newOrder)
                        ->where('sort_order', '<', $oldOrder)
                        ->increment('sort_order');
                } else {
                    // Geser item di rentang [oldOrder + 1, newOrder] turun (-1)
                    FacilityChecklistTemplate::where('facility_category', $targetCategory)
                        ->where('id', '!=', $template->id)
                        ->where('sort_order', '>', $oldOrder)
                        ->where('sort_order', '<=', $newOrder)
                        ->decrement('sort_order');
                }
            }
        }

        $template->update($validated);

        // Pastikan urutan selalu sekuensial sempurna
        $this->resequenceCategory($targetCategory);
        if ($oldCategory !== $targetCategory) {
            $this->resequenceCategory($oldCategory);
        }

        $template->refresh();

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
        $cat = $template->facility_category;
        $template->delete();

        // Rapikan kembali nomor urut setelah penghapusan
        $this->resequenceCategory($cat);

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

        $category = null;
        foreach ($validated['items'] as $item) {
            $record = FacilityChecklistTemplate::find($item['id']);
            if ($record) {
                $record->update(['sort_order' => $item['sort_order']]);
                $category = $record->facility_category;
            }
        }

        if ($category) {
            $this->resequenceCategory($category);
        }

        return response()->json([
            'success' => true,
            'message' => 'Urutan parameter checklist berhasil diperbarui.',
        ]);
    }

    /**
     * Menata ulang nomor urut agar sekuensial murni (1, 2, 3... N) tanpa celah dan tanpa duplikasi
     */
    private function resequenceCategory(string $facilityCategory): void
    {
        $items = FacilityChecklistTemplate::where('facility_category', $facilityCategory)
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        foreach ($items as $idx => $item) {
            $expectedOrder = $idx + 1;
            if ($item->sort_order !== $expectedOrder) {
                $item->update(['sort_order' => $expectedOrder]);
            }
        }
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
