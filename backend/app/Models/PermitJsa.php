<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PermitJsa extends Model
{
    use HasFactory;

    protected $fillable = [
        'work_permit_id',
        'step_sequence',
        'work_step',
        'equipment_used',
        'hazard_potential',
        'mitigation_control',
        'emergency_response',
    ];

    public function workPermit()
    {
        return $this->belongsTo(WorkPermit::class);
    }
}
