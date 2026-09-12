<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\WorkPermit;
use App\Models\SafetyFacility;
use App\Models\Location;
use Carbon\Carbon;

class HseWorkflowTest extends TestCase
{
    /**
     * Test 1: Authentication login returns token and user permissions.
     */
    public function test_login_returns_token_and_user_profile(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'vendor@hse.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'vendor@hse.com',
                        'role' => [
                            'code' => 'pemohon',
                        ],
                    ],
                ],
            ]);

        $this->assertNotEmpty($response->json('data.token'));
    }

    /**
     * Test 2: Master data endpoints return active data.
     */
    public function test_master_data_endpoints(): void
    {
        $user = User::where('email', 'vendor@hse.com')->first();

        // Locations
        $locResponse = $this->actingAs($user)->getJson('/api/v1/master/locations');
        $locResponse->assertStatus(200);
        $this->assertGreaterThan(0, count($locResponse->json('data')));

        // Permit Types
        $ptResponse = $this->actingAs($user)->getJson('/api/v1/master/permit-types');
        $ptResponse->assertStatus(200);
        $this->assertGreaterThan(0, count($ptResponse->json('data')));

        // Roles & Permissions
        $rolesResponse = $this->actingAs($user)->getJson('/api/v1/master/roles');
        $rolesResponse->assertStatus(200);
        $this->assertGreaterThan(0, count($rolesResponse->json('data')));
    }

    /**
     * Test 3: Submitting Work Permit with H-3 validation and auto-numbering.
     */
    public function test_submit_work_permit_and_approval_flow(): void
    {
        $vendorUser = User::where('email', 'vendor@hse.com')->first();
        $picUser = User::where('email', 'pic@hse.com')->first();
        $hseUser = User::where('email', 'hse@hse.com')->first();

        // 1. Submit Permit
        $permitPayload = [
            'requestType' => 'Baru',
            'namaKontraktor' => 'PT Maju Mundur',
            'jenisPekerjaan' => 'Uji Coba Otomasi Las Panel',
            'lokasi' => 'Area Pabrik 1',
            'mulaiKerja' => Carbon::today()->addDays(4)->toDateString(),
            'selesaiKerja' => Carbon::today()->addDays(6)->toDateString(),
            'jamKerjaMulai' => '08:00',
            'jamKerjaAkhir' => '17:00',
            'penanggungJawab' => 'Budi Santoso',
            'noHpPJ' => '081234567890',
            'pengawasPekerjaan' => 'Agus',
            'noHpPengawas' => '081298765432',
            'pengawasHse' => 'Dina',
            'noHpHse' => '087788990011',
            'permitTypes' => ['Hot Work', 'Work at Height'],
            'ppe' => ['Safety Helmet', 'Safety Shoes', 'Face Shield'],
            'workEquipment' => ['Mesin Las', 'Tangga'],
            'pekerja' => [
                ['nama' => 'Pekerja 1', 'jabatan' => 'Welder', 'alamat' => 'Surabaya'],
                ['nama' => 'Pekerja 2', 'jabatan' => 'Fitter', 'alamat' => 'Sidoarjo'],
            ],
            'jsa' => [
                [
                    'tahapan' => 'Persiapan',
                    'peralatan' => 'Kabel',
                    'potensi' => 'Korsleting',
                    'pengendalian' => 'Cek isolasi',
                    'tanggapDarurat' => 'APAR',
                ],
            ],
        ];

        $submitRes = $this->actingAs($vendorUser)->postJson('/api/v1/permits', $permitPayload);
        $submitRes->assertStatus(201);
        $permitId = $submitRes->json('data.id');
        $this->assertNotEmpty($submitRes->json('data.permit_number'));
        $this->assertEquals('Menunggu PIC Vendor', $submitRes->json('data.status'));

        // 2. PIC Vendor Approves
        $approvePicRes = $this->actingAs($picUser)->postJson("/api/v1/permits/{$permitId}/approve", [
            'note' => 'Disetujui oleh PIC Vendor untuk verifikasi HSE.',
        ]);
        $approvePicRes->assertStatus(200);
        $this->assertEquals('Menunggu HSE', $approvePicRes->json('data.status'));

        // 3. HSE Checks Review Queue
        $hseQueueRes = $this->actingAs($hseUser)->getJson('/api/v1/permits/review-queue');
        $hseQueueRes->assertStatus(200);
        $found = collect($hseQueueRes->json('data'))->firstWhere('id', $permitId);
        $this->assertNotNull($found);
    }

    /**
     * Test 4: Inspection of safety facilities.
     */
    public function test_safety_facility_inspection(): void
    {
        $hseUser = User::where('email', 'hse@hse.com')->first();
        $facility = SafetyFacility::first();

        $this->assertNotNull($facility);

        $inspectRes = $this->actingAs($hseUser)->postJson('/api/v1/monitoring/inspections', [
            'facility_id' => $facility->id,
            'checklist_results' => ['pressure' => 'OK', 'seal' => 'Intact', 'hose' => 'Good'],
            'result_status' => 'Pass',
            'notes' => 'Pemeriksaan rutin berkala',
        ]);

        $inspectRes->assertStatus(201);
        $this->assertEquals('Pass', $inspectRes->json('data.inspection.result_status'));
    }
}
