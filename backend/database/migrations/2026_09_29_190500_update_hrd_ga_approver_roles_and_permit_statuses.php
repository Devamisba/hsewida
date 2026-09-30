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
        // 1. Expand ENUM column status in work_permits to include new approver statuses
        DB::statement("ALTER TABLE `work_permits` MODIFY COLUMN `status` ENUM(
            'Draft',
            'Menunggu PIC Vendor',
            'Menunggu HSE',
            'Menunggu GA Dept Head',
            'Menunggu GA Div Head',
            'Menunggu Head Dept HRD&GA',
            'Menunggu Head Division HRD&GA',
            'Disetujui',
            'Ditolak',
            'Selesai'
        ) NOT NULL DEFAULT 'Draft'");

        // 2. Migrate existing work permits to new statuses
        DB::table('work_permits')
            ->where('status', 'Menunggu GA Dept Head')
            ->update(['status' => 'Menunggu Head Dept HRD&GA']);

        DB::table('work_permits')
            ->where('status', 'Menunggu GA Div Head')
            ->update(['status' => 'Menunggu Head Division HRD&GA']);

        // 3. Update roles table names
        DB::table('roles')
            ->where('code', 'ga_dept_head')
            ->update([
                'name' => 'Head Dept HRD&GA',
                'description' => 'Melakukan review administratif tahap 3 (validasi data pekerja eksternal, asuransi/BPJS, akses area).'
            ]);

        DB::table('roles')
            ->where('code', 'ga_div_head')
            ->update([
                'name' => 'Head Division HRD&GA',
                'description' => 'Melakukan validasi akhir tahap 4 (Final Sign-off) yang mengaktifkan status ijin kerja resmi.'
            ]);

        // 4. Update permissions table names
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('work_permits')
            ->where('status', 'Menunggu Head Dept HRD&GA')
            ->update(['status' => 'Menunggu GA Dept Head']);

        DB::table('work_permits')
            ->where('status', 'Menunggu Head Division HRD&GA')
            ->update(['status' => 'Menunggu GA Div Head']);

        DB::table('roles')
            ->where('code', 'ga_dept_head')
            ->update([
                'name' => 'HRD & GA Dept Head',
                'description' => 'Melakukan review administratif tahap 3 (validasi data pekerja eksternal, asuransi/BPJS, akses area).'
            ]);

        DB::table('roles')
            ->where('code', 'ga_div_head')
            ->update([
                'name' => 'HRD & GA Div Head',
                'description' => 'Melakukan validasi akhir tahap 4 (Final Sign-off) yang mengaktifkan status ijin kerja resmi.'
            ]);

        DB::table('permissions')
            ->where('code', 'permits.review_ga_dept')
            ->update([
                'name' => 'Review Permit Tahap 3 (HRD & GA Dept Head)'
            ]);

        DB::table('permissions')
            ->where('code', 'permits.review_ga_div')
            ->update([
                'name' => 'Review Permit Tahap 4 (HRD & GA Div Head)'
            ]);
    }
};
