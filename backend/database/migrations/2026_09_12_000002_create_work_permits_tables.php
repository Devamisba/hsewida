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
        // 1. Work Permits Main Table
        Schema::create('work_permits', function (Blueprint $table) {
            $table->id();
            $table->string('permit_number', 50)->unique(); // WP-YYMM-XXX
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->enum('request_type', ['Baru', 'Perpanjangan'])->default('Baru');
            $table->foreignId('parent_permit_id')->nullable()->constrained('work_permits')->nullOnDelete();
            $table->string('job_title', 255);
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->time('daily_start_time');
            $table->time('daily_end_time');
            
            // Person in charge
            $table->string('pic_name', 255);
            $table->string('pic_phone', 50);
            $table->string('supervisor_name', 255);
            $table->string('supervisor_phone', 50);
            $table->string('hse_officer_name', 255);
            $table->string('hse_officer_phone', 50);
            
            $table->integer('total_workers')->default(1);
            $table->enum('risk_level', ['Rendah', 'Sedang', 'Tinggi'])->default('Rendah');
            $table->enum('status', [
                'Draft', 
                'Menunggu PIC Vendor', 
                'Menunggu HSE', 
                'Menunggu GA Dept Head', 
                'Menunggu GA Div Head', 
                'Disetujui', 
                'Ditolak', 
                'Selesai'
            ])->default('Draft');
            
            $table->text('reject_reason')->nullable();
            $table->string('qr_code_token', 100)->nullable()->unique();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Permit Types Pivot
        Schema::create('permit_types_pivot', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_permit_id')->constrained('work_permits')->cascadeOnDelete();
            $table->foreignId('permit_type_option_id')->constrained('permit_type_options')->cascadeOnDelete();
            $table->string('custom_type', 255)->nullable(); // Keterangan jika "Others"
        });

        // 3. Permit PPE Pivot
        Schema::create('permit_ppes_pivot', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_permit_id')->constrained('work_permits')->cascadeOnDelete();
            $table->foreignId('ppe_option_id')->constrained('ppe_options')->cascadeOnDelete();
        });

        // 4. Permit Equipments
        Schema::create('permit_equipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_permit_id')->constrained('work_permits')->cascadeOnDelete();
            $table->string('equipment_name', 255);
        });

        // 5. Permit Workers
        Schema::create('permit_workers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_permit_id')->constrained('work_permits')->cascadeOnDelete();
            $table->string('worker_name', 255);
            $table->string('position', 100);
            $table->text('address')->nullable();
            $table->string('id_card_photo', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 6. Permit Documents (BPJS/Asuransi per pekerja)
        Schema::create('permit_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permit_worker_id')->constrained('permit_workers')->cascadeOnDelete();
            $table->enum('document_type', ['BPJS_TK', 'BPJS_Kesehatan', 'Asuransi_Lain']);
            $table->string('file_path', 255);
            $table->boolean('is_verified')->default(false);
            $table->timestamp('uploaded_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 7. Permit JSA (Job Safety Analysis)
        Schema::create('permit_jsas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_permit_id')->constrained('work_permits')->cascadeOnDelete();
            $table->integer('step_sequence');
            $table->text('work_step');
            $table->string('equipment_used', 255)->nullable();
            $table->text('hazard_potential');
            $table->text('mitigation_control');
            $table->text('emergency_response');
            $table->timestamps();
        });

        // 8. Permit Approvals (Audit Trail)
        Schema::create('permit_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_permit_id')->constrained('work_permits')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('role_at_action', 50);
            $table->enum('action', ['Submit', 'Approve', 'Reject']);
            $table->text('note')->nullable();
            $table->timestamp('action_date')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permit_approvals');
        Schema::dropIfExists('permit_jsas');
        Schema::dropIfExists('permit_documents');
        Schema::dropIfExists('permit_workers');
        Schema::dropIfExists('permit_equipments');
        Schema::dropIfExists('permit_ppes_pivot');
        Schema::dropIfExists('permit_types_pivot');
        Schema::dropIfExists('work_permits');
    }
};
