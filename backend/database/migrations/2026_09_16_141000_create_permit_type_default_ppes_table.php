<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('permit_type_default_ppes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permit_type_option_id')->constrained('permit_type_options')->cascadeOnDelete();
            $table->foreignId('ppe_option_id')->constrained('ppe_options')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['permit_type_option_id', 'ppe_option_id'], 'pt_default_ppes_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permit_type_default_ppes');
    }
};
