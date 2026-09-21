<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\MasterDataController;
use App\Http\Controllers\Api\WorkPermitController;
use App\Http\Controllers\Api\PermitDocumentController;
use App\Http\Controllers\Api\MonitoringController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;

Route::prefix('v1')->group(function () {

    // --- PUBLIC ROUTES ---
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::get('/permits/verify/{token}', [WorkPermitController::class, 'verifyQrToken']);
    Route::get('/master/settings', [MasterDataController::class, 'getSettings']);

    // --- PROTECTED ROUTES (SANCTUM) ---
    Route::middleware('auth:sanctum')->group(function () {

        // 1. Auth Profile
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

        // 2. User Management (CRUD Pengguna)
        Route::get('/master/users', [UserController::class, 'index']);
        Route::post('/master/users', [UserController::class, 'store']);
        Route::put('/master/users/{id}', [UserController::class, 'update']);
        Route::post('/master/users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::delete('/master/users/{id}', [UserController::class, 'destroy']);

        // 3. Master Data Hak Akses (Roles & Permissions)
        Route::get('/master/roles', [RolePermissionController::class, 'indexRoles']);
        Route::post('/master/roles', [RolePermissionController::class, 'storeRole']);
        Route::put('/master/roles/{id}', [RolePermissionController::class, 'updateRole']);
        Route::delete('/master/roles/{id}', [RolePermissionController::class, 'destroyRole']);
        Route::get('/master/permissions', [RolePermissionController::class, 'indexPermissions']);
        Route::put('/master/roles/{id}/permissions', [RolePermissionController::class, 'updateRolePermissions']);

        // 4. Master Data Operasional (Locations, Permit Types, PPE, Vendors, Workflow)
        Route::get('/master/locations', [MasterDataController::class, 'getLocations']);
        Route::post('/master/locations', [MasterDataController::class, 'storeLocation']);
        Route::put('/master/locations/{id}', [MasterDataController::class, 'updateLocation']);
        Route::delete('/master/locations/{id}', [MasterDataController::class, 'deleteLocation']);

        Route::get('/master/permit-types', [MasterDataController::class, 'getPermitTypes']);
        Route::post('/master/permit-types', [MasterDataController::class, 'storePermitType']);
        Route::put('/master/permit-types/{id}', [MasterDataController::class, 'updatePermitType']);
        Route::put('/master/permit-types/{id}/ppes', [MasterDataController::class, 'updatePermitTypePpes']);
        Route::delete('/master/permit-types/{id}', [MasterDataController::class, 'deletePermitType']);

        Route::get('/master/ppe-options', [MasterDataController::class, 'getPpeOptions']);
        Route::post('/master/ppe-options', [MasterDataController::class, 'storePpeOption']);
        Route::put('/master/ppe-options/{id}', [MasterDataController::class, 'updatePpeOption']);
        Route::delete('/master/ppe-options/{id}', [MasterDataController::class, 'deletePpeOption']);

        Route::get('/vendors', [MasterDataController::class, 'getVendors']);
        Route::post('/vendors', [MasterDataController::class, 'storeVendor']);
        Route::put('/vendors/{id}', [MasterDataController::class, 'updateVendor']);
        Route::delete('/vendors/{id}', [MasterDataController::class, 'deleteVendor']);

        Route::get('/master/workflow-stages', [MasterDataController::class, 'getWorkflowStages']);
        Route::put('/master/settings', [MasterDataController::class, 'updateSettings']);

        // 5. Work Permits Lifecycle
        Route::get('/permits/my-requests', [WorkPermitController::class, 'myRequests']);
        Route::get('/permits/review-queue', [WorkPermitController::class, 'reviewQueue']);
        Route::get('/permits/history', [WorkPermitController::class, 'history']);
        Route::post('/permits', [WorkPermitController::class, 'store']);
        Route::get('/permits/{id}', [WorkPermitController::class, 'show']);
        Route::post('/permits/{id}/approve', [WorkPermitController::class, 'approve']);
        Route::post('/permits/{id}/reject', [WorkPermitController::class, 'reject']);
        Route::post('/permits/{id}/extend', [WorkPermitController::class, 'extend']);
        Route::post('/permits/{id}/close', [WorkPermitController::class, 'closePermit']);

        // 6. Worker Documents (BPJS / Asuransi)
        Route::post('/permits/{id}/workers/{workerId}/documents', [PermitDocumentController::class, 'uploadWorkerDocument']);
        Route::put('/documents/{docId}/verify', [PermitDocumentController::class, 'verifyDocument']);

        // 7. Monitoring & Inspeksi K3
        Route::get('/monitoring/facilities', [MonitoringController::class, 'getFacilities']);
        Route::post('/monitoring/facilities', [MonitoringController::class, 'storeFacility']);
        Route::get('/monitoring/facilities/by-qr/{qrCodeId}', [MonitoringController::class, 'getFacilityByQrId']);
        Route::post('/monitoring/facilities/{id}/refill', [MonitoringController::class, 'recordRefill']);
        Route::get('/monitoring/alerts-summary', [MonitoringController::class, 'getAlertsSummary']);
        Route::post('/monitoring/inspections', [MonitoringController::class, 'storeInspection']);
        Route::post('/monitoring/capa', [MonitoringController::class, 'storeCapa']);
        Route::put('/monitoring/capa/{id}/close', [MonitoringController::class, 'closeCapa']);
        Route::get('/monitoring/spi-metrics', [MonitoringController::class, 'getSpiMetrics']);

        // 8. Dashboards
        Route::get('/dashboard/contractor', [DashboardController::class, 'contractorDashboard']);
        Route::get('/dashboard/hse', [DashboardController::class, 'hseDashboard']);
        Route::get('/dashboard/ga', [DashboardController::class, 'gaDashboard']);

        // 9. Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    });
});
