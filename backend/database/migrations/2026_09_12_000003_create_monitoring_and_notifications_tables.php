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
        // 1. Safety Facilities Table (Master Asset K3)
        Schema::create('safety_facilities', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique(); // AP-001, HY-01, dll.
            $table->enum('category', ['apar', 'hydrant', 'emergency_door', 'p3k', 'safety_mirror', 'assembly_point']);
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->json('specifications')->nullable(); // jenis APAR, kapasitas, isi kotak, dll.
            $table->enum('status', ['Good', 'Needs Attention', 'Critical'])->default('Good');
            $table->date('last_inspected_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Facility Inspections Table (Log Pemeriksaan)
        Schema::create('facility_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facility_id')->constrained('safety_facilities')->cascadeOnDelete();
            $table->foreignId('inspector_id')->constrained('users')->cascadeOnDelete();
            $table->date('inspection_date');
            $table->json('checklist_results');
            $table->enum('result_status', ['Pass', 'Fail']);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 3. Inspection CAPAs (Corrective and Preventive Actions)
        Schema::create('inspection_capas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('facility_inspections')->cascadeOnDelete();
            $table->text('finding_description');
            $table->string('finding_photo', 255)->nullable();
            $table->enum('severity', ['Minor', 'Mayor', 'Kritis'])->default('Minor');
            $table->text('action_plan');
            $table->string('pic_name', 255);
            $table->date('due_date');
            $table->string('capa_photo', 255)->nullable();
            $table->enum('status', ['Open', 'In Progress', 'Closed'])->default('Open');
            $table->timestamps();
        });

        // 4. Notifications Table (In-App Notifications)
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 100); // permit_approved, permit_rejected, capa_due, etc.
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('inspection_capas');
        Schema::dropIfExists('facility_inspections');
        Schema::dropIfExists('safety_facilities');
    }
};
