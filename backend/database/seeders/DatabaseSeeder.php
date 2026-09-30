<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleAndPermissionSeeder::class,
            MasterDataSeeder::class,
            UserSeeder::class,
            VendorSeeder::class,
            SafetyFacilitySeeder::class,
            RealAparWidatraSeeder::class,
            WorkPermitSeeder::class,
        ]);
    }
}
