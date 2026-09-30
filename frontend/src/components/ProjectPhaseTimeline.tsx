import { CalendarClock, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn, calculateInclusiveDays } from '@/lib/utils';

export interface ProjectPhase {
  id: number;
  permit_number: string;
  request_type: string;
  extension_phase: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at?: string;
}

interface ProjectPhaseTimelineProps {
  currentPermitId?: number | string;
  phases?: ProjectPhase[];
  rootPermitNumber?: string;
  cumulativeStartDate?: string;
  cumulativeEndDate?: string;
}

export function ProjectPhaseTimeline({
  currentPermitId,
  phases = [],
  rootPermitNumber,
  cumulativeStartDate,
  cumulativeEndDate,
}: ProjectPhaseTimelineProps) {
  if (!phases || phases.length === 0) {
    return null;
  }

  // Calculate cumulative stats
  const firstPhase = phases[0];
  const lastPhase = phases[phases.length - 1];
  const effectiveStart = cumulativeStartDate || (firstPhase?.start_date ? firstPhase.start_date.substring(0, 10) : '-');
  const effectiveEnd = cumulativeEndDate || (lastPhase?.end_date ? lastPhase.end_date.substring(0, 10) : '-');
  const totalDays = calculateInclusiveDays(effectiveStart, effectiveEnd);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return <CheckCircle2 size={14} className="text-emerald-600" />;
      case 'Selesai':
        return <CheckCircle2 size={14} className="text-blue-600" />;
      case 'Ditolak':
        return <AlertCircle size={14} className="text-rose-600" />;
      default:
        return <Clock size={14} className="text-amber-600 animate-pulse" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Selesai':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Ditolak':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-amber-100 text-amber-900 border-amber-300';
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-amber-50/90 border border-amber-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-200/90 text-amber-900 rounded-lg shrink-0">
            <CalendarClock size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              Timeline Rantai Fase Proyek
              <span className="text-[11px] font-semibold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                {phases.length} Fase Terdaftar
              </span>
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              SIKA Induk Awal: <strong className="font-mono text-slate-900">{rootPermitNumber || firstPhase?.permit_number}</strong>
            </p>
          </div>
        </div>

        <div className="bg-white/90 border border-amber-300 px-3.5 py-1.5 rounded-lg shadow-xs flex items-center gap-2">
          <span className="text-[11px] uppercase font-bold text-amber-800">Total Akumulasi:</span>
          <strong className="text-xs font-mono text-amber-950">
            {effectiveStart} s/d {effectiveEnd}
          </strong>
          <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
            {totalDays} Hari Kalender
          </span>
        </div>
      </div>

      {/* Horizontal Multi-Phase Flow */}
      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {phases.map((phase, idx) => {
            const isCurrent = currentPermitId && (
              String(phase.id) === String(currentPermitId) || 
              phase.permit_number === currentPermitId
            );
            const phaseStart = phase.start_date ? phase.start_date.substring(0, 10) : '-';
            const phaseEnd = phase.end_date ? phase.end_date.substring(0, 10) : '-';
            const phaseDays = calculateInclusiveDays(phaseStart, phaseEnd);

            return (
              <div
                key={phase.id || idx}
                className={cn(
                  "p-3 rounded-lg border transition-all text-xs relative flex flex-col justify-between space-y-2",
                  isCurrent 
                    ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-400/40" 
                    : "bg-white/80 border-amber-200/90 hover:bg-white"
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                    phase.extension_phase === 0 
                      ? "bg-slate-100 text-slate-700" 
                      : "bg-amber-100 text-amber-900 font-semibold"
                  )}>
                    {phase.extension_phase === 0 ? "Fase 0 (Awal)" : `Fase ${phase.extension_phase} (Perpanjangan Ke-${phase.extension_phase})`}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded">
                      Dokumen Ini
                    </span>
                  )}
                </div>

                {/* Permit Info */}
                <div>
                  <strong className="text-slate-900 font-mono text-xs block">
                    {phase.permit_number}
                  </strong>
                  <span className="text-slate-600 text-[11px] block mt-0.5">
                    {phaseStart} s/d {phaseEnd}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Durasi: <strong className="text-slate-700">{phaseDays} Hari</strong> (Maks. 6)
                  </span>
                </div>

                {/* Status Footer */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {getStatusIcon(phase.status)}
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", getStatusBadge(phase.status))}>
                      {phase.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
