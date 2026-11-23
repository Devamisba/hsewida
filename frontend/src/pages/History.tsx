import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { 
  Eye, 
  Printer, 
  FileText, 
  X, 
  Shield, 
  Users, 
  AlertTriangle, 
  Briefcase, 
  FileCheck, 
  CheckCircle2, 
  Lock, 
  CalendarPlus, 
  Calendar,
  History as HistoryIcon,
  CalendarRange,
  Layers,
  Infinity as InfinityIcon,
    XCircle,
  ShieldCheck,
  FileSpreadsheet,
  Search,
  RotateCcw,
  Clock
} from "lucide-react";
import { cn, calculateInclusiveDays, formatPermitStatus, formatDateDDMMYY } from "@/lib/utils";
import { api } from "@/services/api";
import { auth } from "@/lib/auth";
import { PrintPermitModal } from "@/components/PrintPermitModal";
import { ApprovalWorkflowStepper } from "@/components/ApprovalWorkflowStepper";
import { ProjectPhaseTimeline } from "@/components/ProjectPhaseTimeline";
import { exportWorkPermitsToExcel } from "@/utils/exportPermitExcel";
import { resolveImageUrl } from "@/utils/imageUrl";
import { K3Loader } from "@/components/K3Loader";

function mapApiToHistory(item: any) {
  const parent = item.parent_permit || item.parentPermit || null;
  const root = item.root_permit || item.rootPermit || null;
  const parentStartDate = parent?.start_date ? parent.start_date.substring(0, 10) : (parent?.startDate || null);
  const parentEndDate = parent?.end_date ? parent.end_date.substring(0, 10) : (parent?.endDate || null);
  const rootStartDate = root?.start_date ? root.start_date.substring(0, 10) : (root?.startDate || null);
  const rootEndDate = root?.end_date ? root.end_date.substring(0, 10) : (root?.endDate || null);
  const currentStart = item.start_date ? item.start_date.substring(0, 10) : item.mulaiKerja;
  const currentEnd = item.end_date ? item.end_date.substring(0, 10) : item.selesaiKerja;
  const projectEndDate = item.project_end_date ? item.project_end_date.substring(0, 10) : (item.projectEndDate || currentEnd);

  const childPermits = item.child_permits || item.childPermits || [];
  const hasActiveChild = item.has_active_child_extension !== undefined
    ? Boolean(item.has_active_child_extension)
    : childPermits.some((c: any) => c.status !== 'Ditolak');

  const extensionPhase = typeof item.extension_phase === 'number' 
    ? item.extension_phase 
    : (item.request_type === 'Perpanjangan' ? 1 : 0);

  const cumulativeStartDate = rootStartDate || item.cumulative_start_date || parentStartDate || currentStart;

  // Real-time lifecycle auto-resolution: jika izin berstatus Disetujui tapi masa kerja telah selesai, status efektif adalah Selesai
  const todayStr = new Date().toLocaleDateString('en-CA'); // format: YYYY-MM-DD
  const now = new Date();
  const currentHourMinute = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const endTime = item.daily_end_time || item.jamKerjaAkhir || "23:59";
  const isPeriodEnded = Boolean(
    currentEnd && (
      currentEnd < todayStr || 
      (currentEnd === todayStr && endTime <= currentHourMinute)
    )
  );
  const effectiveStatus = (item.status === 'Disetujui' && isPeriodEnded) ? 'Selesai' : item.status;

  return {
    id: item.permit_number || `WP-${item.id}`,
    rawId: item.id,
    status: effectiveStatus,
    requestType: item.request_type || "Baru",
    extensionPhase,
    rootPermitId: item.root_permit_id || (root?.id ?? null),
    rootPermit: root ? {
      id: root.id,
      permitNumber: root.permit_number || root.permitNumber || `WP-${root.id}`,
      startDate: rootStartDate,
      endDate: rootEndDate,
      jobTitle: root.job_title || root.jobTitle || "",
    } : null,
    parentPermitId: item.parent_permit_id || item.parentPermitId || (parent?.id ?? null),
    parentPermit: parent ? {
      id: parent.id,
      permitNumber: parent.permit_number || parent.permitNumber || `WP-${parent.id}`,
      startDate: parentStartDate,
      endDate: parentEndDate,
      jobTitle: parent.job_title || parent.jobTitle || "",
      extensionPhase: parent.extension_phase ?? 0,
    } : null,
    childPermits,
    hasActiveChild,
    projectChain: item.project_chain || [],
    cumulativeStartDate,
    cumulativeEndDate: currentEnd,
    namaKontraktor: item.vendor?.company_name || item.user?.company_name || "PT Vendor",
    jenisPekerjaan: item.job_title || item.jenisPekerjaan || "Pekerjaan Vendor",
    lokasi: item.location?.name || item.lokasi || "Area Pabrik",
    mulaiKerja: item.start_date ? item.start_date.substring(0, 10) : item.mulaiKerja,
    selesaiKerja: item.end_date ? item.end_date.substring(0, 10) : item.selesaiKerja,
    projectEndDate,
    jamKerjaMulai: item.daily_start_time || item.jamKerjaMulai || "08:00",
    jamKerjaAkhir: item.daily_end_time || item.jamKerjaAkhir || "17:00",
    penanggungJawab: item.pic_name || item.penanggungJawab || "-",
    noHpPJ: item.pic_phone || item.noHpPJ || "-",
    pengawasPekerjaan: item.supervisor_name || item.pengawasPekerjaan || "-",
    noHpPengawas: item.supervisor_phone || item.noHpPengawas || "-",
    pengawasHse: item.hse_officer_name || item.pengawasHse || "-",
    noHpHse: item.hse_officer_phone || item.noHpHse || "-",
    totalTenagaKerja: item.total_workers || item.workers?.length || 0,
    permitTypes: item.permit_types ? item.permit_types.map((p: any) => typeof p === 'object' ? (p.pivot?.custom_type ? `${p.name} (${p.pivot.custom_type})` : p.name) : p) : (item.permitTypes || []),
    ppe: item.ppes ? item.ppes.map((p: any) => typeof p === 'object' ? p.name : p) : (item.ppe || []),
    workEquipment: item.equipments ? item.equipments.map((e: any) => typeof e === 'object' ? e.equipment_name : e) : (item.workEquipment || []),
    pekerja: (item.workers || item.pekerja || []).map((w: any, idx: number) => ({
      id: w.id || idx,
      nama: w.worker_name || w.nama || "-",
      jabatan: w.position || w.jabatan || "-",
      alamat: w.address || w.alamat || "-",
      id_card_photo: w.id_card_photo || w.idCardPhoto || null,
    })),
    jsa: item.jsas ? item.jsas.map((j: any) => ({
      id: j.id,
      tahapan: j.work_step || j.tahapan,
      peralatan: j.equipment_used || j.peralatan,
      potensi: j.hazard_potential || j.potensi,
      pengendalian: j.mitigation_control || j.pengendalian,
      tanggapDarurat: j.emergency_response || j.tanggapDarurat,
    })) : (item.jsa || []),
    alasanPenolakan: item.reject_reason,
    qrToken: item.qr_code_token,
    approvals: item.approvals || [],
    createdAt: item.created_at || item.createdAt,
    riskLevel: item.risk_level || item.riskLevel || "Sedang",
  };
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Menunggu PIC Vendor": 
    case "Menunggu PIC Widatra": 
    case "Menunggu HSE": 
    case "Menunggu Dept Head HRD&GA":
    case "Menunggu Head Dept HRD&GA":
    case "Menunggu Head Division HRD&GA":
    case "Menunggu GA Dept Head": 
    case "Menunggu GA Div Head": 
      return "bg-warning-container text-on-warning-container";
    case "Disetujui": return "bg-success-container text-on-success-container";
    case "Ditolak": return "bg-error-container text-on-error-container";
    case "Selesai": return "bg-blue-100 text-blue-800";
    default: return "bg-gray-100 text-gray-700";
  }
};

