<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class SafetyFacility extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'nama_item',
        'category',
        'tipe_item',
        'qr_code_id',
        'tanggal_daftar',
        'location_id',
        'area_zone',
        'specifications',
        'status',
        'status_aktif',
        'last_inspected_at',
    ];

    protected $casts = [
        'specifications' => 'array',
        'last_inspected_at' => 'date:Y-m-d',
        'tanggal_daftar' => 'date:Y-m-d',
        'status_aktif' => 'boolean',
    ];

    protected $appends = [
        'calculated_status',
        'days_until_expired',
        'is_overdue',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function inspections()
    {
        return $this->hasMany(FacilityInspection::class, 'facility_id')->latest();
    }

    public function latestInspection()
    {
        return $this->hasOne(FacilityInspection::class, 'facility_id')->latestOfMany();
    }

    public function consumableCycle()
    {
        return $this->hasOne(FacilityConsumableCycle::class, 'facility_id');
    }

    public function conditionSchedule()
    {
        return $this->hasOne(FacilityConditionSchedule::class, 'facility_id');
    }

    public function refillHistories()
    {
        return $this->hasMany(FacilityRefillHistory::class, 'facility_id')->latest();
    }

    public function alerts()
    {
        return $this->hasMany(FacilityAlert::class, 'facility_id')->latest();
    }

    /**
     * Real-time calculation of status based on branching logic (Consumable vs Kondisi).
     */
    public function getCalculatedStatusAttribute(): string
    {
        if ($this->tipe_item === 'CONSUMABLE') {
            $cycle = $this->consumableCycle;
            if (!$cycle || !$cycle->expired_at) {
                return 'AMAN';
            }

            $today = Carbon::today();
            $expiredDate = Carbon::parse($cycle->expired_at)->startOfDay();

            if ($today->gt($expiredDate)) {
                return 'KADALUARSA';
            }

            $diffDays = $today->diffInDays($expiredDate, false);
            $threshold = $cycle->threshold_warning_hari ?: 30;

            if ($diffDays <= $threshold) {
                return 'MENDEKATI_KADALUARSA';
            }

            return 'AMAN';
        } else {
            // KONDISI
            $schedule = $this->conditionSchedule;
            if (!$schedule) {
                return 'BAIK';
            }

            if ($schedule->terakhir_diperiksa) {
                $lastInspected = Carbon::parse($schedule->terakhir_diperiksa)->startOfDay();
                $interval = $schedule->interval_pemeriksaan_hari ?: 30;
                $daysSince = Carbon::today()->diffInDays($lastInspected);

                if ($daysSince > $interval) {
                    return 'JADWAL_TERLEWAT';
                }
            } else {
                return 'JADWAL_TERLEWAT';
            }

            return $schedule->status_kondisi_terakhir ?: 'BAIK';
        }
    }

    /**
     * Days remaining until expired (for Consumable).
     */
    public function getDaysUntilExpiredAttribute(): ?int
    {
        if ($this->tipe_item === 'CONSUMABLE' && $this->consumableCycle && $this->consumableCycle->expired_at) {
            $today = Carbon::today();
            $expired = Carbon::parse($this->consumableCycle->expired_at)->startOfDay();
            if ($today->gt($expired)) {
                return -1 * abs((int)$today->diffInDays($expired));
            }
            return abs((int)$today->diffInDays($expired));
        }
        return null;
    }

    /**
     * Check if condition inspection is overdue (for Kondisi).
     */
    public function getIsOverdueAttribute(): bool
    {
        if ($this->tipe_item === 'KONDISI' && $this->conditionSchedule) {
            if (!$this->conditionSchedule->terakhir_diperiksa) {
                return true;
            }
            $last = Carbon::parse($this->conditionSchedule->terakhir_diperiksa)->startOfDay();
            $interval = $this->conditionSchedule->interval_pemeriksaan_hari ?: 30;
            return Carbon::today()->diffInDays($last) > $interval;
        }
        return false;
    }
}
