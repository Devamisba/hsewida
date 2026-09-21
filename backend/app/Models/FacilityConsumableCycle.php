<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FacilityConsumableCycle extends Model
{
    use HasFactory;

    protected $fillable = [
        'facility_id',
        'expired_at',
        'threshold_warning_hari',
        'last_refilled_at',
    ];

    protected $casts = [
        'expired_at' => 'date:Y-m-d',
        'last_refilled_at' => 'date:Y-m-d',
        'threshold_warning_hari' => 'integer',
    ];

    public function facility()
    {
        return $this->belongsTo(SafetyFacility::class, 'facility_id');
    }
}
