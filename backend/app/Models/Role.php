<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Role extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permissions');
    }

    public function getNameAttribute($value)
    {
        if ($this->code === 'ga_dept_head' || in_array($value, ['Head Dept HRD&GA', 'Dept Head HRD&GA', 'HRD & GA Dept Head'])) {
            return 'HRD&GA Dept Head';
        }
        if ($this->code === 'ga_div_head' || in_array($value, ['Head Division HRD&GA', 'Division Head HRD&GA', 'HRD & GA Division Head'])) {
            return 'HRD&GA Division Head';
        }
        if ($this->code === 'hse' || in_array($value, ['Tim K3 / HSE Officer', 'HSE Officer / Koordinator K3', 'HSE Officer', 'Tim K3'])) {
            return 'Safety Officer';
        }
        return $value;
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
