<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vendor extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_name',
        'address',
        'main_contact_name',
        'main_contact_phone',
        'pic_vendor_user_id',
        'status',
    ];

    public function picVendorUser()
    {
        return $this->belongsTo(User::class, 'pic_vendor_user_id');
    }

    public function workPermits()
    {
        return $this->hasMany(WorkPermit::class);
    }
}
