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
        // Update master geofence settings to the real PT Widatra Bhakti plant location in Pandaan, Pasuruan
        DB::table('system_settings')
            ->where('key', 'geofence_plant_lat')
            ->update(['value' => '-7.644263', 'updated_at' => now()]);

        DB::table('system_settings')
            ->where('key', 'geofence_plant_lng')
            ->update(['value' => '112.694194', 'updated_at' => now()]);

        DB::table('system_settings')
            ->where('key', 'geofence_plant_radius_meters')
            ->update(['value' => '500', 'updated_at' => now()]);

        DB::table('system_settings')
            ->where('key', 'geofence_plant_name')
            ->update(['value' => 'PT Widatra Bhakti — Kawasan Pabrik (Pandaan)', 'updated_at' => now()]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('system_settings')
            ->where('key', 'geofence_plant_lat')
            ->update(['value' => '-7.604500', 'updated_at' => now()]);

        DB::table('system_settings')
            ->where('key', 'geofence_plant_lng')
            ->update(['value' => '112.729200', 'updated_at' => now()]);

        DB::table('system_settings')
            ->where('key', 'geofence_plant_radius_meters')
            ->update(['value' => '250', 'updated_at' => now()]);
    }
};
