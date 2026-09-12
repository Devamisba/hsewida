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
        // 1. Locations Table (Master Data Lokasi Pabrik)
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('description', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Permit Type Options (Master Data Kategori Ijin Kerja)
        Schema::create('permit_type_options', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. PPE Options (Master Data APD Wajib)
        Schema::create('ppe_options', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. Vendors Table (Master Data Vendor & PIC Internal)
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->string('company_name', 255);
            $table->text('address')->nullable();
            $table->string('main_contact_name', 255)->nullable();
            $table->string('main_contact_phone', 50)->nullable();
            $table->foreignId('pic_vendor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['Aktif', 'Nonaktif', 'Blacklist'])->default('Aktif');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendors');
        Schema::dropIfExists('ppe_options');
        Schema::dropIfExists('permit_type_options');
        Schema::dropIfExists('locations');
    }
};
