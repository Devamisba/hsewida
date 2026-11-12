<?php

namespace App\Services;

use App\Models\WorkPermit;
use App\Models\PermitApproval;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class WorkPermitService
{
    /**
     * Sinkronisasi izin kerja yang tanggal akhirnya (end_date) telah terlewati:
     * 1. Status 'Disetujui' dengan end_date < today -> 'Selesai' (Non-toleransi).
     * 2. Status belum disetujui (Menunggu Review, dll.) dengan end_date < today -> 'Ditolak' (Kedaluwarsa otomatis).
     *
     * @return int Jumlah izin yang diperbarui
     */
    public static function syncExpiredPermits(): int
    {
        try {
            $today = Carbon::today()->toDateString();
            $now = Carbon::now();
            $totalChanged = 0;

            // 1. Izin Disetujui yang tanggal kerjanya telah tuntas -> Ubah menjadi 'Selesai'
            $completedCount = WorkPermit::where('status', 'Disetujui')
                ->where('end_date', '<', $today)
                ->update([
                    'status' => 'Selesai',
                    'updated_at' => $now,
                ]);
            $totalChanged += $completedCount;

            // 2. Izin belum disetujui (Menunggu Review / Draft) yang masa berlakunya telah habis -> Ubah menjadi 'Ditolak'
            $expiredPending = WorkPermit::whereNotIn('status', ['Disetujui', 'Selesai', 'Ditolak'])
                ->where('end_date', '<', $today)
                ->get();

            foreach ($expiredPending as $permit) {
                $reason = 'Ditolak Otomatis oleh Sistem: Periode izin kerja telah berakhir sebelum proses persetujuan (approval) selesai disetujui.';
                
                $permit->update([
                    'status' => 'Ditolak',
                    'reject_reason' => $reason,
                    'updated_at' => $now,
                ]);

                // Catat ke log approval jika belum ada record penolakan sistem
                $alreadyLogged = PermitApproval::where('work_permit_id', $permit->id)
                    ->where('action', 'Reject')
                    ->where('role_at_action', 'SYSTEM')
                    ->exists();

                if (!$alreadyLogged) {
                    PermitApproval::create([
                        'work_permit_id' => $permit->id,
                        'user_id' => null,
                        'role_at_action' => 'SYSTEM',
                        'action' => 'Reject',
                        'note' => $reason,
                        'action_date' => $now,
                    ]);
                }

                $totalChanged++;
            }

            return $totalChanged;
        } catch (\Throwable $e) {
            Log::error('Gagal sinkronisasi izin kedaluwarsa: ' . $e->getMessage());
            return 0;
        }
    }
}
