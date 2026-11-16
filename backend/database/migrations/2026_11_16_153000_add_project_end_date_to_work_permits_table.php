<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('work_permits', 'project_end_date')) {
            Schema::table('work_permits', function (Blueprint $table) {
                $table->date('project_end_date')->nullable()->after('end_date');
            });
        }

        // Backfill existing permits: if project_end_date is null, set it to end_date
        DB::table('work_permits')
            ->whereNull('project_end_date')
            ->update([
                'project_end_date' => DB::raw('`end_date`')
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('work_permits', 'project_end_date')) {
            Schema::table('work_permits', function (Blueprint $table) {
                $table->dropColumn('project_end_date');
            });
        }
    }
};
