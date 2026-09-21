<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PermitTypeOption extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'risk_level',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function defaultPpes()
    {
        return $this->belongsToMany(PpeOption::class, 'permit_type_default_ppes', 'permit_type_option_id', 'ppe_option_id');
    }
}
