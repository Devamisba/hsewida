<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PermitEquipment extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'permit_equipments';

    protected $fillable = [
        'work_permit_id',
        'equipment_name',
    ];

    public function workPermit()
    {
        return $this->belongsTo(WorkPermit::class);
    }
}
