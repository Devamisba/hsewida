<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WorkPermit extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'permit_number',
        'user_id',
        'vendor_id',
        'request_type',
        'parent_permit_id',
        'root_permit_id',
        'extension_phase',
        'job_title',
        'location_id',
        'start_date',
        'end_date',
        'daily_start_time',
        'daily_end_time',
        'pic_name',
        'pic_phone',
        'supervisor_name',
        'supervisor_phone',
        'hse_officer_name',
        'hse_officer_phone',
        'total_workers',
        'risk_level',
        'status',
        'reject_reason',
        'qr_code_token',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'total_workers' => 'integer',
        'extension_phase' => 'integer',
    ];

    protected $appends = [
        'cumulative_start_date',
        'has_active_child_extension',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function parentPermit()
    {
        return $this->belongsTo(WorkPermit::class, 'parent_permit_id');
    }

    public function rootPermit()
    {
        return $this->belongsTo(WorkPermit::class, 'root_permit_id');
    }

    public function childPermits()
    {
        return $this->hasMany(WorkPermit::class, 'parent_permit_id');
    }

    public function activeChildPermit()
    {
        return $this->hasOne(WorkPermit::class, 'parent_permit_id')->whereNotIn('status', ['Ditolak']);
    }

    public function getProjectChainAttribute()
    {
        $rootId = $this->root_permit_id ?: $this->id;
        return self::where('root_permit_id', $rootId)
            ->orWhere('id', $rootId)
            ->select('id', 'permit_number', 'request_type', 'extension_phase', 'start_date', 'end_date', 'status', 'created_at')
            ->orderBy('extension_phase', 'asc')
            ->orderBy('id', 'asc')
            ->get();
    }

    public function getCumulativeStartDateAttribute()
    {
        if ($this->root_permit_id && $this->root_permit_id !== $this->id) {
            $root = $this->relationLoaded('rootPermit') ? $this->rootPermit : WorkPermit::find($this->root_permit_id);
            if ($root && $root->start_date) {
                return $root->start_date->format('Y-m-d');
            }
        }
        return $this->start_date ? $this->start_date->format('Y-m-d') : null;
    }

    public function getHasActiveChildExtensionAttribute()
    {
        if ($this->relationLoaded('childPermits')) {
            return $this->childPermits->contains(fn($c) => $c->status !== 'Ditolak');
        }
        return $this->childPermits()->whereNotIn('status', ['Ditolak'])->exists();
    }

    public function permitTypes()
    {
        return $this->belongsToMany(PermitTypeOption::class, 'permit_types_pivot')
                    ->withPivot('custom_type');
    }

    public function ppes()
    {
        return $this->belongsToMany(PpeOption::class, 'permit_ppes_pivot');
    }

    public function equipments()
    {
        return $this->hasMany(PermitEquipment::class);
    }

    public function workers()
    {
        return $this->hasMany(PermitWorker::class);
    }

    public function jsas()
    {
        return $this->hasMany(PermitJsa::class)->orderBy('step_sequence');
    }

    public function approvals()
    {
        return $this->hasMany(PermitApproval::class)->orderBy('action_date');
    }
}
