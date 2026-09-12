<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PermitApproval extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'work_permit_id',
        'user_id',
        'role_at_action',
        'action',
        'note',
        'action_date',
    ];

    protected $casts = [
        'action_date' => 'datetime',
    ];

    public function workPermit()
    {
        return $this->belongsTo(WorkPermit::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
