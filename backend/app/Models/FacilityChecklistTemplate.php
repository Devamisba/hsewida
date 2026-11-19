<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FacilityChecklistTemplate extends Model
{
    use HasFactory;

    protected $table = 'facility_checklist_templates';

    protected $fillable = [
        'facility_category',
        'param_code',
        'badge_code',
        'title',
        'description',
        'pass_label',
        'fail_label',
        'is_critical',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_critical' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Scope untuk kategori tertentu yang aktif dan terurut
     */
    public function scopeActiveCategory($query, string $category)
    {
        return $query->where('facility_category', strtolower(trim($category)))
                     ->where('is_active', true)
                     ->orderBy('sort_order', 'asc');
    }
}
