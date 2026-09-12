<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SafetyFacility extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'category',
        'location_id',
        'specifications',
        'status',
        'last_inspected_at',
    ];

    protected $casts = [
        'specifications' => 'array',
        'last_inspected_at' => 'date',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function inspections()
    {
        return $this->hasMany(FacilityInspection::class, 'facility_id');
    }
}
