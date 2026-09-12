<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InspectionCapa extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'finding_description',
        'finding_photo',
        'severity',
        'action_plan',
        'pic_name',
        'due_date',
        'capa_photo',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function inspection()
    {
        return $this->belongsTo(FacilityInspection::class, 'inspection_id');
    }
}
