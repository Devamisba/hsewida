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
        // 1. Expand ENUM column status in work_permits to include 'Menunggu PIC Widatra'
        DB::statement("ALTER TABLE `work_permits` MODIFY COLUMN `status` ENUM(
            'Draft',
            'Menunggu PIC Vendor',
            'Menunggu PIC Widatra',
            'Menunggu HSE',
            'Menunggu GA Dept Head',
            'Menunggu GA Div Head',
            'Menunggu Head Dept HRD&GA',
            'Menunggu Head Division HRD&GA',
            'Disetujui',
            'Ditolak',
            'Selesai'
        ) NOT NULL DEFAULT 'Draft'");

        // 2. Migrate existing work permits from 'Menunggu PIC Vendor' to 'Menunggu PIC Widatra'
        DB::table('work_permits')
            ->where('status', 'Menunggu PIC Vendor')
            ->update(['status' => 'Menunggu PIC Widatra']);

        // 3. Update roles table name
        DB::table('roles')
            ->where('code', 'pic_vendor')
            ->update([
                'name' => 'PIC Widatra (Internal)',
                'description' => 'Penanggung jawab internal PT Widatra Bhakti atas vendor. Melakukan review tahap 1.'
            ]);

        // 4. Update permissions table name
        DB::table('permissions')
            ->where('code', 'permits.review_pic')
            ->update([
                'name' => 'Review Permit Tahap 1 (PIC Widatra)'
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('work_permits')
            ->where('status', 'Menunggu PIC Widatra')
            ->update(['status' => 'Menunggu PIC Vendor']);

        DB::table('roles')
            ->where('code', 'pic_vendor')
            ->update([
                'name' => 'PIC Vendor (Internal)',
                'description' => 'Penanggung jawab internal PT Widatra Bhakti atas vendor. Melakukan review tahap 1.'
            ]);

        DB::table('permissions')
            ->where('code', 'permits.review_pic')
            ->update([
                'name' => 'Review Permit Tahap 1 (PIC Vendor)'
            ]);
    }
};
