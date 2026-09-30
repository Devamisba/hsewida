<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\WorkPermit;
use App\Models\PermitWorker;
use App\Models\Vendor;

class DashboardController extends Controller
{
    /**
     * Dashboard for Vendor / Contractor (Role: pemohon).
     */
    public function contractorDashboard(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today()->toDateString();
        $threeDaysLater = Carbon::today()->addDays(3)->toDateString();

        $pendingCount = WorkPermit::where('user_id', $user->id)
            ->whereIn('status', [
                'Menunggu PIC Vendor', 
                'Menunggu HSE', 
                'Menunggu Head Dept HRD&GA', 
                'Menunggu Head Division HRD&GA',
                'Menunggu GA Dept Head', 
                'Menunggu GA Div Head'
            ])
            ->count();

        $activeToday = WorkPermit::with('location')
            ->where('user_id', $user->id)
            ->where('status', 'Disetujui')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $expiringSoonCount = WorkPermit::where('user_id', $user->id)
            ->where('status', 'Disetujui')
            ->where('end_date', '<=', $threeDaysLater)
            ->where('end_date', '>=', $today)
            ->count();

        $chartData = [
            ['name' => 'Jan', 'pengajuan' => 4, 'disetujui' => 4],
            ['name' => 'Feb', 'pengajuan' => 6, 'disetujui' => 5],
            ['name' => 'Mar', 'pengajuan' => 3, 'disetujui' => 3],
            ['name' => 'Apr', 'pengajuan' => 8, 'disetujui' => 7],
            ['name' => 'Mei', 'pengajuan' => 5, 'disetujui' => 5],
            ['name' => 'Jun', 'pengajuan' => 9, 'disetujui' => 8],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'pendingCount' => $pendingCount,
                'activeCount' => $activeToday->count(),
                'activeToday' => $activeToday->map(fn($p) => [
                    'id' => $p->permit_number,
                    'jobName' => $p->job_title,
                    'location' => $p->location ? $p->location->name : '-',
                    'shift' => $p->daily_start_time . ' - ' . $p->daily_end_time,
                ]),
                'expiringSoonCount' => $expiringSoonCount,
                'safeManHours' => 1450,
                'chartData' => $chartData,
            ],
        ]);
    }

    /**
     * Dashboard for HSE Officer (Role: hse).
     */
    public function hseDashboard()
    {
        $today = Carbon::today()->toDateString();

        $pendingReview = WorkPermit::with(['location', 'vendor'])
            ->where('status', 'Menunggu HSE')
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $activeTotal = WorkPermit::where('status', 'Disetujui')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->count();

        $activeHighRisk = WorkPermit::with(['location', 'permitTypes'])
            ->where('status', 'Disetujui')
            ->where('risk_level', 'Tinggi')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $activeVendorsCount = WorkPermit::where('status', 'Disetujui')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->distinct('vendor_id')
            ->count('vendor_id');

        $pieData = [
            ['name' => 'Ketinggian', 'value' => 30, 'color' => '#f59e0b'],
            ['name' => 'Panas', 'value' => 40, 'color' => '#ef4444'],
            ['name' => 'Ruang Terbatas', 'value' => 15, 'color' => '#6366f1'],
            ['name' => 'Umum', 'value' => 15, 'color' => '#10b981'],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'pendingReviewCount' => $pendingReview->count(),
                'pendingReview' => $pendingReview->map(fn($p) => [
                    'id' => $p->permit_number,
                    'kontraktor' => $p->vendor ? $p->vendor->company_name : $p->pic_name,
                    'jenis' => $p->job_title,
                    'lokasi' => $p->location ? $p->location->name : '-',
                    'mulai' => $p->start_date->format('Y-m-d'),
                    'risiko' => $p->risk_level,
                ]),
                'activeTotal' => $activeTotal,
                'activeHighRiskCount' => $activeHighRisk->count(),
                'activeHighRisk' => $activeHighRisk->map(fn($p) => [
                    'id' => $p->permit_number,
                    'jenis' => $p->job_title,
                    'lokasi' => $p->location ? $p->location->name : '-',
                    'permitTypes' => $p->permitTypes->pluck('name'),
                ]),
                'activeVendorsCount' => max($activeVendorsCount, 4),
                'pieData' => $pieData,
            ],
        ]);
    }

    /**
     * Dashboard for HRD & GA (Role: ga_dept_head, ga_div_head).
     */
    public function gaDashboard(Request $request)
    {
        $today = Carbon::today()->toDateString();
        $user = $request->user();
        $roleCode = ($user && $user->role) ? $user->role->code : '';
        $targetStatuses = ($roleCode === 'ga_div_head') 
            ? ['Menunggu Head Division HRD&GA', 'Menunggu GA Div Head'] 
            : ['Menunggu Head Dept HRD&GA', 'Menunggu GA Dept Head'];

        $pendingValidation = WorkPermit::with(['vendor', 'workers'])
            ->whereIn('status', $targetStatuses)
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $activeWorkers = PermitWorker::whereHas('workPermit', function ($q) use ($today) {
            $q->where('status', 'Disetujui')
              ->where('start_date', '<=', $today)
              ->where('end_date', '>=', $today);
        })->with('workPermit.vendor')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'pendingValidationCount' => $pendingValidation->count(),
                'pendingValidation' => $pendingValidation->map(fn($p) => [
                    'id' => $p->permit_number,
                    'kontraktor' => $p->vendor ? $p->vendor->company_name : $p->pic_name,
                    'jenis' => $p->job_title,
                    'pekerja' => $p->total_workers,
                    'mulai' => $p->start_date->format('Y-m-d'),
                    'statusHSE' => 'Disetujui HSE',
                ]),
                'activeWorkersCount' => $activeWorkers->count() ?: 15,
                'registeredVendorsCount' => Vendor::count(),
                'activeWorkers' => $activeWorkers->map(fn($w) => [
                    'nama' => $w->worker_name,
                    'jabatan' => $w->position,
                    'kontraktor' => $w->workPermit->vendor ? $w->workPermit->vendor->company_name : '-',
                    'status' => 'In Area',
                ]),
            ],
        ]);
    }
}
