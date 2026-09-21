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
        // 1. Update safety_facilities table
        Schema::table('safety_facilities', function (Blueprint $table) {
            if (!Schema::hasColumn('safety_facilities', 'nama_item')) {
                $table->string('nama_item', 150)->nullable()->after('code');
            }
            if (!Schema::hasColumn('safety_facilities', 'tipe_item')) {
                $table->enum('tipe_item', ['CONSUMABLE', 'KONDISI'])->default('CONSUMABLE')->after('category');
            }
            if (!Schema::hasColumn('safety_facilities', 'qr_code_id')) {
                $table->string('qr_code_id', 100)->nullable()->unique()->after('tipe_item');
            }
            if (!Schema::hasColumn('safety_facilities', 'tanggal_daftar')) {
                $table->date('tanggal_daftar')->nullable()->after('qr_code_id');
            }
            if (!Schema::hasColumn('safety_facilities', 'status_aktif')) {
                $table->boolean('status_aktif')->default(true)->after('status');
            }
        });

        // 2. Create facility_consumable_cycles table (for CONSUMABLE)
        if (!Schema::hasTable('facility_consumable_cycles')) {
            Schema::create('facility_consumable_cycles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('facility_id')->constrained('safety_facilities')->cascadeOnDelete();
                $table->date('expired_at');
                $table->integer('threshold_warning_hari')->default(30);
                $table->date('last_refilled_at')->nullable();
                $table->timestamps();
            });
        }

        // 3. Create facility_refill_histories table (Log Refill / Ganti Baru)
        if (!Schema::hasTable('facility_refill_histories')) {
            Schema::create('facility_refill_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('facility_id')->constrained('safety_facilities')->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->date('refill_date');
                $table->date('old_expired_at')->nullable();
                $table->date('new_expired_at');
                $table->string('vendor_name', 150)->nullable();
                $table->string('seal_number', 100)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // 4. Create facility_condition_schedules table (for KONDISI)
        if (!Schema::hasTable('facility_condition_schedules')) {
            Schema::create('facility_condition_schedules', function (Blueprint $table) {
                $table->id();
                $table->foreignId('facility_id')->constrained('safety_facilities')->cascadeOnDelete();
                $table->integer('interval_pemeriksaan_hari')->default(30);
                $table->date('terakhir_diperiksa')->nullable();
                $table->enum('status_kondisi_terakhir', ['BAIK', 'PERLU_PERHATIAN', 'RUSAK', 'JADWAL_TERLEWAT'])->default('BAIK');
                $table->timestamps();
            });
        }

        // 5. Update facility_inspections table
        Schema::table('facility_inspections', function (Blueprint $table) {
            if (!Schema::hasColumn('facility_inspections', 'tipe_checklist')) {
                $table->enum('tipe_checklist', ['CONSUMABLE_CHECK', 'KONDISI_CHECK'])->default('CONSUMABLE_CHECK')->after('inspector_id');
            }
            if (!Schema::hasColumn('facility_inspections', 'foto_bukti')) {
                $table->json('foto_bukti')->nullable()->after('notes');
            }
        });

        // 6. Create facility_alerts table
        if (!Schema::hasTable('facility_alerts')) {
            Schema::create('facility_alerts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('facility_id')->constrained('safety_facilities')->cascadeOnDelete();
                $table->enum('jenis_alert', ['H-30', 'KADALUARSA', 'PERLU_PERHATIAN', 'RUSAK', 'JADWAL_TERLEWAT']);
                $table->text('message');
                $table->boolean('is_read')->default(false);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facility_alerts');
        Schema::dropIfExists('facility_condition_schedules');
        Schema::dropIfExists('facility_refill_histories');
        Schema::dropIfExists('facility_consumable_cycles');

        Schema::table('facility_inspections', function (Blueprint $table) {
            if (Schema::hasColumn('facility_inspections', 'foto_bukti')) {
                $table->dropColumn('foto_bukti');
            }
            if (Schema::hasColumn('facility_inspections', 'tipe_checklist')) {
                $table->dropColumn('tipe_checklist');
            }
        });

        Schema::table('safety_facilities', function (Blueprint $table) {
            if (Schema::hasColumn('safety_facilities', 'status_aktif')) {
                $table->dropColumn('status_aktif');
            }
            if (Schema::hasColumn('safety_facilities', 'tanggal_daftar')) {
                $table->dropColumn('tanggal_daftar');
            }
            if (Schema::hasColumn('safety_facilities', 'qr_code_id')) {
                $table->dropColumn('qr_code_id');
            }
            if (Schema::hasColumn('safety_facilities', 'tipe_item')) {
                $table->dropColumn('tipe_item');
            }
            if (Schema::hasColumn('safety_facilities', 'nama_item')) {
                $table->dropColumn('nama_item');
            }
        });
    }
};
