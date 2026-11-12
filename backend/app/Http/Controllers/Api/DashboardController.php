<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\WorkPermit;
use App\Models\PermitWorker;
use App\Models\Vendor;
use App\Models\SafetyFacility;
use App\Models\FacilityInspection;
use App\Services\WorkPermitService;

class DashboardController extends Controller
{
    /**
     * Dashboard for Vendor / Contractor (Role: pemohon).
     */
    public function contractorDashboard(Request $request)
    {
        WorkPermitService::syncExpiredPermits();
        $user = $request->user();
        $today = Carbon::today()->toDateString();
        $threeDaysLater = Carbon::today()->addDays(3)->toDateString();
        $period = strtolower($request->query('period', 'monthly'));

        $isVendor = in_array(strtolower(optional($user->role)->code ?? ''), ['pemohon', 'vendor', 'kontraktor', 'contractor']);

        $basePermitQuery = function() use ($user, $isVendor) {
            $q = WorkPermit::query();
            if ($isVendor && $user) {
                $q->where(function($sub) use ($user) {
                    $sub->where('user_id', $user->id);
                    if (!empty($user->vendor_id)) {
                        $sub->orWhere('vendor_id', $user->vendor_id);
                    }
                });
            }
            return $q;
        };

        $pendingCount = $basePermitQuery()
            ->whereIn('status', [
                'Menunggu PIC Widatra',
                'Menunggu PIC Vendor', 
                'Menunggu HSE', 
                'Menunggu Head Dept HRD&GA', 
                'Menunggu Head Division HRD&GA',
                'Menunggu GA Dept Head', 
                'Menunggu GA Div Head'
            ])
            ->count();

        $activeToday = $basePermitQuery()
            ->with('location')
            ->where('status', 'Disetujui')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $expiringSoonCount = $basePermitQuery()
            ->where('status', 'Disetujui')
            ->where('end_date', '<=', $threeDaysLater)
            ->where('end_date', '>=', $today)
            ->count();

        // Hitung Safe Man-Hours kumulatif dari seluruh izin kerja (Disetujui / Selesai)
        // Rumus K3: Total Pekerja x Jam Kerja/Hari x Hari Selamat Terlaksana
        $safePermits = $basePermitQuery()
            ->with('workers')
            ->whereIn('status', ['Disetujui', 'Selesai'])
            ->get();

        $safeManHours = 0;
        $todayCarbon = Carbon::today();

        foreach ($safePermits as $p) {
            $workers = (int) ($p->total_workers > 0 ? $p->total_workers : max($p->workers ? $p->workers->count() : 0, 1));

            $hoursPerDay = 8;
            if (!empty($p->daily_start_time) && !empty($p->daily_end_time)) {
                try {
                    $startH = Carbon::parse($p->daily_start_time);
                    $endH = Carbon::parse($p->daily_end_time);
                    $diffH = abs($startH->diffInHours($endH));
                    if ($diffH > 0 && $diffH <= 24) {
                        $hoursPerDay = $diffH;
                    }
                } catch (\Exception $e) {
                    $hoursPerDay = 8;
                }
            }

            if ($p->start_date && $p->end_date) {
                $startD = Carbon::parse($p->start_date)->startOfDay();
                $endD = Carbon::parse($p->end_date)->startOfDay();

                if ($startD->lte($todayCarbon)) {
                    $effectiveEnd = $endD->lt($todayCarbon) ? $endD : $todayCarbon;
                    $days = $startD->diffInDays($effectiveEnd) + 1;
                    $safeManHours += ($workers * $hoursPerDay * $days);
                }
            }
        }

        // Hitung Data Diagram Aktivitas Pengajuan Izin Secara Real-Time dari Database
        $chartData = [];
        $periodSubtitle = 'Tren izin kerja 6 bulan terakhir';

        if ($period === 'daily') {
            $periodSubtitle = 'Tren izin kerja 7 hari terakhir';
            for ($i = 6; $i >= 0; $i--) {
                $d = Carbon::today()->subDays($i);
                $start = $d->copy()->startOfDay();
                $end = $d->copy()->endOfDay();
                $label = $d->locale('id')->isoFormat('ddd, DD/MM');

                $pengajuan = $basePermitQuery()->whereBetween('created_at', [$start, $end])->count();
                $disetujui = $basePermitQuery()
                    ->whereBetween('created_at', [$start, $end])
                    ->whereIn('status', ['Disetujui', 'Selesai'])
                    ->count();

                $chartData[] = [
                    'name' => $label,
                    'pengajuan' => $pengajuan,
                    'disetujui' => $disetujui,
                ];
            }
        } elseif ($period === 'weekly') {
            $periodSubtitle = 'Tren izin kerja 4 minggu terakhir';
            for ($i = 3; $i >= 0; $i--) {
                $start = Carbon::today()->subWeeks($i)->startOfWeek();
                $end = Carbon::today()->subWeeks($i)->endOfWeek();
                $label = 'Mgg ' . (4 - $i) . ' (' . $start->format('d/m') . ')';

                $pengajuan = $basePermitQuery()->whereBetween('created_at', [$start, $end])->count();
                $disetujui = $basePermitQuery()
                    ->whereBetween('created_at', [$start, $end])
                    ->whereIn('status', ['Disetujui', 'Selesai'])
                    ->count();

                $chartData[] = [
                    'name' => $label,
                    'pengajuan' => $pengajuan,
                    'disetujui' => $disetujui,
                ];
            }
        } elseif ($period === 'yearly') {
            $periodSubtitle = 'Tren izin kerja 5 tahun terakhir';
            $currentYear = (int) Carbon::now()->format('Y');
            for ($i = 4; $i >= 0; $i--) {
                $y = $currentYear - $i;
                $start = Carbon::create($y, 1, 1, 0, 0, 0);
                $end = Carbon::create($y, 12, 31, 23, 59, 59);

                $pengajuan = $basePermitQuery()->whereBetween('created_at', [$start, $end])->count();
                $disetujui = $basePermitQuery()
                    ->whereBetween('created_at', [$start, $end])
                    ->whereIn('status', ['Disetujui', 'Selesai'])
                    ->count();

                $chartData[] = [
                    'name' => (string) $y,
                    'pengajuan' => $pengajuan,
                    'disetujui' => $disetujui,
                ];
            }
        } else {
            // monthly (default)
            $periodSubtitle = 'Tren izin kerja 6 bulan terakhir';
            $indoMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            for ($i = 5; $i >= 0; $i--) {
                $m = Carbon::now()->subMonths($i);
                $start = $m->copy()->startOfMonth();
                $end = $m->copy()->endOfMonth();
                $monthIndex = (int) $m->format('n') - 1;
                $name = $indoMonths[$monthIndex] ?? $m->format('M');

                $pengajuan = $basePermitQuery()->whereBetween('created_at', [$start, $end])->count();
                $disetujui = $basePermitQuery()
                    ->whereBetween('created_at', [$start, $end])
                    ->whereIn('status', ['Disetujui', 'Selesai'])
                    ->count();

                $chartData[] = [
                    'name' => $name,
                    'pengajuan' => $pengajuan,
                    'disetujui' => $disetujui,
                ];
            }
        }

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
                'safeManHours' => $safeManHours,
                'chartData' => $chartData,
                'period' => $period,
                'periodSubtitle' => $periodSubtitle,
            ],
        ]);
    }

    /**
     * Dashboard for HSE Officer (Role: hse).
     */
    public function hseDashboard()
    {
        WorkPermitService::syncExpiredPermits();
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

        // 2. Monitoring & Inspeksi K3 Metrics (Safely encapsulated)
        $monitoringData = [
            'totalFacilities' => 0,
            'aparCount' => 0,
            'hydrantCount' => 0,
            'p3kCount' => 0,
            'emergencyDoorCount' => 0,
            'safetyMirrorCount' => 0,
            'assemblyPointCount' => 0,
            'otherCount' => 0,
            'checkedThisMonth' => 0,
            'uncheckedThisMonth' => 0,
            'inspectionPercentage' => 0,
            'daysLeftInMonth' => max(0, (int) Carbon::now()->diffInDays(Carbon::now()->endOfMonth())),
            'expiredCount' => 0,
            'refillQueueCount' => 0,
            'findingsCount' => 0,
        ];

        try {
            $currentMonthStart = Carbon::now()->startOfMonth();
            $currentMonthEnd = Carbon::now()->endOfMonth();

            $totalFacilities = SafetyFacility::where('status_aktif', true)->count();
            $aparCount = SafetyFacility::where('status_aktif', true)->where('category', 'apar')->count();
            $hydrantCount = SafetyFacility::where('status_aktif', true)->where('category', 'hydrant')->count();
            $p3kCount = SafetyFacility::where('status_aktif', true)->where('category', 'p3k')->count();
            $emergencyDoorCount = SafetyFacility::where('status_aktif', true)->where('category', 'emergency_door')->count();
            $safetyMirrorCount = SafetyFacility::where('status_aktif', true)->where('category', 'safety_mirror')->count();
            $assemblyPointCount = SafetyFacility::where('status_aktif', true)->where('category', 'assembly_point')->count();
            $otherCount = $emergencyDoorCount + $safetyMirrorCount + $assemblyPointCount;

            // Checked this month
            $checkedThisMonth = SafetyFacility::where('status_aktif', true)
                ->whereHas('inspections', function($q) use ($currentMonthStart, $currentMonthEnd) {
                    $q->whereBetween('inspection_date', [$currentMonthStart, $currentMonthEnd]);
                })->count();
            $uncheckedThisMonth = max(0, $totalFacilities - $checkedThisMonth);
            $inspectionPercentage = $totalFacilities > 0 ? round(($checkedThisMonth / $totalFacilities) * 100, 1) : 0;

            // Expired items
            $expiredCount = SafetyFacility::where('status_aktif', true)
                ->where('tipe_item', 'CONSUMABLE')
                ->whereHas('consumableCycle', function($q) use ($today) {
                    $q->where('expired_at', '<', $today);
                })->count();

            // Refill queue
            $refillQueueCount = SafetyFacility::where('status_aktif', true)
                ->where('category', 'apar')
                ->whereHas('consumableCycle', function($q) use ($today) {
                    $q->where('expired_at', '<', $today);
                })->count();

            // Inspections findings
            $findingsCount = FacilityInspection::where('result_status', 'Fail')->count();

            $monitoringData = [
                'totalFacilities' => $totalFacilities,
                'aparCount' => $aparCount,
                'hydrantCount' => $hydrantCount,
                'p3kCount' => $p3kCount,
                'emergencyDoorCount' => $emergencyDoorCount,
                'safetyMirrorCount' => $safetyMirrorCount,
                'assemblyPointCount' => $assemblyPointCount,
                'otherCount' => $otherCount,
                'checkedThisMonth' => $checkedThisMonth,
                'uncheckedThisMonth' => $uncheckedThisMonth,
                'inspectionPercentage' => $inspectionPercentage,
                'daysLeftInMonth' => max(0, (int) Carbon::now()->diffInDays(Carbon::now()->endOfMonth())),
                'expiredCount' => $expiredCount,
                'refillQueueCount' => $refillQueueCount,
                'findingsCount' => $findingsCount,
            ];
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('HSE Dashboard monitoring query fallback: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => [
                'pendingReviewCount' => $pendingReview->count(),
                'pendingReview' => $pendingReview->map(fn($p) => [
                    'id' => $p->permit_number,
                    'kontraktor' => $p->vendor ? $p->vendor->company_name : $p->pic_name,
                    'jenis' => $p->job_title,
                    'lokasi' => $p->location ? $p->location->name : '-',
                    'mulai' => $p->start_date ? $p->start_date->format('Y-m-d') : '-',
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

                // Monitoring & Inspeksi K3 Summary
                'monitoring' => $monitoringData,
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
