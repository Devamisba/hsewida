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
        if (Schema::hasTable('facility_checklist_templates')) {
            $templates = DB::table('facility_checklist_templates')->get();

            foreach ($templates as $template) {
                $cleanedTitle = trim(preg_replace('/^\d+[\.\s\-]+/', '', $template->title));

                if ($cleanedTitle !== $template->title && !empty($cleanedTitle)) {
                    DB::table('facility_checklist_templates')
                        ->where('id', $template->id)
                        ->update([
                            'title' => $cleanedTitle,
                            'updated_at' => now(),
                        ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reversal is not required as cleaned titles are standard
    }
};
