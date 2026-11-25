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
        // 1. PINTU DARURAT (EMERGENCY DOOR)
        $doorUpdates = [
            1 => ['param_code' => 'door_panic_bar', 'badge_code' => 'Panic'],
            2 => ['param_code' => 'door_lock_free', 'badge_code' => 'Kunci'],
            3 => ['param_code' => 'door_exit_sign', 'badge_code' => 'Exit'],
            4 => ['param_code' => 'door_corridor', 'badge_code' => 'Akses'],
            5 => ['param_code' => 'door_closer', 'badge_code' => 'Pintu'],
        ];
        foreach ($doorUpdates as $order => $data) {
            DB::table('facility_checklist_templates')
                ->where('facility_category', 'emergency_door')
                ->where('sort_order', $order)
                ->update($data);
        }

        // 2. HYDRANT
        $hydrantUpdates = [
            1 => ['param_code' => 'hydrant_box', 'badge_code' => 'Box'],
            2 => ['param_code' => 'hydrant_hose', 'badge_code' => 'Slg'],
            3 => ['param_code' => 'hydrant_nozzle', 'badge_code' => 'Nozz'],
            4 => ['param_code' => 'hydrant_valve', 'badge_code' => 'Kran'],
            5 => ['param_code' => 'hydrant_pressure', 'badge_code' => 'Tek'],
        ];
        foreach ($hydrantUpdates as $order => $data) {
            DB::table('facility_checklist_templates')
                ->where('facility_category', 'hydrant')
                ->where('sort_order', $order)
                ->update($data);
        }

        // 3. TITIK KUMPUL (ASSEMBLY POINT)
        $assemblyUpdates = [
            1 => ['param_code' => 'assembly_sign', 'badge_code' => 'Rambu'],
            2 => ['param_code' => 'assembly_access', 'badge_code' => 'Akses'],
            3 => ['param_code' => 'assembly_area', 'badge_code' => 'Area'],
            4 => ['param_code' => 'assembly_light', 'badge_code' => 'Lampu'],
            5 => ['param_code' => 'assembly_marking', 'badge_code' => 'Marka'],
        ];
        foreach ($assemblyUpdates as $order => $data) {
            DB::table('facility_checklist_templates')
                ->where('facility_category', 'assembly_point')
                ->where('sort_order', $order)
                ->update($data);
        }

        // 4. SAFETY MIRROR
        $mirrorUpdates = [
            1 => ['param_code' => 'mirror_glass', 'badge_code' => 'Cermin'],
            2 => ['param_code' => 'mirror_angle', 'badge_code' => 'Sudut'],
            3 => ['param_code' => 'mirror_bracket', 'badge_code' => 'Tiang'],
            4 => ['param_code' => 'mirror_frame', 'badge_code' => 'Fisik'],
            5 => ['param_code' => 'mirror_clearance', 'badge_code' => 'Bebas'],
        ];
        foreach ($mirrorUpdates as $order => $data) {
            DB::table('facility_checklist_templates')
                ->where('facility_category', 'safety_mirror')
                ->where('sort_order', $order)
                ->update($data);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $categories = ['emergency_door', 'hydrant', 'assembly_point', 'safety_mirror'];
        $legacyCodes = [1 => 'tbg', 2 => 'slg', 3 => 'nozz', 4 => 'sgl', 5 => 'lev'];

        foreach ($categories as $cat) {
            foreach ($legacyCodes as $order => $code) {
                DB::table('facility_checklist_templates')
                    ->where('facility_category', $cat)
                    ->where('sort_order', $order)
                    ->update(['param_code' => $code]);
            }
        }
    }
};
