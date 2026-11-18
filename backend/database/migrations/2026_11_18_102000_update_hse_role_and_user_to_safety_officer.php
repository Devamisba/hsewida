<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Update roles table for role 'hse'
        DB::table('roles')
            ->where('code', 'hse')
            ->update([
                'name' => 'Safety Officer',
                'description' => 'Melakukan review keselamatan tahap 2, validasi JSA, mitigasi risiko, inspeksi fasilitas K3, dan CAPA.'
            ]);

        // 2. Update users table for user K3 / HSE
        DB::table('users')
            ->whereIn('name', ['Tim K3 / HSE', 'Tim K3', 'Tim K3 / HSE Lapangan'])
            ->orWhere('email', 'hse@widatra.com')
            ->orWhere('nik', 'K301')
            ->update([
                'name' => 'Ahli K3 Umum'
            ]);

        // 3. Update permissions table if applicable
        DB::table('permissions')
            ->where('code', 'permits.review_hse')
            ->update([
                'name' => 'Review Permit Tahap 2 (Safety Officer)'
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('roles')
            ->where('code', 'hse')
            ->update([
                'name' => 'Tim K3 / HSE Officer'
            ]);

        DB::table('users')
            ->where('email', 'hse@widatra.com')
            ->orWhere('nik', 'K301')
            ->update([
                'name' => 'Tim K3 / HSE'
            ]);

        DB::table('permissions')
            ->where('code', 'permits.review_hse')
            ->update([
                'name' => 'Review Permit Tahap 2 (HSE)'
            ]);
    }
};
