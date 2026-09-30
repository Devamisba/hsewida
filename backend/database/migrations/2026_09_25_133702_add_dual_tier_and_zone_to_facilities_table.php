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
        Schema::table('safety_facilities', function (Blueprint $table) {
            if (!Schema::hasColumn('safety_facilities', 'area_zone')) {
                $table->string('area_zone')->nullable()->after('location_id');
            }
        });

        Schema::table('facility_inspections', function (Blueprint $table) {
            if (!Schema::hasColumn('facility_inspections', 'inspector_name')) {
                $table->string('inspector_name')->nullable()->after('inspector_id');
            }
            if (!Schema::hasColumn('facility_inspections', 'pic_name')) {
                $table->string('pic_name')->nullable()->after('inspector_name');
            }
            if (!Schema::hasColumn('facility_inspections', 'inspection_stage')) {
                $table->string('inspection_stage')->default('PETUGAS')->after('result_status');
            }
            if (!Schema::hasColumn('facility_inspections', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('inspection_stage');
            }
            if (!Schema::hasColumn('facility_inspections', 'verification_notes')) {
                $table->text('verification_notes')->nullable()->after('verified_at');
            }
            if (!Schema::hasColumn('facility_inspections', 'verification_status')) {
                $table->string('verification_status')->nullable()->after('verification_notes');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('safety_facilities', function (Blueprint $table) {
            if (Schema::hasColumn('safety_facilities', 'area_zone')) {
                $table->dropColumn('area_zone');
            }
        });

        Schema::table('facility_inspections', function (Blueprint $table) {
            $table->dropColumn([
                'inspector_name',
                'pic_name',
                'inspection_stage',
                'verified_at',
                'verification_notes',
                'verification_status',
            ]);
        });
    }
};
