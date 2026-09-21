<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FacilityAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'facility_id',
        'jenis_alert',
        'message',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function facility()
    {
        return $this->belongsTo(SafetyFacility::class, 'facility_id');
    }
}
