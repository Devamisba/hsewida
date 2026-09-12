<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PermitDocument extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'permit_worker_id',
        'document_type',
        'file_path',
        'is_verified',
        'uploaded_at',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'uploaded_at' => 'datetime',
    ];

    public function worker()
    {
        return $this->belongsTo(PermitWorker::class, 'permit_worker_id');
    }
}
