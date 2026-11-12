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
     * 1. Status 'Disetujui' dengan end_date < today (atau end_date == today dan jam kerja selesai) -> 'Selesai'.
     * 2. Status belum disetujui (Menunggu Review, dll.) dengan end_date < today -> 'Ditolak' (Kedaluwarsa otomatis).
     *
     * @return int Jumlah izin yang diperbarui
     */
    public static function syncExpiredPermits(): int
    {
        try {
            $jakartaNow = Carbon::now('Asia/Jakarta');
            $today = $jakartaNow->toDateString();
            $currentTime = $jakartaNow->format('H:i');
            $now = Carbon::now();
            $totalChanged = 0;

            // 1. Izin Disetujui yang masa kerjanya telah tuntas:
            // - end_date < today (lewat hari)
            // - ATAU end_date == today dan daily_end_time <= currentTime (jam kerja hari ini sudah selesai)
            $expiredApproved = WorkPermit::where('status', 'Disetujui')
                ->where(function ($q) use ($today, $currentTime) {
                    $q->where('end_date', '<', $today)
                      ->orWhere(function ($sub) use ($today, $currentTime) {
                          $sub->where('end_date', '=', $today)
                              ->whereNotNull('daily_end_time')
                              ->where('daily_end_time', '<=', $currentTime);
                      });
                })
                ->get();

            foreach ($expiredApproved as $p) {
                $p->status = 'Selesai';
                $p->updated_at = $now;
                $p->save();
                $totalChanged++;
            }

            // 2. Izin belum disetujui (Menunggu Review / Draft) yang masa kerjanya telah lewat -> Ubah menjadi 'Ditolak'
            $expiredPending = WorkPermit::whereNotIn('status', ['Disetujui', 'Selesai', 'Ditolak'])
                ->where(function ($q) use ($today, $currentTime) {
                    $q->where('end_date', '<', $today)
                      ->orWhere(function ($sub) use ($today, $currentTime) {
                          $sub->where('end_date', '=', $today)
                              ->whereNotNull('daily_end_time')
                              ->where('daily_end_time', '<=', $currentTime);
                      });
                })
                ->get();

            foreach ($expiredPending as $permit) {
                $reason = 'Ditolak Otomatis oleh Sistem: Periode izin kerja telah berakhir sebelum proses persetujuan (approval) selesai disetujui.';
                
                $permit->status = 'Ditolak';
                $permit->reject_reason = $reason;
                $permit->updated_at = $now;
                $permit->save();

                // Catat ke log approval jika belum ada record penolakan sistem
                try {
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
                } catch (\Throwable $ignored) {
                    // Abaikan kesalahan log approval agar tidak menggugurkan update status izin
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
