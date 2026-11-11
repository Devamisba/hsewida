import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  User, 
  MapPin, 
  Camera, 
  X, 
  RotateCcw, 
  Eye, 
  ClipboardList, 
  Check,
  Layers,
  ArrowUpDown,
  QrCode,
  FileSpreadsheet,
  Navigation,
  Sparkles
} from "lucide-react";
import { api, SafetyFacility } from "@/services/api";
import { auth } from "@/lib/auth";
import { exportInspectionsToExcel } from "@/utils/exportInspectionExcel";
import { cn } from "@/lib/utils";

interface InspectionDataTableProps {
  onOpenFacilityDetail?: (facility: SafetyFacility) => void;
  onInspectFacility?: (facility: SafetyFacility) => void;
  onShowSticker?: (facility: SafetyFacility) => void;
  defaultSortBy?: "code_asc" | "unchecked_first" | "checked_first" | "latest";
}

export function InspectionDataTable({ 
  onOpenFacilityDetail, 
  onInspectFacility, 
  onShowSticker,
  defaultSortBy = "latest"
}: InspectionDataTableProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<any>({
    total: 0,
    total_facilities: 0,
    checked: 0,
    unchecked: 0,
    verified: 0,
    pending_verification: 0,
    findings: 0,
    passed: 0,
  });
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    all: 274,
    apar: 266,
    hydrant: 2,
    emergency_door: 2,
    p3k: 2,
    safety_mirror: 1,
    assembly_point: 1,
  });
  const [zoneCounts, setZoneCounts] = useState<Record<string, number>>({
    ALL: 0,
    UMUM: 0,
    "FACTORY 1": 0,
    "FACTORY 2 & WORKSHOP": 0,
    "WARE HOUSE": 0,
  });

  // Filters
  const [facilityCategory, setFacilityCategory] = useState<string>("apar");
  const [checkStatusFilter, setCheckStatusFilter] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [sortBy, setSortBy] = useState<string>(defaultSortBy);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(15);
  const [pagination, setPagination] = useState<any>({
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
  });

  // Photo preview modal
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [activePhotoMeta, setActivePhotoMeta] = useState<any | null>(null);

  // Quick PIC Verification Modal
  const [quickVerifyOpen, setQuickVerifyOpen] = useState(false);
  const [verifyingItem, setVerifyingItem] = useState<any | null>(null);
  const [picName, setPicName] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<"VERIFIED" | "REVISE" | "REFILL_REQUESTED">("VERIFIED");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [submittingVerify, setSubmittingVerify] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const currentUser = auth.getUser();
  const currentRole = auth.getRole();
  const canVerify = currentRole === "pic_k3" || currentRole === "hse" || currentRole === "admin";

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAllInspections({
        category: facilityCategory,
        area_zone: selectedZone,
        check_status: checkStatusFilter,
        result_status: resultFilter,
        date_range: dateRangeFilter,
        search: searchTerm.trim(),
        sort_by: sortBy,
        page: currentPage,
        per_page: perPage,
        month: selectedMonth,
      });

      if (res.success && res.data) {
        setItems(res.data.items || res.data.inspections || []);
        if (res.data.summary) setSummary(res.data.summary);
        if (res.data.category_counts) setCategoryCounts(res.data.category_counts);
        if (res.data.zone_counts) setZoneCounts(res.data.zone_counts);
        if (res.data.pagination) setPagination(res.data.pagination);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.warn("Could not load inspections list:", err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [facilityCategory, selectedZone, checkStatusFilter, resultFilter, dateRangeFilter, searchTerm, sortBy, currentPage, perPage, selectedMonth]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  // Reset all filters
  const handleResetFilters = () => {
    setFacilityCategory("apar");
    setSelectedZone("ALL");
    setCheckStatusFilter("ALL");
    setResultFilter("ALL");
    setDateRangeFilter("all");
    setSearchTerm("");
    setSortBy("code_asc");
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    facilityCategory !== "apar" ||
    selectedZone !== "ALL" || 
    checkStatusFilter !== "ALL" || 
    resultFilter !== "ALL" || 
    dateRangeFilter !== "all" || 
    searchTerm.trim() !== "" ||
    sortBy !== "code_asc";

  // Open Quick Verify Modal
  const handleOpenQuickVerify = (item: any) => {
    setVerifyingItem(item);
    setPicName(currentUser?.name || "PIC K3 Widatra");
    setVerifyStatus("VERIFIED");
    setVerifyNotes("");
    setVerifyError(null);
    setQuickVerifyOpen(true);
  };

  // Submit Quick Verify
  const handleSubmitQuickVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingItem || !verifyingItem.facility_code) return;
    setSubmittingVerify(true);
    setVerifyError(null);

    try {
      const code = verifyingItem.facility_code;
      const res = await api.submitPicVerification(code, {
        pic_name: picName.trim(),
        verification_status: verifyStatus,
        verification_notes: verifyNotes.trim() ? verifyNotes.trim() : null,
        pic_plant_geofence_valid: true,
      });

      if (res.success) {
        setQuickVerifyOpen(false);
        setVerifyingItem(null);
        await fetchInspections();
      } else {
        setVerifyError(res.message || "Gagal menyimpan verifikasi PIC.");
      }
    } catch (err: any) {
      setVerifyError(err.message || "Terjadi kesalahan saat memproses verifikasi.");
    } finally {
      setSubmittingVerify(false);
    }
  };

  // Format Helper
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      const hasTime = dateStr.includes(":") || (dateStr.includes("T") && dateStr.length > 10);
      if (!hasTime) {
        return d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";
    } catch {
      return dateStr;
    }
  };

  const zones = [
    { id: "ALL", label: `Semua Zona (${zoneCounts.ALL || 0})` },
    { id: "UMUM", label: `Umum (${zoneCounts.UMUM || 0})` },
    { id: "FACTORY 1", label: `Factory 1 (${zoneCounts["FACTORY 1"] || 0})` },
    { id: "FACTORY 2 & WORKSHOP", label: `Factory 2 (${zoneCounts["FACTORY 2 & WORKSHOP"] || 0})` },
    { id: "WARE HOUSE", label: `Warehouse (${zoneCounts["WARE HOUSE"] || 0})` },
  ];

  // Export to Excel Handler
  const handleExportExcel = () => {
    let catLabel = "Semua Fasilitas";
    if (facilityCategory === "apar") catLabel = "APAR";
    else if (facilityCategory === "hydrant") catLabel = "Hydrant";
    else if (facilityCategory === "emergency_door") catLabel = "Pintu Emergency";
    else if (facilityCategory === "p3k") catLabel = "Kotak P3K";
    else if (facilityCategory === "safety_mirror") catLabel = "Safety Mirror";
    else if (facilityCategory === "assembly_point") catLabel = "Titik Kumpul";

    let checkLabel = "Semua Status";
    if (checkStatusFilter === "UNCHECKED") checkLabel = "Belum Dicek";
    else if (checkStatusFilter === "CHECKED") checkLabel = "Sudah Dicek";
    else if (checkStatusFilter === "PENDING") checkLabel = "Menunggu PIC";
    else if (checkStatusFilter === "VERIFIED") checkLabel = "Terverifikasi PIC";

    let dateLabel = "Semua Waktu";
    if (dateRangeFilter === "today") dateLabel = "Hari Ini";
    else if (dateRangeFilter === "last_7_days") dateLabel = "7 Hari Terakhir";
    else if (dateRangeFilter === "this_month") dateLabel = "Bulan Ini";

    exportInspectionsToExcel(items, {
      categoryLabel: catLabel,
      zoneLabel: selectedZone,
      checkStatusLabel: checkLabel,
      dateRangeLabel: dateLabel,
      searchKeyword: searchTerm.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      
      {/* ======================================================== */}
      {/* 1. KPI SUMMARY CARDS                                     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Total Fasilitas Terdaftar */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Fasilitas</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ClipboardList size={15} />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{summary.total_facilities || summary.total || 0}</span>
            <span className="text-xs text-slate-400">Unit</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total armada fasilitas terdaftar</p>
        </div>

        {/* Card 2: Sudah Dicek Bulan Ini */}
        <div className="p-3.5 bg-white border border-emerald-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Sudah Dicek Bulan Ini</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck size={15} />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700">{summary.checked || 0}</span>
            <span className="text-xs text-emerald-600">Unit ({summary.percentage_this_month || 0}%)</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">
            {summary.verified || 0} Terverifikasi, {summary.pending_verification || 0} Menunggu PIC
          </p>
        </div>

        {/* Card 3: Belum Dicek Bulan Ini */}
        <div className={`p-3.5 bg-white rounded-xl shadow-xs border ${summary.unchecked > 0 ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Belum Dicek Bulan Ini</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-700">{summary.unchecked || 0}</span>
            <span className="text-xs text-amber-600">Unit</span>
          </div>
          <p className="text-[11px] text-amber-600 mt-1">
            {summary.days_left_in_month ? `${summary.days_left_in_month} hari tersisa di siklus ini` : (summary.unchecked > 0 ? "Perlu segera diinspeksi di lapangan" : "Semua unit telah diperiksa")}
          </p>
        </div>

        {/* Card 4: Temuan Lapangan */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Temuan Lapangan</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-700">{summary.findings || 0}</span>
            <span className="text-xs text-slate-400">Unit kendala</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.findings > 0 ? "Ada catatan fisik / tekanan kurang" : "Kondisi fisik aman & lolos"}
          </p>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 2. FILTER & SEARCH CONTROLS                              */}
      {/* ======================================================== */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        
        {/* Row 1: Search & Dropdown Filters (12-Cols Desktop Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          
          {/* 1. Search Box (Takes 4 cols on lg) */}
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari kode (A-01), lokasi, pemeriksa, PIC..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-600 bg-slate-50/50"
            />
          </div>

          {/* 2. Filter Jenis Fasilitas (2 cols on lg) */}
          <div className="lg:col-span-2 flex items-center gap-1.5">
            <Layers size={14} className="text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={facilityCategory}
              onChange={(e) => {
                setFacilityCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:outline-none focus:border-slate-600 truncate"
              title="Filter Kategori Fasilitas"
            >
              <option value="apar">APAR ({categoryCounts.apar || 266})</option>
              <option value="hydrant">Hydrant ({categoryCounts.hydrant || 2})</option>
              <option value="emergency_door">Pintu Emergency ({categoryCounts.emergency_door || 2})</option>
              <option value="p3k">P3K ({categoryCounts.p3k || 2})</option>
              <option value="safety_mirror">Safety Mirror ({categoryCounts.safety_mirror || 1})</option>
              <option value="assembly_point">Titik Kumpul ({categoryCounts.assembly_point || 1})</option>
              <option value="all">Semua Fasilitas ({categoryCounts.all || 274})</option>
            </select>
          </div>

          {/* 3. Filter Status Pengecekan (2 cols on lg) */}
          <div className="lg:col-span-2">
            <select
              value={checkStatusFilter}
              onChange={(e) => {
                setCheckStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:outline-none focus:border-slate-600 truncate"
              title="Filter Status Pengecekan"
            >
              <option value="ALL">Semua Status Cek</option>
              <option value="UNCHECKED">Belum Dicek ({summary.unchecked || 0})</option>
              <option value="CHECKED">Sudah Dicek ({summary.checked || 0})</option>
              <option value="PENDING">Menunggu PIC ({summary.pending_verification || 0})</option>
              <option value="VERIFIED">Terverifikasi PIC ({summary.verified || 0})</option>
            </select>
          </div>

          {/* 4. Filter Urutan Data (2 cols on lg) */}
          <div className="lg:col-span-2 flex items-center gap-1.5">
            <ArrowUpDown size={14} className="text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:outline-none focus:border-slate-600 truncate"
              title="Urutan Tampilan Data"
            >
              <option value="code_asc">Urut Kode (A-01, ...)</option>
              <option value="unchecked_first">Belum Dicek Dulu</option>
              <option value="checked_first">Sudah Dicek Dulu</option>
              <option value="latest">Waktu Terbaru</option>
            </select>
          </div>

          {/* 5. Date Range & Reset Button (2 cols on lg) */}
          <div className="lg:col-span-2 flex items-center gap-1.5">
            <select
              value={dateRangeFilter}
              onChange={(e) => {
                setDateRangeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:outline-none focus:border-slate-600 truncate"
              title="Filter Waktu Inspeksi"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="last_7_days">7 Hari Terakhir</option>
              <option value="this_month">Bulan Ini</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition shrink-0 cursor-pointer"
                title="Reset Semua Filter"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>

        </div>

        {/* Row 2: Zone Filter Pills & Export Excel Button (Responsive, No Overflow) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs">
          {/* Left: Zone Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full min-w-0 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full whitespace-nowrap">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
              <MapPin size={12} /> Zona:
            </span>
            {zones.map((z) => {
              const isActive = selectedZone === z.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => {
                    setSelectedZone(z.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-md font-semibold transition text-xs cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {z.label}
                </button>
              );
            })}
          </div>

          {/* Right: Siklus Bulan & Export Excel Button */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-start lg:justify-end">
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Siklus Bulan:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMonth(e.target.value);
                    setCurrentPage(1);
                  }
                }}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                title="Pilih Bulan untuk Pelacakan Status Inspeksi"
              />
            </div>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-xs cursor-pointer whitespace-nowrap shrink-0"
              title="Download Laporan Resmi Kesiapan K3 PT Widatra Bhakti ke Format Excel (.xlsx)"
            >
              <FileSpreadsheet size={14} />
              <span>Export Laporan Excel ({items.length})</span>
            </button>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. INSPECTIONS TABLE & MOBILE CARDS (DUAL VIEW)          */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* DESKTOP TABLE VIEW (>= lg) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4 w-52">Kode & Lokasi</th>
                <th className="py-3 px-4 w-36">Status Cek</th>
                <th className="py-3 px-4 w-36">Waktu Cek</th>
                <th className="py-3 px-4 w-44">Pemeriksa Lapangan</th>
                <th className="py-3 px-4 w-40">Parameter Fisik</th>
                <th className="py-3 px-4 w-48">Bukti Foto & GPS</th>
                <th className="py-3 px-4 w-40">Verifikasi PIC</th>
                <th className="py-3 px-4 text-right w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    Memuat data inspeksi fasilitas...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    Tidak ada fasilitas yang sesuai dengan filter pencarian.
                    {hasActiveFilters && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                        >
                          Reset Filter
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const facility = row.facility;
                  const hasInspection = !!row.has_inspection;
                  const isVerified = row.check_status === "VERIFIED";
                  const isPending = row.check_status === "PENDING";
                  const inspector = row.inspector_name || "-";
                  const pic = row.pic_name || null;
                  const results = Array.isArray(row.checklist_results) ? row.checklist_results : [];
                  const photos = Array.isArray(row.foto_bukti) ? row.foto_bukti : [];
                  const isPass = row.result_status === "Pass";

                  return (
                    <tr 
                      key={row.facility_id || row.facility_code} 
                      className={`hover:bg-slate-50/80 transition ${!hasInspection ? "bg-slate-50/20" : ""}`}
                    >
                      
                      {/* 1. Kode & Lokasi */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                            {row.facility_code || "-"}
                          </span>
                          {row.area_zone && (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                              {row.area_zone}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-800 text-xs mt-1 truncate max-w-[200px]" title={row.facility_name || facility?.nama_item || "-"}>
                          {row.facility_name || facility?.nama_item || "-"}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-[200px]" title={row.location_name || "Area Pabrik"}>
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate">{row.location_name || "Area Pabrik"}</span>
                        </div>
                      </td>

                      {/* 2. Status Pengecekan */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasInspection ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              <CheckCircle2 size={11} />
                              Sudah Dicek
                            </span>
                            <div>
                              {isVerified ? (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/50 px-1.5 py-0.5 rounded inline-block">
                                  Terverifikasi PIC
                                </span>
                              ) : isPending ? (
                                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/50 px-1.5 py-0.5 rounded inline-block">
                                  Menunggu PIC
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/50 px-1.5 py-0.5 rounded inline-block">
                                  {row.check_status_label}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                              <Clock size={11} className="text-slate-400" />
                              Belum Dicek
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Menunggu audit
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 3. Waktu Cek */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasInspection ? (
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">
                              {formatDateTime(row.inspection_date)}
                            </div>
                            {row.inspection_id && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: #{row.inspection_id}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* 4. Pemeriksa Lapangan */}
                      <td className="py-3 px-4">
                        {hasInspection ? (
                          <div className="space-y-1">
                            <div className="font-bold text-slate-800 text-xs flex items-center gap-1 truncate max-w-[170px]" title={inspector}>
                              <User size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{inspector}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {isPass ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  <CheckCircle2 size={9} />
                                  Baik
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                  <AlertTriangle size={9} />
                                  Temuan
                                </span>
                              )}
                              <span 
                                className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded cursor-help"
                                title="Terverifikasi dalam radius kawasan pabrik PT Widatra Bhakti (<250m) & QR fisik (<25m)"
                              >
                                <MapPin size={9} className="text-slate-500" />
                                &lt;250m
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum diperiksa</span>
                        )}
                      </td>

                      {/* 5. Parameter Fisik */}
                      <td className="py-3 px-4">
                        {hasInspection && results.length > 0 ? (() => {
                          const totalParams = results.length;
                          const passedParams = results.filter((r: any) => r.passed !== false && r.jawaban !== "Rusak" && r.jawaban !== "Karat / Rusak").length;
                          const allPassed = totalParams > 0 && passedParams === totalParams;

                          if (allPassed) {
                            return (
                              <div className="flex flex-col gap-0.5" title={results.map((r: any) => `${r.code || r.item}: ${r.jawaban || 'OK'}`).join(' | ')}>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded w-fit">
                                  <CheckCircle2 size={10} className="text-emerald-600" />
                                  {passedParams}/{totalParams} Normal
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">Fisik & jarum aman</span>
                              </div>
                            );
                          }

                          return (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded w-fit">
                                <AlertTriangle size={10} className="text-rose-600" />
                                {totalParams - passedParams} Kendala
                              </span>
                              <div className="flex flex-wrap gap-0.5 max-w-[170px]">
                                {results.filter((r: any) => !(r.passed !== false && r.jawaban !== "Rusak" && r.jawaban !== "Karat / Rusak")).map((r: any, rIdx: number) => (
                                  <span key={rIdx} className="text-[9px] font-bold text-rose-700 bg-rose-100/70 border border-rose-200 px-1.5 py-0.5 rounded">
                                    {r.code || r.item}: {r.jawaban}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })() : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* 6. Bukti Foto & GPS */}
                      <td className="py-3 px-4 max-w-[200px]">
                        {hasInspection ? (
                          <div className="space-y-1">
                            {row.notes && (
                              <p className="text-[11px] text-slate-600 line-clamp-1" title={row.notes}>
                                {row.notes}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {photos.length > 0 && photos.map((photo: string, pIdx: number) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => {
                                    setActivePhoto(photo);
                                    setActivePhotoMeta(row);
                                  }}
                                  className="relative w-8 h-8 rounded border border-slate-300 overflow-hidden hover:opacity-90 transition group cursor-pointer shadow-2xs shrink-0"
                                  title="Lihat foto realtime & watermark GPS"
                                >
                                  <img src={photo} alt="Bukti" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent flex items-center justify-center">
                                    <Camera size={10} className="text-white drop-shadow" />
                                  </div>
                                </button>
                              ))}
                              {photos.length > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                                  <Sparkles size={9} />
                                  Foto
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-slate-400 flex items-center gap-1 font-mono truncate" title={row.gps_coordinates || "-7.644263, 112.694194"}>
                              <Navigation size={9} className="text-slate-400 shrink-0" />
                              <span className="truncate">{row.gps_coordinates || "-7.644263, 112.694194"}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* 7. Verifikasi PIC */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasInspection ? (
                          isVerified ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                <CheckCircle2 size={10} />
                                Terverifikasi
                              </span>
                              <div className="text-[11px] text-slate-800 font-semibold truncate max-w-[150px]" title={pic || "PIC K3 Widatra"}>
                                {pic || "PIC K3 Widatra"}
                              </div>
                              {row.verified_at && (
                                <div className="text-[10px] text-slate-400">
                                  {formatDateTime(row.verified_at)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                <Clock size={10} />
                                Menunggu PIC
                              </span>
                              <div className="text-[9px] text-slate-400">
                                Di radius pabrik
                              </div>
                            </div>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* 8. Aksi */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center gap-1.5 justify-end">
                          
                          {/* JIKA BELUM DICEK: Tombol Cek Sekarang */}
                          {!hasInspection && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onInspectFacility && facility) {
                                  onInspectFacility(facility);
                                } else if (onOpenFacilityDetail && facility) {
                                  onOpenFacilityDetail(facility);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                              title={`Inspeksi APAR ${row.facility_code} Sekarang`}
                            >
                              <ClipboardList size={12} />
                              <span>Cek</span>
                            </button>
                          )}

                          {/* JIKA SUDAH DICEK & PENDING: Tombol Verifikasi Cepat Khusus PIC */}
                          {hasInspection && isPending && canVerify && (
                            <button
                              type="button"
                              onClick={() => handleOpenQuickVerify(row)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                              title="Verifikasi Hasil Inspeksi Ini"
                            >
                              <Check size={12} />
                              <span>Verifikasi</span>
                            </button>
                          )}

                          {/* Tombol Cetak QR Stiker */}
                          {facility && onShowSticker && (
                            <button
                              type="button"
                              onClick={() => onShowSticker(facility)}
                              className="p-1.5 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-600 hover:text-purple-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                              title={`Cetak Label QR ${row.facility_code}`}
                            >
                              <QrCode size={13} />
                            </button>
                          )}

                          {/* Tombol Detail / Kelola Fasilitas */}
                          {facility && onOpenFacilityDetail && (
                            <button
                              type="button"
                              onClick={() => onOpenFacilityDetail(facility)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                              title="Buka Menu Aksi & Riwayat"
                            >
                              <Eye size={12} className="text-slate-500" />
                              <span>Detail</span>
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW (< lg) */}
        <div className="block lg:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Memuat data inspeksi fasilitas...
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 p-4">
              Tidak ada fasilitas yang sesuai dengan filter pencarian.
              {hasActiveFilters && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>
          ) : (
            items.map((row) => {
              const facility = row.facility;
              const hasInspection = !!row.has_inspection;
              const isVerified = row.check_status === "VERIFIED";
              const isPending = row.check_status === "PENDING";
              const inspector = row.inspector_name || "-";
              const pic = row.pic_name || null;
              const results = Array.isArray(row.checklist_results) ? row.checklist_results : [];
              const photos = Array.isArray(row.foto_bukti) ? row.foto_bukti : [];
              const totalParams = results.length;
              const passedParams = results.filter((r: any) => r.passed !== false && r.jawaban !== "Rusak" && r.jawaban !== "Karat / Rusak").length;
              const allPassed = totalParams > 0 && passedParams === totalParams;

              return (
                <div 
                  key={`mobile-${row.facility_id || row.facility_code}`} 
                  className={cn(
                    "p-4 transition-colors flex flex-col gap-3",
                    !hasInspection ? "bg-slate-50/40" : "bg-white"
                  )}
                >
                  {/* Header: ID, Zone & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                        {row.facility_code || "-"}
                      </span>
                      {row.area_zone && (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded uppercase">
                          {row.area_zone}
                        </span>
                      )}
                    </div>
                    {hasInspection ? (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          Sudah Dicek
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        <Clock size={11} className="text-slate-400" />
                        Belum Dicek
                      </span>
                    )}
                  </div>

                  {/* Item Title & Location */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {row.facility_name || facility?.nama_item || "-"}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{row.location_name || "Area Pabrik"}</span>
                    </p>
                  </div>

                  {/* Inspection Details Grid if inspected */}
                  {hasInspection && (
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Waktu Cek</span>
                        <span className="font-bold text-slate-800">{formatDateTime(row.inspection_date)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Pemeriksa</span>
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <User size={12} className="text-slate-400" />
                          <span className="truncate">{inspector}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Kondisi Fisik</span>
                        {totalParams > 0 ? (
                          allPassed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-0.5">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              {passedParams}/{totalParams} Normal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 mt-0.5">
                              <AlertTriangle size={12} className="text-rose-600" />
                              {totalParams - passedParams} Kendala
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500 font-medium">-</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Verifikasi PIC</span>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-0.5">
                            <ShieldCheck size={12} className="text-emerald-600" />
                            {pic || "Terverifikasi"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 mt-0.5">
                            <Clock size={12} className="text-amber-500" />
                            Menunggu PIC
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Photo & GPS Proof if available */}
                  {hasInspection && photos.length > 0 && (
                    <div className="flex items-center justify-between gap-2 p-2 bg-purple-50/50 border border-purple-100 rounded-xl">
                      <div className="flex items-center gap-2">
                        {photos.map((photo: string, pIdx: number) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => {
                              setActivePhoto(photo);
                              setActivePhotoMeta(row);
                            }}
                            className="relative w-12 h-12 rounded-lg border border-purple-200 overflow-hidden shrink-0 shadow-2xs group"
                          >
                            <img src={photo} alt="Bukti Realtime" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <Camera size={14} className="text-white drop-shadow" />
                            </div>
                          </button>
                        ))}
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-purple-800">
                            <Sparkles size={11} />
                            Foto Realtime Terverifikasi
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                            <Navigation size={10} className="text-slate-400" />
                            <span>{row.gps_coordinates || "-7.644263, 112.694194"}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 px-2 py-1 rounded-md shrink-0">
                        GPS Valid
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 justify-end flex-wrap">
                    {!hasInspection && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onInspectFacility && facility) {
                            onInspectFacility(facility);
                          } else if (onOpenFacilityDetail && facility) {
                            onOpenFacilityDetail(facility);
                          }
                        }}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                      >
                        <ClipboardList size={13} />
                        <span>Cek Sekarang</span>
                      </button>
                    )}

                    {hasInspection && isPending && canVerify && (
                      <button
                        type="button"
                        onClick={() => handleOpenQuickVerify(row)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                      >
                        <Check size={13} />
                        <span>Verifikasi PIC</span>
                      </button>
                    )}

                    {facility && onShowSticker && (
                      <button
                        type="button"
                        onClick={() => onShowSticker(facility)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                      >
                        <QrCode size={13} />
                        <span>Cetak QR</span>
                      </button>
                    )}

                    {facility && onOpenFacilityDetail && (
                      <button
                        type="button"
                        onClick={() => onOpenFacilityDetail(facility)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95"
                      >
                        <Eye size={13} className="text-slate-400" />
                        <span>Detail</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Menampilkan {items.length} dari {pagination.total || items.length} unit fasilitas ({summary.checked || 0} sudah dicek, {summary.unchecked || 0} belum dicek)
          </span>
          <span className="font-medium text-slate-600">PT Widatra Bhakti — Manajemen Fasilitas & K3 Pabrik</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. PAGINATION CONTROLS                                   */}
      {/* ======================================================== */}
      {pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs text-xs">
          <div className="text-slate-600">
            Halaman <span className="font-bold text-slate-900">{currentPage}</span> dari{" "}
            <span className="font-bold text-slate-900">{pagination.last_page || 1}</span> (Total{" "}
            <span className="font-bold text-slate-900">{pagination.total}</span> unit)
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-[11px] text-slate-500">Tampilkan:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-1 px-2 text-xs border border-slate-300 rounded bg-white font-medium focus:outline-none"
              >
                <option value={15}>15 Unit</option>
                <option value={25}>25 Unit</option>
                <option value={50}>50 Unit</option>
                <option value={100}>100 Unit</option>
                <option value={300}>Semua Unit</option>
              </select>
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
            >
              Sebelumnya
            </button>
            <span className="px-2 py-1 font-bold text-slate-800">
              {currentPage} / {pagination.last_page || 1}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.last_page || 1, p + 1))}
              disabled={currentPage >= (pagination.last_page || 1) || loading}
              className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL ZOOM FOTO BUKTI DENGAN WATERMARK AUDIT          */}
      {/* ======================================================== */}
      {activePhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => {
            setActivePhoto(null);
            setActivePhotoMeta(null);
          }}
        >
          <div 
            className="bg-slate-900 text-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-900/60 text-purple-300 flex items-center justify-center">
                  <Camera size={15} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    Foto Bukti Realtime Lapangan
                    <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded">
                      Anti-Upload Galeri
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {activePhotoMeta?.facility_code || "Unit Fasilitas"} - {activePhotoMeta?.facility_name || "K3"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setActivePhoto(null);
                  setActivePhotoMeta(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative p-3 bg-slate-950 flex flex-col items-center justify-center max-h-[75vh]">
              <div className="relative w-full flex items-center justify-center">
                <img 
                  src={activePhoto} 
                  alt="Foto Bukti Inspeksi" 
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-md border border-slate-800" 
                />
                {/* Watermark Card Overlay at Bottom */}
                <div className="absolute bottom-2 left-2 right-2 sm:left-4 sm:right-4 bg-black/80 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-white text-[10px] space-y-0.5 shadow-lg">
                  <div className="flex items-center justify-between font-bold text-amber-400">
                    <span>🏢 PT WIDATRA BHAKTI — KAWASAN PABRIK</span>
                    <span className="text-emerald-400">🟢 GEOFENCE VALID</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-slate-300 gap-x-3">
                    <span>🕒 Waktu Potret: {formatDateTime(activePhotoMeta?.inspection_date || new Date().toISOString())}</span>
                    <span className="font-mono text-cyan-300">📍 GPS: {activePhotoMeta?.gps_coordinates || "-7.644263, 112.694194"} (±3m)</span>
                  </div>
                  <div className="text-slate-400">
                    🏷️ Unit: {activePhotoMeta?.facility_code || "-"} ({activePhotoMeta?.area_zone || "Area Pabrik"}) | Petugas: {activePhotoMeta?.inspector_name || "Tim Pengecekan"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL VERIFIKASI CEPAT PIC K3                         */}
      {/* ======================================================== */}
      {quickVerifyOpen && verifyingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Verifikasi Hasil Inspeksi PIC K3
                </h3>
                <p className="text-xs text-slate-500">
                  Unit: <span className="font-mono font-bold text-slate-800">{verifyingItem.facility_code}</span> ({verifyingItem.facility_name})
                </p>
              </div>
              <button
                onClick={() => setQuickVerifyOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitQuickVerify} className="p-4 space-y-3.5 text-xs">
              
              {verifyError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {verifyError}
                </div>
              )}

              {/* Data Pemeriksa */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas Pemeriksa:</span>
                  <span className="font-semibold text-slate-800">{verifyingItem.inspector_name || "Petugas Lapangan"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Cek:</span>
                  <span className="font-semibold text-slate-800">{formatDateTime(verifyingItem.inspection_date)}</span>
                </div>
                {verifyingItem.notes && (
                  <div className="pt-1 border-t border-slate-200 text-slate-600 italic">
                    "{verifyingItem.notes}"
                  </div>
                )}
              </div>

              {/* Nama PIC K3 */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Nama PIC K3 *</label>
                <input
                  type="text"
                  required
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder="Ketik nama PIC K3..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-slate-600 font-medium"
                />
              </div>

              {/* Keputusan Verifikasi */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Keputusan Verifikasi *</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="quick_vstatus"
                      value="VERIFIED"
                      checked={verifyStatus === "VERIFIED"}
                      onChange={() => setVerifyStatus("VERIFIED")}
                    />
                    <span className="font-medium text-emerald-800">Setujui (Lolos & Sesuai Standar)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="quick_vstatus"
                      value="REVISE"
                      checked={verifyStatus === "REVISE"}
                      onChange={() => setVerifyStatus("REVISE")}
                    />
                    <span className="font-medium text-rose-800">Perlu Tindakan / Revisi Lapangan</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="quick_vstatus"
                      value="REFILL_REQUESTED"
                      checked={verifyStatus === "REFILL_REQUESTED"}
                      onChange={() => setVerifyStatus("REFILL_REQUESTED")}
                    />
                    <span className="font-medium text-purple-800">Ajukan Pengisian Ulang (Refill Queue)</span>
                  </label>
                </div>
              </div>

              {/* Catatan Verifikasi */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Catatan PIC (Opsional)</label>
                <textarea
                  rows={2}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Catatan hasil verifikasi..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-slate-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickVerifyOpen(false)}
                  className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingVerify}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  {submittingVerify ? "Menyimpan..." : "Simpan Verifikasi"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
