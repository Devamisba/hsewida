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
