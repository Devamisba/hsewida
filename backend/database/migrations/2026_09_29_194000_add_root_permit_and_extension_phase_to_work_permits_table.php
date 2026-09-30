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
        Schema::table('work_permits', function (Blueprint $table) {
            $table->foreignId('root_permit_id')->nullable()->after('parent_permit_id')->constrained('work_permits')->nullOnDelete();
            $table->unsignedInteger('extension_phase')->default(0)->after('root_permit_id');
            $table->index('extension_phase');
        });

        // Backfill existing permits
        // 1. Root / initial permits (parent_permit_id IS NULL)
        DB::statement("UPDATE work_permits SET root_permit_id = id, extension_phase = 0 WHERE parent_permit_id IS NULL");

        // 2. Existing single-tier extended permits (parent_permit_id IS NOT NULL)
        DB::statement("UPDATE work_permits SET root_permit_id = parent_permit_id, extension_phase = 1 WHERE parent_permit_id IS NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('work_permits', function (Blueprint $table) {
            $table->dropForeign(['root_permit_id']);
            $table->dropColumn(['root_permit_id', 'extension_phase']);
        });
    }
};
