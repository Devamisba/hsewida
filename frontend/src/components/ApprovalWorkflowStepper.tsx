import { CheckCircle2, Clock, Lock, XCircle, ShieldCheck } from "lucide-react";
import { cn, formatPermitStatus } from "@/lib/utils";

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
    title: "PIC Widatra",
    subtitle: "Pemeriksaan Lapangan",
    roleCode: "pic_vendor",
    roleName: "PIC Internal PT Widatra Bhakti",
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
    title: "Head Dept HRD&GA",
    subtitle: "Validasi Area & Fasilitas",
    roleCode: "ga_dept_head",
    roleName: "Head Dept HRD&GA",
  },
  {
    key: "ga_div_head",
    stepNumber: 4,
    title: "Head Division HRD&GA",
    subtitle: "Otorisasi Final Izin",
    roleCode: "ga_div_head",
    roleName: "Head Division HRD&GA",
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
      case "Menunggu PIC Vendor": 
      case "Menunggu PIC Widatra": return 1;
      case "Menunggu HSE": return 2;
      case "Menunggu Head Dept HRD&GA":
      case "Menunggu GA Dept Head": return 3;
      case "Menunggu Head Division HRD&GA":
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
      (a) => (a.role_at_action === roleCode || (roleCode === "hse" && a.role_at_action === "pic_k3")) && a.action === "Approve"
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

  // Cari data penolakan dari audit trail
  const rejectApproval = isRejected
    ? approvals?.find((a) => a.action === "Reject") || null
    : null;

  // Tentukan tahap penolakan (1..4)
  const getRejectStepNumber = (): number => {
    if (!rejectApproval) return 1;
    const role = (rejectApproval.role_at_action || "").toLowerCase();

    if (role === "pic_vendor" || role === "pic") return 1;
    if (role === "hse" || role === "pic_k3" || role === "k3") return 2;
    if (role === "ga_dept_head" || role === "head_dept") return 3;
    if (role === "ga_div_head" || role === "head_div") return 4;

    // Jika role penolak adalah admin atau system, cek dari tahap terakhir yang disetujui
    const hasGaDeptApproved = approvals?.some(
      (a) => a.action === "Approve" && a.role_at_action === "ga_dept_head"
    );
    if (hasGaDeptApproved) return 4;

    const hasHseApproved = approvals?.some(
      (a) =>
        a.action === "Approve" &&
        (a.role_at_action === "hse" || a.role_at_action === "pic_k3")
    );
    if (hasHseApproved) return 3;

    const hasPicApproved = approvals?.some(
      (a) => a.action === "Approve" && a.role_at_action === "pic_vendor"
    );
    if (hasPicApproved) return 2;

    return 1;
  };

  const rejectStepNumber = isRejected ? getRejectStepNumber() : -1;
  const rejectedStepDef =
    isRejected && rejectStepNumber >= 1 && rejectStepNumber <= 4
      ? STEPS[rejectStepNumber - 1]
      : null;

  // Identitas penolak & role
  const rejectUserName = rejectApproval?.user?.name || "Pejabat Terkait";
  let rejectRoleDisplayName = rejectedStepDef?.roleName || "Reviewer Terkait";
  const rawRoleAtAction = (rejectApproval?.role_at_action || "").toLowerCase();
  if (rawRoleAtAction === "admin") {
    rejectRoleDisplayName = "Administrator HSE";
  } else if (rawRoleAtAction === "system") {
    rejectRoleDisplayName = "Sistem Otomatis (Kedaluwarsa)";
  }

  const rejectDateFormatted = rejectApproval?.action_date
    ? formatApprovalDate(rejectApproval.action_date)
    : "";

  const finalRejectReason =
    rejectReason || rejectApproval?.note || "Tidak ada catatan khusus yang dilampirkan.";

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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              <XCircle size={13} className="text-rose-600" /> Ditolak di Tahap {rejectStepNumber}: {rejectedStepDef?.title || "Approval"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
              <Clock size={13} /> Tahap {activeStep} dari 4: {formatPermitStatus(status).replace("Menunggu ", "")}
            </span>
          )}
        </div>
      </div>

      {/* Stepper Bar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {STEPS.map((step) => {
          // Logika ketika alur normal (bukan Ditolak)
          const isPassedNormal = !isRejected && (activeStep > step.stepNumber || isApproved);
          const isCurrentNormal = !isRejected && activeStep === step.stepNumber;
          const isLockedNormal = !isApproved && !isPassedNormal && !isCurrentNormal;

          // Logika ketika alur DITOLAK
          const isRejectedPassed = isRejected && step.stepNumber < rejectStepNumber;
          const isRejectedCurrent = isRejected && step.stepNumber === rejectStepNumber;
          const isRejectedHalted = isRejected && step.stepNumber > rejectStepNumber;

          const isPassed = isPassedNormal || isRejectedPassed;
          const isCurrent = isCurrentNormal;
          const isLocked = isLockedNormal;

          const isAuthorizedUser =
            currentRole === "admin" ||
            currentRole === step.roleCode ||
            (step.roleCode === "hse" && currentRole === "pic_k3");
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
                isRejectedCurrent && "bg-rose-50/95 border-rose-300 ring-2 ring-rose-400/30 shadow-xs",
                isRejectedHalted && "bg-slate-50/60 border-slate-200 text-slate-400 opacity-60"
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
                      isRejectedCurrent && "bg-rose-600 text-white",
                      isRejectedHalted && "bg-slate-200 text-slate-400"
                    )}
                  >
                    {isPassed ? "✓" : isRejectedCurrent ? "✕" : isRejectedHalted ? "–" : step.stepNumber}
                  </span>

                  {isPassed && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
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
                  {isRejectedCurrent && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-200">
                      <XCircle size={11} className="text-rose-600" /> Ditolak
                    </span>
                  )}
                  {isRejectedHalted && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                      Alur Berhenti
                    </span>
                  )}
                </div>

                {/* Role Titles */}
                <h5
                  className={cn(
                    "text-xs font-bold",
                    isPassed ? "text-emerald-900" : isRejectedCurrent ? "text-rose-950" : isCurrent ? "text-blue-900" : isRejectedHalted ? "text-slate-400" : "text-slate-700"
                  )}
                >
                  {step.title}
                </h5>
                <p
                  className={cn(
                    "text-[10.5px] mt-0.5 leading-snug",
                    isRejectedCurrent ? "text-rose-700/80" : isRejectedHalted ? "text-slate-400/80" : "text-slate-500"
                  )}
                >
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
                ) : isRejectedCurrent ? (
                  <span className="text-rose-700 font-semibold block truncate" title={`✕ Ditolak oleh ${rejectUserName}`}>
                    ✕ Ditolak oleh {rejectUserName}
                    {rejectDateFormatted && ` • ${rejectDateFormatted}`}
                  </span>
                ) : isRejectedHalted ? (
                  <span className="text-slate-400 italic block truncate">
                    Alur berhenti di Tahap {rejectStepNumber} ({rejectedStepDef?.title || "Sebelumnya"})
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

      {/* Alert Rejection Box if Rejected */}
      {isRejected && (
        <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2.5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-rose-200/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                <XCircle size={16} />
              </div>
              <div>
                <span className="font-bold text-rose-950 block text-[13px]">
                  Izin Kerja Telah Ditolak pada Tahap {rejectStepNumber}: {rejectedStepDef?.title || "Approval"}
                </span>
                <span className="text-[11px] text-rose-700">
                  Alur persetujuan resmi dihentikan dan pengajuan tidak diteruskan ke tahap berikutnya.
                </span>
              </div>
            </div>

            {/* Badge Identitas Penolak */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto shrink-0">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white border border-rose-300 text-rose-800 shadow-2xs">
                Oleh: {rejectUserName} ({rejectRoleDisplayName})
              </span>
              {rejectDateFormatted && (
                <span className="px-2 py-1 rounded-md text-[10.5px] bg-rose-100 text-rose-700 border border-rose-200/60 font-medium">
                  {rejectDateFormatted}
                </span>
              )}
            </div>
          </div>

          {/* Kotak Alasan Penolakan */}
          <div className="bg-white/90 border border-rose-200/90 rounded-lg p-3">
            <span className="text-[10.5px] uppercase font-bold text-rose-600 tracking-wider block mb-1">
              Alasan Penolakan:
            </span>
            <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed text-[12px]">
              {finalRejectReason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
