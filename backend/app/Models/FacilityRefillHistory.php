<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FacilityRefillHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'facility_id',
        'user_id',
        'refill_date',
        'old_expired_at',
        'new_expired_at',
        'vendor_name',
        'seal_number',
        'notes',
    ];

    protected $casts = [
        'refill_date' => 'date',
        'old_expired_at' => 'date',
        'new_expired_at' => 'date',
    ];

    public function facility()
    {
        return $this->belongsTo(SafetyFacility::class, 'facility_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
