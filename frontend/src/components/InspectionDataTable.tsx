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
  QrCode
} from "lucide-react";
import { api, SafetyFacility } from "@/services/api";
import { auth } from "@/lib/auth";

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
  const [sortBy, setSortBy] = useState<string>(defaultSortBy);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(50);
  const [pagination, setPagination] = useState<any>({
    total: 0,
    per_page: 50,
    current_page: 1,
    last_page: 1,
  });

  // Photo preview modal
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

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
  }, [facilityCategory, selectedZone, checkStatusFilter, resultFilter, dateRangeFilter, searchTerm, sortBy, currentPage, perPage]);

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
        verification_notes: verifyNotes.trim() || undefined,
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

        {/* Card 2: Sudah Dicek */}
        <div className="p-3.5 bg-white border border-emerald-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Sudah Dicek</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck size={15} />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700">{summary.checked || 0}</span>
            <span className="text-xs text-emerald-600">Unit</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">
            {summary.verified || 0} Terverifikasi, {summary.pending_verification || 0} Menunggu PIC
          </p>
        </div>

        {/* Card 3: Belum Dicek (Pending Audit) */}
        <div className={`p-3.5 bg-white rounded-xl shadow-xs border ${summary.unchecked > 0 ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Belum Dicek</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-700">{summary.unchecked || 0}</span>
            <span className="text-xs text-amber-600">Unit</span>
          </div>
          <p className="text-[11px] text-amber-600 mt-1">
            {summary.unchecked > 0 ? "Perlu segera diinspeksi di lapangan" : "Semua unit telah diperiksa"}
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
        
        {/* Row 1: Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          
          {/* 1. Search Box (Takes 2 cols on lg) */}
          <div className="relative sm:col-span-2">
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

          {/* 2. Filter Jenis Fasilitas (BARU) */}
          <div className="flex items-center gap-1.5">
            <Layers size={14} className="text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={facilityCategory}
              onChange={(e) => {
                setFacilityCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:outline-none focus:border-slate-600"
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

          {/* 3. Filter Status Pengecekan (Sudah vs Belum) */}
          <select
            value={checkStatusFilter}
            onChange={(e) => {
              setCheckStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2 px-2.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:outline-none focus:border-slate-600"
            title="Filter Status Pengecekan"
          >
            <option value="ALL">Semua Status Cek</option>
            <option value="UNCHECKED">Belum Dicek ({summary.unchecked || 0})</option>
            <option value="CHECKED">Sudah Dicek ({summary.checked || 0})</option>
            <option value="PENDING">Menunggu PIC ({summary.pending_verification || 0})</option>
            <option value="VERIFIED">Terverifikasi PIC ({summary.verified || 0})</option>
          </select>

          {/* 4. Filter Urutan Data (Sorting - A-01, A-02, ...) */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={14} className="text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:outline-none focus:border-slate-600"
              title="Urutan Tampilan Data"
            >
              <option value="code_asc">Urut Kode (A-01, A-02, ...)</option>
              <option value="unchecked_first">Prioritas: Belum Dicek Dulu</option>
              <option value="checked_first">Prioritas: Sudah Dicek Dulu</option>
              <option value="latest">Waktu Inspeksi Terbaru</option>
            </select>
          </div>

          {/* 5. Date Range & Reset Button */}
          <div className="flex items-center gap-1.5">
            <select
              value={dateRangeFilter}
              onChange={(e) => {
                setDateRangeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 py-2 px-2 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:outline-none focus:border-slate-600"
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

        {/* Row 2: Zone Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
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
                className={`px-3 py-1 rounded-md font-semibold transition text-xs cursor-pointer ${
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

      </div>

      {/* ======================================================== */}
      {/* 3. INSPECTIONS TABLE                                     */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Kode & Zona Fasilitas</th>
                <th className="py-3 px-4">Status Pengecekan</th>
                <th className="py-3 px-4">Waktu Inspeksi</th>
                <th className="py-3 px-4">Petugas Pemeriksa</th>
                <th className="py-3 px-4">Parameter Fisik</th>
                <th className="py-3 px-4">Catatan & Bukti</th>
                <th className="py-3 px-4">Verifikasi PIC K3</th>
                <th className="py-3 px-4 text-right">Aksi</th>
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
                      
                      {/* 1. Kode & Zona Fasilitas */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                            {row.facility_code || "-"}
                          </span>
                          {row.area_zone && (
                            <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-300 px-1.5 py-0.5 rounded">
                              {row.area_zone}
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-800 mt-1">
                          {row.facility_name || facility?.nama_item || "-"}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-slate-400" />
                          <span>{row.location_name || "Area Pabrik"}</span>
                        </div>
                      </td>

                      {/* 2. Status Pengecekan (Sudah vs Belum) */}
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
                            <div className="text-[10px] text-slate-400 mt-1">
                              Menunggu audit
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 3. Waktu Inspeksi */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasInspection ? (
                          <div>
                            <div className="font-semibold text-slate-900">
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

                      {/* 4. Petugas Pemeriksa */}
                      <td className="py-3 px-4">
                        {hasInspection ? (
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1">
                              <User size={12} className="text-slate-400" />
                              <span>{inspector}</span>
                            </div>
                            <div className="mt-1">
                              {isPass ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  <CheckCircle2 size={10} />
                                  Lolos (Baik)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                  <AlertTriangle size={10} />
                                  Ada Temuan
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum diperiksa</span>
                        )}
                      </td>

                      {/* 5. Parameter Fisik (5 Parameter) */}
                      <td className="py-3 px-4">
                        {hasInspection && results.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {results.map((r: any, rIdx: number) => {
                              const passed = r.passed !== false && r.jawaban !== "Rusak" && r.jawaban !== "Karat / Rusak";
                              return (
                                <span
                                  key={rIdx}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                    passed
                                      ? "bg-slate-50 text-slate-700 border-slate-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                  }`}
                                  title={`${r.label || r.code || r.item}: ${r.jawaban || (passed ? "OK" : "NOK")}`}
                                >
                                  {r.code || r.label || r.item}: {r.jawaban || (passed ? "OK" : "NOK")}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* 6. Catatan & Foto */}
                      <td className="py-3 px-4 max-w-[220px]">
                        {hasInspection ? (
                          <>
                            <p className="text-[11px] text-slate-600 line-clamp-2" title={row.notes || "-"}>
                              {row.notes || "-"}
                            </p>
                            {photos.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                {photos.map((photo: string, pIdx: number) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => setActivePhoto(photo)}
                                    className="relative w-8 h-8 rounded border border-slate-200 overflow-hidden hover:opacity-90 transition group cursor-pointer"
                                    title="Klik untuk memperbesar foto bukti"
                                  >
                                    <img src={photo} alt="Bukti" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent flex items-center justify-center">
                                      <Camera size={10} className="text-white drop-shadow" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>

                      {/* 7. Verifikasi PIC K3 */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasInspection ? (
                          isVerified ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                <CheckCircle2 size={11} />
                                Terverifikasi
                              </span>
                              <div className="text-[11px] text-slate-700 font-semibold mt-1">
                                {pic || "PIC K3"}
                              </div>
                              {row.verified_at && (
                                <div className="text-[10px] text-slate-400">
                                  {formatDateTime(row.verified_at)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                <Clock size={11} />
                                Menunggu Verifikasi
                              </span>
                              <div className="text-[10px] text-amber-700 mt-1">
                                Belum disetujui PIC
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
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition cursor-pointer shadow-2xs"
                              title={`Inspeksi APAR ${row.facility_code} Sekarang`}
                            >
                              <ClipboardList size={12} />
                              <span>Cek Sekarang</span>
                            </button>
                          )}

                          {/* JIKA SUDAH DICEK & PENDING: Tombol Verifikasi Cepat Khusus PIC */}
                          {hasInspection && isPending && canVerify && (
                            <button
                              type="button"
                              onClick={() => handleOpenQuickVerify(row)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition cursor-pointer shadow-2xs"
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
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-700 rounded-md text-xs font-semibold transition cursor-pointer shadow-2xs"
                              title={`Cetak Label QR ${row.facility_code}`}
                            >
                              <QrCode size={12} />
                              <span>QR</span>
                            </button>
                          )}

                          {/* Tombol Detail / Kelola Fasilitas */}
                          {facility && onOpenFacilityDetail && (
                            <button
                              type="button"
                              onClick={() => onOpenFacilityDetail(facility)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold transition cursor-pointer"
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
      {/* 5. MODAL ZOOM FOTO BUKTI                                 */}
      {/* ======================================================== */}
      {activePhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActivePhoto(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Camera size={16} className="text-slate-600" />
                Foto Bukti Lapangan
              </span>
              <button 
                onClick={() => setActivePhoto(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[75vh]">
              <img 
                src={activePhoto} 
                alt="Foto Bukti Inspeksi" 
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-md" 
              />
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
