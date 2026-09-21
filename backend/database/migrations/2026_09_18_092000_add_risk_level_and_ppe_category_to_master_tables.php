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
        // 1. Add risk_level to permit_type_options
        if (!Schema::hasColumn('permit_type_options', 'risk_level')) {
            Schema::table('permit_type_options', function (Blueprint $table) {
                $table->enum('risk_level', ['High Risk', 'General Risk'])
                    ->default('General Risk')
                    ->after('name');
            });
        }

        // Populate initial risk_level for existing canonical permit types
        $highRiskNames = [
            'Hot Work',
            'Work at Height',
            'Confined Space',
            'High Voltage Electricity',
            'Heavy Lifting',
            'Ijin Kerja Panas',
            'Ijin Kerja Ketinggian',
            'Ijin Kerja Ruang Terbatas'
        ];

        DB::table('permit_type_options')
            ->whereIn('name', $highRiskNames)
            ->update(['risk_level' => 'High Risk']);

        DB::table('permit_type_options')
            ->whereNotIn('name', $highRiskNames)
            ->update(['risk_level' => 'General Risk']);

        // 2. Add category & description to ppe_options
        if (!Schema::hasColumn('ppe_options', 'category')) {
            Schema::table('ppe_options', function (Blueprint $table) {
                $table->string('category', 100)
                    ->nullable()
                    ->after('name');
                $table->string('description', 255)
                    ->nullable()
                    ->after('category');
            });
        }

        // Categorize existing PPE options
        $categories = [
            'Head & Face' => ['Safety Helmet', 'Helm Keselamatan', 'Face Shield', 'Safety Glasses', 'Ear Plug/Muff'],
            'Foot & Hand' => ['Safety Shoes', 'Sepatu Safety', 'Gloves'],
            'Fall Protection' => ['Full Body Harness', 'Body Harness', 'Lifeline', 'Safety Net', 'Safety Line'],
            'Respiratory' => ['Breathing Apparatus', 'Respiratory Protection'],
            'Fire & Safety' => ['Fire Extinguisher'],
            'Site & Area Safety' => ['Barricade', 'Sign', 'Scaffolding', 'Stairs'],
        ];

        foreach ($categories as $cat => $items) {
            DB::table('ppe_options')
                ->whereIn('name', $items)
                ->update(['category' => $cat]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('permit_type_options', 'risk_level')) {
            Schema::table('permit_type_options', function (Blueprint $table) {
                $table->dropColumn('risk_level');
            });
        }

        if (Schema::hasColumn('ppe_options', 'category')) {
            Schema::table('ppe_options', function (Blueprint $table) {
                $table->dropColumn(['category', 'description']);
            });
        }
    }
};
