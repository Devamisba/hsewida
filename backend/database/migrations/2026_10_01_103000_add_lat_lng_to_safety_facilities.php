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
            if (!Schema::hasColumn('safety_facilities', 'latitude')) {
                $table->decimal('latitude', 10, 6)->nullable()->after('area_zone');
            }
            if (!Schema::hasColumn('safety_facilities', 'longitude')) {
                $table->decimal('longitude', 10, 6)->nullable()->after('latitude');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('safety_facilities', function (Blueprint $table) {
            if (Schema::hasColumn('safety_facilities', 'longitude')) {
                $table->dropColumn('longitude');
            }
            if (Schema::hasColumn('safety_facilities', 'latitude')) {
                $table->dropColumn('latitude');
            }
        });
    }
};
