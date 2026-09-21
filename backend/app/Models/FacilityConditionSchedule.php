<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FacilityConditionSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'facility_id',
        'interval_pemeriksaan_hari',
        'terakhir_diperiksa',
        'status_kondisi_terakhir',
    ];

    protected $casts = [
        'interval_pemeriksaan_hari' => 'integer',
        'terakhir_diperiksa' => 'date:Y-m-d',
    ];

    public function facility()
    {
        return $this->belongsTo(SafetyFacility::class, 'facility_id');
    }
}
