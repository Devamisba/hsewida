import { CheckCircle2, Clock, Lock, XCircle, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApprovalRecord {
  id?: number;
  user_id?: number;
  user?: { id: number; name: string };
  role_at_action?: string;
  action?: string;
  note?: string;
  action_date?: string;
}

interface ApprovalWorkflowStepperProps {
  status: string;
  currentRole?: string | null;
  approvals?: ApprovalRecord[];
  rejectReason?: string | null;
  compact?: boolean;
}

interface StepDef {
  key: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  roleCode: string;
  roleName: string;
}

const STEPS: StepDef[] = [
  {
    key: "pic_vendor",
    stepNumber: 1,
    title: "PIC Vendor",
    subtitle: "Pemeriksaan Kontraktor",
    roleCode: "pic_vendor",
    roleName: "PIC / Pengawas Lapangan Vendor",
  },
  {
    key: "hse",
    stepNumber: 2,
    title: "HSE Officer",
    subtitle: "Verifikasi K3 & JSA",
    roleCode: "hse",
    roleName: "HSE Officer / Koordinator K3",
  },
  {
    key: "ga_dept_head",
    stepNumber: 3,
    title: "GA Dept Head",
    subtitle: "Validasi Area & Fasilitas",
    roleCode: "ga_dept_head",
    roleName: "HRD & GA Department Head",
  },
  {
    key: "ga_div_head",
    stepNumber: 4,
    title: "GA Div Head",
    subtitle: "Otorisasi Final Ijin",
    roleCode: "ga_div_head",
    roleName: "HRD & GA Division Head",
  },
];

export function ApprovalWorkflowStepper({
  status,
  currentRole,
  approvals = [],
  rejectReason,
}: ApprovalWorkflowStepperProps) {
  // Determine current active step number (1..4, 5 = Disetujui, -1 = Ditolak)
  const getActiveStepIndex = (st: string): number => {
    switch (st) {
      case "Menunggu PIC Vendor": return 1;
      case "Menunggu HSE": return 2;
      case "Menunggu GA Dept Head": return 3;
      case "Menunggu GA Div Head": return 4;
      case "Disetujui":
      case "Selesai": return 5;
      case "Ditolak": return -1;
      default: return 1;
    }
  };

  const activeStep = getActiveStepIndex(status);
  const isRejected = status === "Ditolak";
  const isApproved = status === "Disetujui" || status === "Selesai";

  // Helper to find approval audit entry for a given step
  const getApprovalForStep = (roleCode: string) => {
    if (!approvals || approvals.length === 0) return null;
    return approvals.find(
      (a) => a.role_at_action === roleCode && a.action === "Approve"
    );
  };

  const formatApprovalDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr).slice(0, 16);
    }
  };

  return (
    <div className="w-full bg-slate-50/90 border border-slate-200 rounded-2xl p-4 md:p-5 space-y-3.5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Alur Persetujuan Berjenjang (Sequential Approval)
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Setiap tahap terkunci otomatis hingga disetujui oleh penanggung jawab tahap sebelumnya.
          </p>
        </div>

        {/* Current Status Pill */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {isApproved ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 size={13} /> Selesai & Disetujui
            </span>
          ) : isRejected ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              <XCircle size={13} /> Ditolak
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
              <Clock size={13} /> Tahap {activeStep} dari 4: {status.replace("Menunggu ", "")}
            </span>
          )}
        </div>
      </div>

      {/* Stepper Bar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {STEPS.map((step) => {
          const isPassed = !isRejected && (activeStep > step.stepNumber || isApproved);
          const isCurrent = !isRejected && activeStep === step.stepNumber;
          const isLocked = !isApproved && !isPassed && !isCurrent;
          const isAuthorizedUser = currentRole === "admin" || currentRole === step.roleCode;
          const audit = getApprovalForStep(step.roleCode);

          return (
            <div
              key={step.key}
              className={cn(
                "relative rounded-xl p-3.5 border transition-all flex flex-col justify-between",
                isPassed && "bg-emerald-50/80 border-emerald-200 text-emerald-950",
                isCurrent && isAuthorizedUser && "bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/30 shadow-xs",
                isCurrent && !isAuthorizedUser && "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20",
                isLocked && "bg-slate-100/70 border-slate-200 text-slate-400 opacity-80",
                isRejected && "bg-slate-50 border-slate-200 text-slate-400"
              )}
            >
              <div>
                {/* Step Number & Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black",
                      isPassed && "bg-emerald-600 text-white",
                      isCurrent && "bg-blue-600 text-white animate-pulse",
                      isLocked && "bg-slate-300 text-slate-600",
                      isRejected && "bg-slate-200 text-slate-500"
                    )}
                  >
                    {isPassed ? "✓" : step.stepNumber}
                  </span>

                  {isPassed && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={11} /> Disetujui
                    </span>
                  )}
                  {isCurrent && (
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                        isAuthorizedUser
                          ? "bg-blue-600 text-white"
                          : "bg-amber-200 text-amber-900"
                      )}
                    >
                      <Clock size={11} />
                      {isAuthorizedUser ? "Giliran Anda" : "Menunggu"}
                    </span>
                  )}
                  {isLocked && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock size={10} /> Terkunci
                    </span>
                  )}
                </div>

                {/* Role Titles */}
                <h5
                  className={cn(
                    "text-xs font-bold",
                    isPassed ? "text-emerald-900" : isCurrent ? "text-blue-900" : "text-slate-700"
                  )}
                >
                  {step.title}
                </h5>
                <p className="text-[10.5px] text-slate-500 mt-0.5 leading-snug">
                  {step.subtitle}
                </p>
              </div>

              {/* Footer status of step */}
              <div className="mt-3 pt-2 border-t border-black/5 text-[10px]">
                {isPassed ? (
                  <span className="text-emerald-700 font-medium block truncate">
                    ✓ {audit?.user?.name || "Tervalidasi"}
                    {audit?.action_date && ` • ${formatApprovalDate(audit.action_date)}`}
                  </span>
                ) : isCurrent ? (
                  <span
                    className={cn(
                      "font-semibold block",
                      isAuthorizedUser ? "text-blue-700" : "text-amber-800"
                    )}
                  >
                    {isAuthorizedUser
                      ? "👉 Butuh tindakan persetujuan Anda"
                      : `🔒 Menunggu wewenang ${step.title}`}
                  </span>
                ) : (
                  <span className="text-slate-400 italic flex items-center gap-1">
                    <Lock size={9} /> Otomatis terbuka setelah tahap {step.stepNumber - 1}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert Rejection Reason if Rejected */}
      {isRejected && rejectReason && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Ijin Kerja Telah Ditolak:</span>
            <p className="mt-0.5 text-rose-700 leading-relaxed">{rejectReason}</p>
          </div>
        </div>
      )}
    </div>
  );
}
