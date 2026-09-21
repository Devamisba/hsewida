<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FacilityInspection extends Model
{
    use HasFactory;

    protected $fillable = [
        'facility_id',
        'inspector_id',
        'inspection_date',
        'tipe_checklist',
        'checklist_results',
        'result_status',
        'notes',
        'foto_bukti',
    ];

    protected $casts = [
        'inspection_date' => 'date',
        'checklist_results' => 'array',
        'foto_bukti' => 'array',
    ];

    public function facility()
    {
        return $this->belongsTo(SafetyFacility::class, 'facility_id');
    }

    public function inspector()
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    public function capas()
    {
        return $this->hasMany(InspectionCapa::class, 'inspection_id');
    }
}
