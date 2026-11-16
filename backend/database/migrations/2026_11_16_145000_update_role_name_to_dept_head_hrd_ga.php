<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Update roles table
        DB::table('roles')
            ->where('code', 'ga_dept_head')
            ->update([
                'name' => 'HRD&GA Dept Head',
                'description' => 'Melakukan review administratif tahap 3 (validasi data pekerja eksternal, asuransi/BPJS, akses area).'
            ]);

        DB::table('roles')
            ->where('code', 'ga_div_head')
            ->update([
                'name' => 'HRD&GA Division Head',
                'description' => 'Melakukan validasi akhir tahap 4 (Final Sign-off) yang mengaktifkan status ijin kerja resmi.'
            ]);

        // 2. Update permissions table
        DB::table('permissions')
            ->where('code', 'permits.review_ga_dept')
            ->update([
                'name' => 'Review Permit Tahap 3 (HRD&GA Dept Head)'
            ]);

        DB::table('permissions')
            ->where('code', 'permits.review_ga_div')
            ->update([
                'name' => 'Review Permit Tahap 4 (HRD&GA Division Head)'
            ]);

        // 3. Expand ENUM column status in work_permits to include Menunggu Dept Head HRD&GA
        try {
            DB::statement("ALTER TABLE `work_permits` MODIFY COLUMN `status` ENUM(
                'Draft',
                'Menunggu PIC Vendor',
                'Menunggu PIC Widatra',
                'Menunggu HSE',
                'Menunggu GA Dept Head',
                'Menunggu GA Div Head',
                'Menunggu Dept Head HRD&GA',
                'Menunggu Head Dept HRD&GA',
                'Menunggu Head Division HRD&GA',
                'Disetujui',
                'Ditolak',
                'Selesai'
            ) NOT NULL DEFAULT 'Draft'");

            DB::table('work_permits')
                ->where('status', 'Menunggu Head Dept HRD&GA')
                ->update(['status' => 'Menunggu Dept Head HRD&GA']);
        } catch (\Exception $e) {
            // Log or ignore if table does not use ENUM
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('roles')
            ->where('code', 'ga_dept_head')
            ->update([
                'name' => 'Head Dept HRD&GA'
            ]);

        DB::table('roles')
            ->where('code', 'ga_div_head')
            ->update([
                'name' => 'Head Division HRD&GA'
            ]);

        DB::table('permissions')
            ->where('code', 'permits.review_ga_dept')
            ->update([
                'name' => 'Review Permit Tahap 3 (Head Dept HRD&GA)'
            ]);

        DB::table('permissions')
            ->where('code', 'permits.review_ga_div')
            ->update([
                'name' => 'Review Permit Tahap 4 (Head Division HRD&GA)'
            ]);
    }
};
