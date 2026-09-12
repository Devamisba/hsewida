<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PermitWorker extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'work_permit_id',
        'worker_name',
        'position',
        'address',
        'id_card_photo',
    ];

    public function workPermit()
    {
        return $this->belongsTo(WorkPermit::class);
    }

    public function documents()
    {
        return $this->hasMany(PermitDocument::class);
    }
}