const canPrintPermit = (status: string) => {
  return status === "Disetujui" || status === "Selesai";
};

const isEligibleForExtension = (selesaiKerja: string, status: string, windowDays: number = 3) => {
  if (status !== "Disetujui") return false;
  if (!selesaiKerja) return false;
  const endDate = new Date(selesaiKerja);
  endDate.setHours(23, 59, 59, 999);
  const today = new Date();
  const windowDate = new Date(endDate);
  windowDate.setDate(windowDate.getDate() - windowDays);
  windowDate.setHours(0, 0, 0, 0);
  return today >= windowDate && today <= endDate;
};

export default function HistoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = auth.getUser();
  const userRole = (auth.getRole() || user?.role?.code || "").toLowerCase().trim();
  const isVendorRole = ["pemohon", "vendor", "kontraktor", "contractor"].includes((userRole || "").toLowerCase().trim());

  // Vendor role now has access to History for viewing completed/expired permits

  const filterExpiringSoon = (location.state as any)?.filterExpiringSoon === true;

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [printModalPermit, setPrintModalPermit] = useState<any>(null);
  const [showExpiringOnly, setShowExpiringOnly] = useState(filterExpiringSoon);
  const [extensionWindowDays, setExtensionWindowDays] = useState(7);

  const handleResubmit = (req: any) => {
    navigate("/create-request", { 
      state: { 
        resubmitMode: true, 
        originalId: req.rawId || req.id, 
        permitNumber: req.id,
        rejectReason: req.alasanPenolakan || req.rejectReason,
        ...req 
      } 
    });
  };

  const handleExtend = (req: any) => {
    if (req.hasActiveChild) {
      alert("Izin kerja ini sudah pernah diajukan perpanjangan ke fase berikutnya. Silakan lanjutkan dari dokumen perpanjangan terbaru.");
      return;
    }
    navigate("/create-request", {
      state: {
        extendMode: true,
        originalId: req.rawId || req.id,
        permitNumber: req.id,
        extensionPhase: req.extensionPhase,
        rootPermitId: req.rootPermitId,
        rootPermitNumber: req.rootPermit?.permitNumber || req.parentPermit?.permitNumber || req.id,
        rootStartDate: req.cumulativeStartDate || req.rootPermit?.startDate || req.mulaiKerja,
        parentPermitId: req.rawId,
        parentPermitNumber: req.id,
        ...req
      }
    });
  };

  const handleOpenPrintModal = (permit: any) => {
    if (!canPrintPermit(permit.status)) {
      alert("Dokumen Izin Kerja resmi hanya dapat dicetak setelah disetujui penuh oleh seluruh pihak berwenang (hingga HRD&GA Division Head).");
      return;
    }
    setPrintModalPermit(permit);
  };

  useEffect(() => {
    // Load extension window setting from system settings
    api.getSettings().then(sRes => {
      if (sRes?.success && sRes.data?.map?.extension_window_days) {
        setExtensionWindowDays(Number(sRes.data.map.extension_window_days) || 7);
      }
    }).catch(() => {});

    const fetchHistory = async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await api.getPermitHistory();
        if (res.success && res.data) {
          const mapped = res.data.map(mapApiToHistory);
          mapped.sort((a: any, b: any) => (b.rawId || 0) - (a.rawId || 0));
          setRequests(mapped);
        } else {
          setRequests([]);
        }
      } catch (err: any) {
        console.warn("Could not fetch history:", err.message);
        setRequests([]);
      } finally {
        if (!silent) setLoading(false);
      }
    };
    fetchHistory();

    // Background auto-polling setiap 12 detik agar tabel selalu real-time
    const pollInterval = setInterval(() => {
      fetchHistory(true);
    }, 12000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleOpenDetail = async (req: any) => {
    setSelectedRequest(req);
    try {
      const targetId = req.rawId || req.id;
      const res = await api.getPermitDetail(targetId);
      if (res.success && res.data) {
        const updated = mapApiToHistory(res.data);
        setSelectedRequest(updated);
        setRequests(prev => prev.map(item => (item.rawId || item.id) === targetId ? updated : item));
      }
    } catch (err) {
      console.warn("Could not fetch fresh permit detail:", err);
    }
  };

  // Polling real-time alur persetujuan saat modal detail terbuka
  useEffect(() => {
    if (!selectedRequest) return;
    const targetId = selectedRequest.rawId || selectedRequest.id;
    if (!targetId) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.getPermitDetail(targetId);
        if (res.success && res.data) {
          const updated = mapApiToHistory(res.data);
          setSelectedRequest(updated);
          setRequests(prev => prev.map(item => (item.rawId || item.id) === targetId ? updated : item));
        }
      } catch (err) {
        console.warn("Background detail polling error:", err);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [selectedRequest?.rawId, selectedRequest?.id]);

  // Hitung izin yang akan berakhir dalam 3 hari
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiringItems = requests.filter((req) => {
    if (req.status !== "Disetujui") return false;
    const end = new Date(req.selesaiKerja);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= extensionWindowDays;
  });

  // Filter States sesuai Foto Referensi
  const [timePeriod, setTimePeriod] = useState<"all" | "today" | "this_week" | "this_month" | "last_month" | "custom">("all");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Selesai" | "Disetujui" | "Ditolak" | "Menunggu">("ALL");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");


  // Counter badge dinamis untuk baris Status
  const statusCounts = useMemo(() => {
    const list = requests;
    return {
      all: list.length,
      disetujui: requests.filter((r) => r.status === "Disetujui").length,
      selesai: requests.filter((r) => r.status === "Selesai").length,
      pending: requests.filter((r) => r.status && r.status.startsWith("Menunggu")).length,
      ditolak: requests.filter((r) => r.status === "Ditolak").length,
    };
  }, [requests, isVendorRole]);

  // Logika Filter Data
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {

      // 1. Filter Banner Segera Berakhir jika aktif
      if (showExpiringOnly) {
        if (req.status !== "Disetujui") return false;
        const end = new Date(req.selesaiKerja);
        end.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0 || diffDays > 3) return false;
      }

      // 2. Filter Status Izin Kerja
      if (statusFilter !== "ALL") {
        if (statusFilter === "Menunggu") {
          if (!req.status || !req.status.startsWith("Menunggu")) return false;
        } else if (req.status !== statusFilter) {
          return false;
        }
      }

      // 3. Filter Periode Waktu
      const permitDate = req.mulaiKerja || (req.createdAt ? req.createdAt.substring(0, 10) : "");
      if (permitDate) {
        const pDate = new Date(permitDate);
        const pad = (n: number) => String(n).padStart(2, "0");

        if (timePeriod === "today") {
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
          const isToday = permitDate === todayStr || req.selesaiKerja === todayStr || (req.createdAt && req.createdAt.startsWith(todayStr));
          if (!isToday) return false;
        } else if (timePeriod === "this_week") {
          const now = new Date();
          const startOfWeek = new Date(now);
          const day = startOfWeek.getDay() || 7;
          startOfWeek.setDate(startOfWeek.getDate() - day + 1);
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          if (pDate < startOfWeek || pDate > endOfWeek) return false;
        } else if (timePeriod === "this_month") {
          const now = new Date();
          const thisMonthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
          if (!permitDate.startsWith(thisMonthStr) && !(req.createdAt && req.createdAt.startsWith(thisMonthStr))) {
            return false;
          }
        } else if (timePeriod === "last_month") {
          const now = new Date();
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthStr = `${lastMonth.getFullYear()}-${pad(lastMonth.getMonth() + 1)}`;
          if (!permitDate.startsWith(lastMonthStr) && !(req.createdAt && req.createdAt.startsWith(lastMonthStr))) {
            return false;
          }
        } else if (timePeriod === "custom") {
          if (customStartDate && permitDate < customStartDate) return false;
          if (customEndDate && permitDate > customEndDate) return false;
        }
      }

      // 4. Pencarian Teks
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = req.id?.toLowerCase().includes(q);
        const contractorMatch = req.namaKontraktor?.toLowerCase().includes(q);
        const jobMatch = req.jenisPekerjaan?.toLowerCase().includes(q);
        const locMatch = req.lokasi?.toLowerCase().includes(q);
        const pjMatch = req.penanggungJawab?.toLowerCase().includes(q);
        if (!idMatch && !contractorMatch && !jobMatch && !locMatch && !pjMatch) {
          return false;
        }
      }

      return true;
    });
  }, [requests, showExpiringOnly, statusFilter, timePeriod, customStartDate, customEndDate, searchQuery, today]);

  const displayedRequests = filteredRequests;

  const handleResetFilters = () => {
    setTimePeriod("all");
    setStatusFilter("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
    setSearchQuery("");
    setShowExpiringOnly(false);
  };

  const hasActiveFilters = timePeriod !== "all" || statusFilter !== "ALL" || !!customStartDate || !!customEndDate || !!searchQuery.trim() || showExpiringOnly;

  const handleExportExcel = () => {
    let periodLabel = "Semua Waktu";
    if (timePeriod === "today") periodLabel = "Hari Ini";
    else if (timePeriod === "this_week") periodLabel = "Minggu Ini";
    else if (timePeriod === "this_month") periodLabel = "Bulan Ini";
    else if (timePeriod === "last_month") periodLabel = "Bulan Lalu";
    else if (timePeriod === "custom") periodLabel = "Rentang Kustom";

    let statusLabel = "Semua Status";
    if (statusFilter === "Disetujui") statusLabel = "Habis Kontrak";
    else if (statusFilter === "Selesai") statusLabel = "Selesai";
    else if (statusFilter === "Ditolak") statusLabel = "Ditolak";

    let customRange = "";
    if (timePeriod === "custom" && (customStartDate || customEndDate)) {
      customRange = `${customStartDate || "Awal"} s.d ${customEndDate || "Akhir"}`;
    }

    exportWorkPermitsToExcel(filteredRequests, {
      periodLabel,
      statusLabel,
      customDateRange: customRange,
      searchKeyword: searchQuery.trim() || undefined,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <Header title="Riwayat" />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Riwayat Izin Kerja
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Arsip dan pencatatan seluruh riwayat izin kerja yang telah diajukan.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {loading && <span className="text-xs text-primary font-medium animate-pulse">Memuat riwayat...</span>}
            </div>
          </div>

          {/* Banner filter segera berakhir */}
          {expiringItems.length > 0 && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <AlertTriangle size={18} className="text-rose-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-rose-700">
                  {expiringItems.length} izin akan berakhir dalam 3 hari ke depan!
                </p>
                {isVendorRole && (
                  <p className="text-xs text-rose-500 mt-0.5">Segera ajukan perpanjangan sebelum izin habis masa berlakunya.</p>
                )}
              </div>
              <button
                onClick={() => setShowExpiringOnly(!showExpiringOnly)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  showExpiringOnly
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-white border border-rose-300 text-rose-600 hover:bg-rose-50"
                }`}
              >
                {showExpiringOnly ? "Tampilkan Semua" : "Lihat yang Berakhir"}
              </button>
            </div>
          )}
          {/* PANEL FILTER & EXPORT WORK PERMIT MONITORING (SESUAI FOTO REFERENSI) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
            {/* Baris 1: PERIODE WAKTU */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 tracking-wider">
                  <Calendar size={15} className="text-primary" />
                  <span>PERIODE WAKTU:</span>
                </div>
                {timePeriod !== "all" && (
                  <button
                    type="button"
                    onClick={() => { setTimePeriod("all"); setCustomStartDate(""); setCustomEndDate(""); }}
                    className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Reset Waktu</span>
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Semua Waktu */}
                <button
                  type="button"
                  onClick={() => setTimePeriod("all")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                    timePeriod === "all"
                      ? "bg-[#162f65] text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <InfinityIcon size={14} />
                  <span>Semua Waktu</span>
                </button>

                {/* Hari Ini */}
                <button
                  type="button"
                  onClick={() => setTimePeriod("today")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                    timePeriod === "today"
                      ? "bg-[#162f65] text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Calendar size={13} />
                  <span>Hari Ini</span>
                </button>

                {/* Minggu Ini */}
                <button
                  type="button"
                  onClick={() => setTimePeriod("this_week")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                    timePeriod === "this_week"
                      ? "bg-[#162f65] text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Calendar size={13} />
                  <span>Minggu Ini</span>
                </button>

                {/* Bulan Ini */}
                <button
                  type="button"
                  onClick={() => setTimePeriod("this_month")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                    timePeriod === "this_month"
                      ? "bg-[#162f65] text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Calendar size={13} />
                  <span>Bulan Ini</span>
                </button>

                {/* Bulan Lalu */}
                <button
                  type="button"
                  onClick={() => setTimePeriod("last_month")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                    timePeriod === "last_month"
                      ? "bg-[#162f65] text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <HistoryIcon size={13} />
                  <span>Bulan Lalu</span>
                </button>

                {/* Rentang Kustom */}
                <button
                  type="button"
                  onClick={() => setTimePeriod("custom")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                    timePeriod === "custom"
                      ? "bg-[#162f65] text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <CalendarRange size={13} />
                  <span>Rentang Kustom</span>
                </button>
              </div>

              {/* Form Input Rentang Kustom */}
              {timePeriod === "custom" && (
                <div className="flex items-center gap-2 pt-2 text-xs flex-wrap bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-600">Dari:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-primary font-medium"
                  />
                  <span className="font-semibold text-slate-600">Sampai:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-primary font-medium"
                  />
                  {(customStartDate || customEndDate) && (
                    <button
                      type="button"
                      onClick={() => { setCustomStartDate(""); setCustomEndDate(""); }}
                      className="text-xs text-rose-600 hover:underline font-semibold ml-2 cursor-pointer"
                    >
                      Reset Tanggal
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Baris 2: STATUS IZIN KERJA */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 tracking-wider">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  <span>STATUS IZIN KERJA:</span>
                </div>
                {statusFilter !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ALL")}
                    className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Reset Status</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Semua Status */}
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                    statusFilter === "ALL"
                      ? "bg-[#162f65] text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Layers size={13} />
                  <span>Semua Status</span>
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
                    statusFilter === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  )}>
                    {statusCounts.all}
                  </span>
                </button>

                {/* Sedang Berjalan / Proses Approval */}
                <button
                  type="button"
                  onClick={() => setStatusFilter("Menunggu")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                    statusFilter === "Menunggu"
                      ? "bg-[#162f65] text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Clock size={13} className={statusFilter === "Menunggu" ? "text-white" : "text-amber-600"} />
                  <span>Sedang Berjalan</span>
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
                    statusFilter === "Menunggu" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  )}>
                    {statusCounts.pending}
                  </span>
                </button>

                {/* Disetujui */}
                  <button
                    type="button"
                    onClick={() => setStatusFilter("Disetujui")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                      statusFilter === "Disetujui"
                        ? "bg-[#162f65] text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <ShieldCheck size={13} className={statusFilter === "Disetujui" ? "text-white" : "text-emerald-600"} />
                    <span>Disetujui</span>
                    <span className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
                      statusFilter === "Disetujui" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    )}>
                      {statusCounts.disetujui}
                    </span>
                  </button>

                {/* Selesai */}
                <button
                  type="button"
                  onClick={() => setStatusFilter("Selesai")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                    statusFilter === "Selesai"
                      ? "bg-[#162f65] text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <CheckCircle2 size={13} className={statusFilter === "Selesai" ? "text-white" : "text-blue-600"} />
                  <span>Selesai</span>
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
                    statusFilter === "Selesai" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  )}>
                    {statusCounts.selesai}
                  </span>
                </button>

                

                {/* Ditolak */}
                <button
                  type="button"
                  onClick={() => setStatusFilter("Ditolak")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                    statusFilter === "Ditolak"
                      ? "bg-[#162f65] text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <XCircle size={13} className={statusFilter === "Ditolak" ? "text-white" : "text-rose-600"} />
                  <span>Ditolak</span>
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
                    statusFilter === "Ditolak" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  )}>
                    {statusCounts.ditolak}
                  </span>
                </button>
              </div>
            </div>

            {/* Baris 3: Search Box & Tombol Export Excel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nomor izin (WP-...), kontraktor, pekerjaan, lokasi..."
                  className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-primary bg-slate-50/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-0.5"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  Menampilkan <strong>{filteredRequests.length}</strong> dari {requests.length} izin
                </span>

                {!isVendorRole && (
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer select-none"
                    title="Export Dokumen Work Permit Monitoring ke Excel (.xlsx) sesuai format whiteboard"
                  >
                    <FileSpreadsheet size={16} />
                    <span>Export Excel ({filteredRequests.length})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Table (Boxed Data Table style) */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-primary-container/20">
                  {isVendorRole ? (
                    <tr>
                      <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No. Izin</th>
                      <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Pekerjaan</th>
                      <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Lokasi</th>
                      <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                      <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">Status</th>
                      <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right whitespace-nowrap">Aksi</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-5 py-4 w-3/12 text-xs font-semibold text-gray-600 uppercase tracking-wider">ID & Pekerjaan</th>
                      <th className="px-4 py-4 w-2/12 text-xs font-semibold text-gray-600 uppercase tracking-wider">Vendor</th>
                      <th className="px-4 py-4 w-3/12 text-xs font-semibold text-gray-600 uppercase tracking-wider">Lokasi & Tanggal</th>
                      <th className="px-4 py-4 w-2/12 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">Status</th>
                      <th className="px-5 py-4 w-2/12 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right whitespace-nowrap">Aksi</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={isVendorRole ? 6 : 5} className="py-16 text-center">
                        <K3Loader size="md" text="Memuat riwayat izin kerja..." />
                      </td>
                    </tr>
                  ) : displayedRequests.length > 0 ? (
                    displayedRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                        {!isVendorRole ? (
                          <>
                            {/* 1. ID & Pekerjaan */}
                            <td className="px-5 py-4">
                              <div className="font-bold text-gray-900 font-mono text-sm">{req.id}</div>
                              {req.requestType === 'Perpanjangan' && (
                                <div className="mt-0.5 flex flex-col gap-0.5">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 w-fit" title={`Diperpanjang dari izin ${req.parentPermit?.permitNumber || req.parentPermitId}`}>
                                    Perpanjangan Ke-{req.extensionPhase || 1}
                                  </span>
                                  {req.hasActiveChild && (
                                    <span className="text-[10px] text-blue-600 font-medium">
                                      ✓ Dilanjutkan ke Fase berikutnya
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="text-gray-600 text-sm mt-0.5 line-clamp-1" title={req.jenisPekerjaan}>{req.jenisPekerjaan}</div>
                            </td>

                            {/* 2. Vendor */}
                            <td className="px-4 py-4">
                              <div className="font-semibold text-gray-900 text-sm truncate max-w-[200px]" title={req.namaKontraktor}>{req.namaKontraktor}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {(req.pekerja && req.pekerja.length) || req.totalTenagaKerja || 0} Pekerja
                              </div>
                            </td>

                            {/* 3. Lokasi & Tanggal */}
                            <td className="px-4 py-4">
                              <div className="text-gray-800 text-sm truncate max-w-[220px]" title={req.lokasi}>{req.lokasi}</div>
                              <div className="text-xs text-gray-500 mt-0.5 font-medium whitespace-nowrap">
                                {formatDateDDMMYY(req.mulaiKerja)} s/d {formatDateDDMMYY(req.selesaiKerja)}
                              </div>
                              {req.projectEndDate && req.projectEndDate > req.selesaiKerja && (
                                <div className="text-[11px] font-semibold text-blue-700 mt-0.5">
                                  Target Proyek: s/d {formatDateDDMMYY(req.projectEndDate)}
                                </div>
                              )}
                              {req.requestType === 'Perpanjangan' && req.cumulativeStartDate && (
                                <div className="text-[11px] font-semibold text-amber-700 mt-0.5 flex items-center gap-1">
                                  <span>Kumulatif: {formatDateDDMMYY(req.cumulativeStartDate)} s/d {formatDateDDMMYY(req.cumulativeEndDate)}</span>
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">
                                    {calculateInclusiveDays(req.cumulativeStartDate, req.cumulativeEndDate)} Hari
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* 4. Status */}
                            <td className="px-4 py-4 text-center whitespace-nowrap">
                              <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase inline-block", getStatusBadge(req.status))}>
                                {formatPermitStatus(req.status)}
                              </span>
                            </td>

                            {/* 5. Aksi */}
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleOpenDetail(req)}
                                  className="p-2 text-gray-400 hover:text-primary hover:bg-primary-container/50 rounded-lg transition-colors cursor-pointer" 
                                  title="Lihat Detail"
                                >
                                  <Eye size={18} />
                                </button>
                                {canPrintPermit(req.status) ? (
                                  <button 
                                    onClick={() => handleOpenPrintModal(req)}
                                    className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" 
                                    title="Cetak & Unduh Surat Izin Kerja Resmi"
                                  >
                                    <Printer size={18} />
                                  </button>
                                ) : (
                                  <button 
                                    disabled
                                    className="p-2 text-gray-300 bg-gray-50/80 rounded-lg cursor-not-allowed opacity-60" 
                                    title={`Cetak Belum Tersedia: Menunggu persetujuan (Status: ${formatPermitStatus(req.status)})`}
                                  >
                                    <Printer size={18} className="text-gray-400" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Vendor 6-Column Layout */}
                            <td className="px-5 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                              <div className="font-mono text-gray-900">{req.id}</div>
                              {req.requestType === 'Perpanjangan' && (
                                <div className="mt-1 flex flex-col gap-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200" title={`Diperpanjang dari izin ${req.parentPermit?.permitNumber || req.parentPermitId}`}>
                                    Perpanjangan Ke-{req.extensionPhase || 1}
                                  </span>
                                  {req.hasActiveChild && (
                                    <span className="text-[9px] text-blue-600 font-medium">
                                      ✓ Dilanjutkan ke Fase berikutnya
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-sm font-medium text-gray-700">{req.jenisPekerjaan}</td>
                            <td className="px-5 py-4 text-sm text-gray-500">{req.lokasi}</td>
                            <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                              <div className="font-medium text-gray-800">{formatDateDDMMYY(req.mulaiKerja)} s/d {formatDateDDMMYY(req.selesaiKerja)}</div>
                              {req.projectEndDate && req.projectEndDate > req.selesaiKerja && (
                                <div className="text-[10px] font-semibold text-blue-700 mt-0.5">
                                  Target Proyek: s/d {formatDateDDMMYY(req.projectEndDate)}
                                </div>
                              )}
                              {req.requestType === 'Perpanjangan' && req.cumulativeStartDate && (
                                <div className="text-[11px] font-semibold text-amber-700 mt-0.5 flex items-center gap-1">
                                  <span>Kumulatif: {formatDateDDMMYY(req.cumulativeStartDate)} s/d {formatDateDDMMYY(req.cumulativeEndDate)}</span>
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">
                                    {calculateInclusiveDays(req.cumulativeStartDate, req.cumulativeEndDate)} Hari
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center whitespace-nowrap">
                              <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase inline-block", getStatusBadge(req.status))}>
                                {formatPermitStatus(req.status)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                {isVendorRole && req.status === "Ditolak" && (
                                  <button
                                    onClick={() => handleResubmit(req)}
                                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Ajukan Kembali Izin Kerja Ini (Koreksi Tanggal & Kirim Ulang)"
                                  >
                                    <RotateCcw size={18} />
                                  </button>
                                )}
                                {isEligibleForExtension(req.selesaiKerja, req.status, extensionWindowDays) && !req.hasActiveChild && (
                                  <button
                                    onClick={() => handleExtend(req)}
                                    className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                    title={`Perpanjang Izin Kerja (Fase ${(req.extensionPhase || 0) + 1})`}
                                  >
                                    <CalendarPlus size={18} />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleOpenDetail(req)}
                                  className="p-2 text-gray-400 hover:text-primary hover:bg-primary-container/50 rounded-lg transition-colors cursor-pointer" 
                                  title="Lihat Detail"
                                >
                                  <Eye size={18} />
                                </button>
                                {canPrintPermit(req.status) ? (
                                  <button 
                                    onClick={() => handleOpenPrintModal(req)}
                                    className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" 
                                    title="Cetak & Unduh Surat Izin Kerja Resmi"
                                  >
                                    <Printer size={18} />
                                  </button>
                                ) : (
                                  <button 
                                    disabled
                                    className="p-2 text-gray-300 bg-gray-50/80 rounded-lg cursor-not-allowed opacity-60" 
                                    title={`Cetak Belum Tersedia: Menunggu persetujuan (Status: ${formatPermitStatus(req.status)})`}
                                  >
                                    <Printer size={18} className="text-gray-400" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isVendorRole ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                        
                        {showExpiringOnly ? (
                          <>
                            <p className="text-base font-medium text-gray-800">Tidak Ada Izin yang Segera Berakhir</p>
                            <p className="text-xs text-gray-500 mt-1">Semua izin Anda masih aman, tidak ada yang berakhir dalam 3 hari ke depan.</p>
                            <button onClick={() => setShowExpiringOnly(false)} className="mt-3 text-xs font-semibold text-primary hover:underline">
                              Tampilkan semua riwayat
                            </button>
                          </>
                        ) : hasActiveFilters ? (
                          <>
                            <p className="text-base font-medium text-gray-800">Tidak Ada Izin Kerja yang Cocok</p>
                            <p className="text-xs text-gray-500 mt-1">Tidak ada data yang sesuai dengan kombinasi periode waktu, status, atau kata kunci pencarian Anda.</p>
                            <button 
                              type="button"
                              onClick={handleResetFilters} 
                              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors cursor-pointer"
                            >
                              <RotateCcw size={12} />
                              <span>Reset Semua Filter</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <FileText size={40} className="mx-auto mb-3 opacity-20" />
                            <p className="text-base font-medium text-gray-800">Belum Ada Riwayat Izin Kerja</p>
                            <p className="text-xs text-gray-500 mt-1">Data arsip dan riwayat izin kerja akan tercatat di sini setelah pengajuan diproses.</p>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-4">
            {loading ? (
              <div className="py-14 bg-white rounded-xl border border-gray-200 flex justify-center shadow-xs">
                <K3Loader size="md" text="Memuat riwayat izin kerja..." />
              </div>
            ) : displayedRequests.length > 0 ? (
              displayedRequests.map((req) => (
                <div key={req.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400 shrink-0" />
                      <div>
                        <span className="text-sm font-bold text-gray-900 font-mono">{req.id}</span>
                        {req.requestType === 'Perpanjangan' && (
                          <div className="mt-0.5 flex flex-col gap-0.5">
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Perpanjangan Ke-{req.extensionPhase || 1}
                            </span>
                            {req.hasActiveChild && (
                              <span className="text-[9px] text-blue-600 font-medium">
                                ✓ Dilanjutkan ke Fase berikutnya
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusBadge(req.status))}>
                      {formatPermitStatus(req.status)}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 leading-tight">{req.jenisPekerjaan}</h4>
                    {!isVendorRole && req.namaKontraktor && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                        <span className="font-semibold text-gray-900">{req.namaKontraktor}</span>
                        <span>•</span>
                        <span className="text-gray-500">{(req.pekerja && req.pekerja.length) || req.totalTenagaKerja || 0} Pekerja</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{req.lokasi}</p>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs">
                      <div className="font-medium text-gray-800">{formatDateDDMMYY(req.mulaiKerja)} s/d {formatDateDDMMYY(req.selesaiKerja)}</div>
                      {req.projectEndDate && req.projectEndDate > req.selesaiKerja && (
                        <div className="text-[10px] font-semibold text-blue-700 mt-0.5">
                          Target Proyek: s/d {formatDateDDMMYY(req.projectEndDate)}
                        </div>
                      )}
                      {req.requestType === 'Perpanjangan' && req.cumulativeStartDate && (
                        <div className="text-[10px] font-semibold text-amber-700 mt-0.5">
                          Kumulatif: {formatDateDDMMYY(req.cumulativeStartDate)} s/d {formatDateDDMMYY(req.cumulativeEndDate)} ({calculateInclusiveDays(req.cumulativeStartDate, req.cumulativeEndDate)} Hari)
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isVendorRole && req.status === "Ditolak" && (
                      <button
                        onClick={() => handleResubmit(req)}
                        className="p-2 text-blue-600 hover:text-blue-700 bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Ajukan Kembali Izin Kerja Ini"
                      >
                        <RotateCcw size={18} />
                      </button>
                    )}
                      {isEligibleForExtension(req.selesaiKerja, req.status, extensionWindowDays) && !req.hasActiveChild && (
                        <button
                          onClick={() => handleExtend(req)}
                          className="p-2 text-amber-600 hover:text-amber-700 bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title={`Perpanjang Izin Kerja (Fase ${(req.extensionPhase || 0) + 1})`}
                        >
                          <CalendarPlus size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenDetail(req)}
                        className="p-2 text-gray-500 hover:text-primary bg-gray-50 hover:bg-primary-container/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>
                      {canPrintPermit(req.status) ? (
                        <button 
                          onClick={() => handleOpenPrintModal(req)}
                          className="p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Cetak Permit"
                        >
                          <Printer size={16} />
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="p-2 text-gray-300 bg-gray-50/80 rounded-lg cursor-not-allowed opacity-60"
                          title={`Cetak Belum Tersedia: Menunggu persetujuan (Status: ${formatPermitStatus(req.status)})`}
                        >
                          <Printer size={16} className="text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500 space-y-2">
                
                {showExpiringOnly ? (
                  <>
                    <p className="text-sm font-semibold text-gray-800">Tidak Ada Izin yang Segera Berakhir</p>
                    <button onClick={() => setShowExpiringOnly(false)} className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer">
                      Tampilkan semua riwayat
                    </button>
                  </>
                ) : hasActiveFilters ? (
                  <>
                    <p className="text-sm font-semibold text-gray-800">Tidak Ada Izin Kerja yang Cocok</p>
                    <p className="text-xs text-gray-400">Tidak ada data yang sesuai dengan filter periode atau status yang Anda pilih.</p>
                    <button 
                      type="button"
                      onClick={handleResetFilters} 
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>Reset Semua Filter</span>
                    </button>
                  </>
                ) : (
                  <>
                    <FileText size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-semibold text-gray-800">Belum Ada Riwayat Izin Kerja</p>
                    <p className="text-xs text-gray-400 mt-1">Data arsip dan riwayat izin kerja akan tampil di sini.</p>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* View Detail Modal - Full Screen or Large Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start sm:items-center p-4 sm:p-6 border-b border-gray-100 bg-white z-10 shrink-0">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileCheck className="text-primary" size={24} />
                    {selectedRequest.id}
                  </h3>
                  <span className={cn("inline-flex self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusBadge(selectedRequest.status))}>
                    {formatPermitStatus(selectedRequest.status)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500 mt-1">{selectedRequest.jenisPekerjaan}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="p-2 shrink-0 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/30">
              <div className="space-y-6">

                {/* 0. Alur Persetujuan Berjenjang (Sequential Workflow Stepper) */}
                <ApprovalWorkflowStepper
                  status={selectedRequest.status}
                  approvals={selectedRequest.approvals}
                  rejectReason={selectedRequest.alasanPenolakan}
                />

                {/* 0.4. Timeline Rantai Fase Proyek */}
                <ProjectPhaseTimeline
                  currentPermitId={selectedRequest.rawId || selectedRequest.id}
                  permit={selectedRequest}
                  phases={selectedRequest.projectChain?.length ? selectedRequest.projectChain : undefined}
                  rootPermitNumber={selectedRequest.rootPermit?.permitNumber || selectedRequest.parentPermit?.permitNumber || selectedRequest.id}
                  cumulativeStartDate={selectedRequest.cumulativeStartDate}
                  cumulativeEndDate={selectedRequest.cumulativeEndDate}
                />

                {/* 0.5. Info Audit Jejak Perpanjangan Izin (Khusus Tipe Perpanjangan) */}
                {selectedRequest.requestType === 'Perpanjangan' && (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                        <CalendarPlus size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-950">
                          Informasi Audit Perpanjangan Izin Kerja Ke-{selectedRequest.extensionPhase || 1}
                        </h4>
                        <p className="text-xs text-amber-800 mt-0.5">
                          Izin ini dicatat sebagai kelanjutan legal Fase {selectedRequest.extensionPhase || 1} dari proyek izin kerja.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/70 text-xs">
                      <div className="bg-white/90 p-3 rounded-lg border border-amber-200">
                        <span className="text-gray-500 block font-medium">Izin Induk & Acuan:</span>
                        <strong className="text-sm text-gray-900 block font-mono mt-0.5">
                          {selectedRequest.rootPermit?.permitNumber || selectedRequest.parentPermit?.permitNumber || "Izin Induk"}
                        </strong>
                        <span className="text-gray-500 text-[11px] block mt-1">
                          {selectedRequest.parentPermit?.permitNumber && selectedRequest.parentPermit.permitNumber !== (selectedRequest.rootPermit?.permitNumber || '')
                            ? `Fase sebelumnya: ${selectedRequest.parentPermit.permitNumber}`
                            : `Mulai Awal: ${formatDateDDMMYY(selectedRequest.cumulativeStartDate)}`}
                        </span>
                      </div>
                      <div className="bg-white/90 p-3 rounded-lg border border-amber-200">
                        <span className="text-gray-500 block font-medium">
                          Periode Aktif Fase {selectedRequest.extensionPhase || 1}:
                        </span>
                        <strong className="text-sm text-amber-900 block mt-0.5 font-mono">
                          {formatDateDDMMYY(selectedRequest.mulaiKerja)} s/d {formatDateDDMMYY(selectedRequest.selesaiKerja)}
                        </strong>
                        <span className="text-amber-800 text-[11px] font-medium block mt-1">
                          Durasi: {calculateInclusiveDays(selectedRequest.mulaiKerja, selectedRequest.selesaiKerja)} Hari Kalender (Maks. 6)
                        </span>
                      </div>
                      <div className="bg-amber-100/70 p-3 rounded-lg border border-amber-300">
                        <span className="text-amber-900 block font-bold">Rentang Kumulatif Proyek:</span>
                        <strong className="text-sm text-amber-950 block mt-0.5 font-mono">
                          {formatDateDDMMYY(selectedRequest.cumulativeStartDate)} s/d {formatDateDDMMYY(selectedRequest.cumulativeEndDate)}
                        </strong>
                        <span className="text-amber-900 font-bold text-[11px] block mt-1">
                          Total Durasi Proyek: {calculateInclusiveDays(selectedRequest.cumulativeStartDate, selectedRequest.cumulativeEndDate)} Hari Kalender
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 1. Data Vendor & Pekerjaan */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="text-primary" size={18} />
                    <h4 className="text-base font-bold text-gray-900">1. Data Vendor & Pekerjaan</h4>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                    <div><span className="block text-xs text-gray-500">Tipe Request</span><span className="font-semibold text-gray-900">{selectedRequest.requestType}</span></div>
                    <div><span className="block text-xs text-gray-500">Nama Vendor</span><span className="font-semibold text-gray-900">{selectedRequest.namaKontraktor}</span></div>
                    <div><span className="block text-xs text-gray-500">Lokasi Kerja</span><span className="font-semibold text-gray-900">{selectedRequest.lokasi}</span></div>
                    <div><span className="block text-xs text-gray-500">Tanggal Pelaksanaan</span><span className="font-semibold text-gray-900">{formatDateDDMMYY(selectedRequest.mulaiKerja)} s/d {formatDateDDMMYY(selectedRequest.selesaiKerja)}</span></div>
                    <div><span className="block text-xs text-gray-500">Jam Kerja</span><span className="font-semibold text-gray-900">{selectedRequest.jamKerjaMulai} - {selectedRequest.jamKerjaAkhir}</span></div>
                    <div><span className="block text-xs text-gray-500">Total Tenaga Kerja</span><span className="font-semibold text-gray-900">{selectedRequest.totalTenagaKerja} Orang</span></div>
                    
                    <div className="col-span-full border-t border-gray-100 pt-3 mt-1 grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs text-gray-500 font-medium">Penanggung Jawab</span>
                          <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">Vendor</span>
                        </div>
                        <span className="font-semibold text-gray-900 block">{selectedRequest.penanggungJawab}</span>
                        <span className="text-xs text-gray-500 font-mono">{selectedRequest.noHpPJ || "-"}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs text-gray-500 font-medium">Pengawas Pekerjaan</span>
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">Internal Widatra</span>
                        </div>
                        <span className="font-semibold text-gray-900 block">{selectedRequest.pengawasPekerjaan}</span>
                        <span className="text-xs text-gray-500 font-mono">{selectedRequest.noHpPengawas || "-"}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs text-gray-500 font-medium">Pengawas K3/HSE</span>
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">Internal Widatra</span>
                        </div>
                        <span className="font-semibold text-gray-900 block">{selectedRequest.pengawasHse}</span>
                        <span className="text-xs text-gray-500 font-mono">{selectedRequest.noHpHse || "-"}</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Jenis Izin & APD */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="text-primary" size={18} />
                    <h4 className="text-base font-bold text-gray-900">2. Klasifikasi Izin & Keselamatan</h4>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                    <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-gray-100">
                      <span className="block text-xs text-gray-500 mb-3">Jenis Izin Kerja (Permit Type)</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedRequest.permitTypes.map((pt: string, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-container/30 text-primary border border-primary-container rounded-lg text-xs font-medium">
                            <CheckCircle2 size={12} /> {pt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-gray-100">
                      <span className="block text-xs text-gray-500 mb-3">Alat Pelindung Diri (APD)</span>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {selectedRequest.ppe.map((item: string, i: number) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                    <div className="flex-1 p-5">
                      <span className="block text-xs text-gray-500 mb-3">Mesin / Peralatan Kerja</span>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {selectedRequest.workEquipment.map((item: string, i: number) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 3. Tenaga Kerja */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="text-primary" size={18} />
                    <h4 className="text-base font-bold text-gray-900">3. Data Tenaga Kerja</h4>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-gray-50/80">
                        <tr>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-600 border-b border-gray-200 w-12 text-center">No</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-600 border-b border-gray-200">Nama Lengkap</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-600 border-b border-gray-200">Jabatan</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-600 border-b border-gray-200">Alamat</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-600 border-b border-gray-200 text-center w-36">ID Card / Foto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedRequest.pekerja && selectedRequest.pekerja.length > 0 ? (
                          selectedRequest.pekerja.map((p: any, i: number) => (
                            <tr key={p.id || i}>
                              <td className="px-4 py-3 text-center text-gray-500">{i + 1}</td>
                              <td className="px-4 py-3 font-medium text-gray-900">{p.nama}</td>
                              <td className="px-4 py-3 text-gray-700">{p.jabatan}</td>
                              <td className="px-4 py-3 text-gray-500">{p.alamat || "-"}</td>
                              <td className="px-4 py-3 text-center">
                                {p.id_card_photo ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewPhoto(p.id_card_photo)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                                    title="Klik untuk melihat foto ID Card / KTP"
                                  >
                                    <img
                                      src={resolveImageUrl(p.id_card_photo)}
                                      alt="KTP"
                                      className="w-4 h-4 rounded object-cover border border-emerald-300 shrink-0"
                                      onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <Eye size={13} />
                                    <span>Lihat Foto</span>
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Tidak ada foto</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-gray-400 italic">
                              Tidak ada data tenaga kerja terdaftar
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 4. JSA */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="text-warning" size={18} />
                    <h4 className="text-base font-bold text-gray-900">4. Job Safety Analysis (JSA)</h4>
                  </div>
                  <div className="space-y-3">
                    {selectedRequest.jsa.map((j: any, i: number) => (
                      <div key={j.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-warning-container/20 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="font-bold text-on-warning text-xs px-2 py-0.5 bg-warning rounded">Step {i + 1}</span>
                          <span className="font-semibold text-sm text-gray-900">{j.tahapan}</span>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="block text-xs font-medium text-gray-500 mb-1">Peralatan</span>
                            <span className="text-gray-900">{j.peralatan}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-gray-500 mb-1">Potensi Bahaya</span>
                            <span className="text-error font-medium">{j.potensi}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-gray-500 mb-1">Pengendalian Bahaya</span>
                            <span className="text-success font-medium">{j.pengendalian}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-gray-500 mb-1">Tanggap Darurat</span>
                            <span className="text-gray-900">{j.tanggapDarurat}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              <div className="w-full sm:w-auto">
                {!canPrintPermit(selectedRequest.status) && (
                  <div className={cn("flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border", selectedRequest.status === "Ditolak" ? "text-rose-800 bg-rose-50 border-rose-200" : "text-amber-800 bg-amber-50 border-amber-200")}>
                    <Lock size={14} className="shrink-0 text-amber-600" />
                    {selectedRequest.status === "Ditolak" ? (
                      <span>Izin kerja ini <strong>ditolak</strong> dan tidak dapat diterbitkan sebagai dokumen resmi.</span>
                    ) : (
                      <span>Dokumen resmi baru dapat dicetak setelah disetujui penuh oleh <strong>HRD&GA Division Head</strong>.</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {selectedRequest.status === "Ditolak" && (
                  <button 
                    onClick={() => {
                      const req = selectedRequest;
                      setSelectedRequest(null);
                      handleResubmit(req);
                    }}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm whitespace-nowrap"
                    title="Ajukan kembali izin kerja ini dengan mengisi periode tanggal baru"
                  >
                    <RotateCcw size={18} /> Ajukan Kembali
                  </button>
                )}
                {isEligibleForExtension(selectedRequest.selesaiKerja, selectedRequest.status, extensionWindowDays) && !selectedRequest.hasActiveChild && (
                  <button 
                    onClick={() => {
                      const req = selectedRequest;
                      setSelectedRequest(null);
                      handleExtend(req);
                    }}
                    className="px-5 py-2.5 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                    title={`Perpanjang Izin Kerja (Masa H-${extensionWindowDays})`}
                  >
                    <CalendarPlus size={18} /> Perpanjang Izin
                  </button>
                )}
                <button 
                  onClick={() => setSelectedRequest(null)} 
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Tutup
                </button>
                {canPrintPermit(selectedRequest.status) ? (
                  <button 
                    onClick={() => handleOpenPrintModal(selectedRequest)}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <Printer size={18} /> Cetak & Unduh Permit Resmi
                  </button>
                ) : (
                  <button 
                    disabled
                    className="px-5 py-2.5 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-2 cursor-not-allowed opacity-75 whitespace-nowrap"
                    title="Izin kerja belum dapat dicetak karena belum disetujui penuh oleh HRD&GA Division Head"
                  >
                    <Lock size={16} /> {selectedRequest.status === "Ditolak" ? "Izin Ditolak (Tidak Dapat Dicetak)" : "Menunggu Approval Akhir (Terkunci)"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Permit Sheet Modal */}
      {printModalPermit && (
        <PrintPermitModal permit={printModalPermit} onClose={() => setPrintModalPermit(null)} />
      )}

      {/* Modal Preview Foto Pekerja / ID Card */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewPhoto(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                <Users className="text-primary" size={18} />
                Pratinjau Foto / ID Card Pekerja
              </h3>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center justify-center bg-gray-950/5">
              <img
                src={resolveImageUrl(previewPhoto)}
                alt="Foto ID Card Pekerja"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-md border border-gray-200"
              />
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
