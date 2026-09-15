<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'nik',
        'name',
        'email',
        'password',
        'role_id',
        'company_name',
        'department',
        'phone_number',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function workPermits()
    {
        return $this->hasMany(WorkPermit::class);
    }

    public function hasPermission(string $permissionCode): bool
    {
        if (!$this->role) {
            return false;
        }

        if ($this->role->code === 'admin') {
            return true;
        }

        return $this->role->permissions->contains('code', $permissionCode);
    }

    public function hasRole(string|array $roles): bool
    {
        if (!$this->role) {
            return false;
        }

        if (is_array($roles)) {
            return in_array($this->role->code, $roles);
        }

        return $this->role->code === $roles;
    }
}
