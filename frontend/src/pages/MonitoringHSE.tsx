import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { 
  Flame, 
  Droplet, 
  DoorOpen, 
  Cross, 
  Eye, 
  MapPin, 
  LineChart,
  Search,
  Plus,
  Loader2,
  Inbox,
  QrCode,
  RefreshCw,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Tag,
  X,
  Layers,
  Edit3,
  Trash2,
  FileSpreadsheet,
  CalendarCheck,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { InspectionModal } from "@/components/InspectionModal";
import { AddInspectionModal } from "@/components/AddInspectionModal";
import { EditFacilityModal } from "@/components/EditFacilityModal";
import { FacilityQrStickerModal } from "@/components/FacilityQrStickerModal";
import { RecordRefillModal } from "@/components/RecordRefillModal";
import { QrScanFieldModal } from "@/components/QrScanFieldModal";
import { RefillQueueModal } from "@/components/RefillQueueModal";
import { FacilityDetailActionModal } from "@/components/FacilityDetailActionModal";
import { ImportFacilityModal } from "@/components/ImportFacilityModal";
import { syncGeofenceFromSettingsMap } from "@/utils/facilityCoordinates";
import { api, SafetyFacility, AlertsSummary } from "@/services/api";

const TABS = [
  { id: "all", label: "Semua Unit", icon: ShieldCheck },
  { id: "apar", label: "APAR", icon: Flame },
  { id: "hydrant", label: "Hydrant", icon: Droplet },
  { id: "emergency", label: "Pintu Emergency", icon: DoorOpen },
  { id: "p3k", label: "P3K", icon: Cross },
  { id: "mirror", label: "Safety Mirror", icon: Eye },
  { id: "assembly", label: "Assembly Point", icon: MapPin },
  { id: "spi", label: "SPI", icon: LineChart },
];

const TAB_TO_CATEGORY: Record<string, string | undefined> = {
  all: undefined,
  apar: "apar",
  hydrant: "hydrant",
  emergency: "emergency_door",
  p3k: "p3k",
  mirror: "safety_mirror",
  assembly: "assembly_point",
};

export default function MonitoringHSEPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("apar");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter] = useState<string>("ALL");
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [stickerModalOpen, setStickerModalOpen] = useState(false);
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [refillQueueOpen, setRefillQueueOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [facilityToEdit, setFacilityToEdit] = useState<SafetyFacility | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<SafetyFacility | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Selected items
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState("");

  // Data state
  const [facilities, setFacilities] = useState<SafetyFacility[]>([]);
  const [alertsSummary, setAlertsSummary] = useState<AlertsSummary | null>(null);
  const [refillCount, setRefillCount] = useState<number>(27);
  const [spiData, setSpiData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const getCategoryTitle = (cat?: string) => {
    switch ((cat || "").toLowerCase()) {
      case "all": return "Semua Fasilitas";
      case "apar": return "APAR";
      case "hydrant": return "Hydrant";
      case "emergency_door":
      case "emergency": return "Pintu Emergency";
      case "p3k": return "P3K";
      case "safety_mirror":
      case "mirror": return "Safety Mirror";
      case "assembly_point":
      case "assembly": return "Assembly Point";
      default: return "Fasilitas K3";
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      api.getAlertsSummary()
        .then(res => {
          if (res.success && res.data) {
            setAlertsSummary(res.data);
          }
        })
        .catch(err => console.error("Failed to load alerts summary:", err));

      api.getRefillSummary()
        .then(res => {
          if (res.success && res.data) {
            setRefillCount(res.data.total_refill_needed || 27);
          }
        })
        .catch(err => console.error("Failed to load refill summary:", err));

      api.getSettings()
        .then(res => {
          if (res?.success && res.data?.map) {
            syncGeofenceFromSettingsMap(res.data.map);
          }
        })
        .catch(err => console.error("Failed to sync geofence settings:", err));

      if (activeTab === "spi") {
        const res = await api.getSpiMetrics();
        if (res.success) {
          setSpiData(res.data);
        }
      } else {
        const category = TAB_TO_CATEGORY[activeTab];
        const res = await api.getFacilities(category);
        if (res.success && Array.isArray(res.data)) {
          setFacilities(res.data);
        } else {
          setFacilities([]);
        }
      }
    } catch (err) {
      console.error("Failed to load monitoring data:", err);
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInspect = (item: any, type?: string) => {
    setSelectedItem(item);
    setModalType(type || getCategoryTitle(item.category));
    setModalOpen(true);
  };

  const handleShowSticker = (item: any) => {
    setSelectedItem(item);
    setStickerModalOpen(true);
  };

  const handleRefill = (item: any) => {
    setSelectedItem(item);
    setRefillModalOpen(true);
  };

  const handleOpenDetail = (facility: SafetyFacility) => {
    setSelectedItem(facility);
    setDetailModalOpen(true);
  };

  const handleOpenEdit = (facility: SafetyFacility) => {
    setFacilityToEdit(facility);
    setEditModalOpen(true);
  };

  const handleRequestDelete = (facility: SafetyFacility) => {
    setFacilityToDelete(facility);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!facilityToDelete) return;
    setDeleting(true);
    try {
      const res = await api.deleteFacility(facilityToDelete.id);
      if (res?.success) {
        setDeleteConfirmOpen(false);
        setFacilityToDelete(null);
        loadData();
      } else {
        alert(res?.message || "Gagal menghapus fasilitas.");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Gagal menghapus fasilitas.");
    } finally {
      setDeleting(false);
    }
  };

  const handleScanSuccess = (facility: SafetyFacility) => {
    setScannerModalOpen(false);
    if (!facility.category || facility.category === "apar") {
      navigate(`/scan/apar/${facility.code}`);
    } else {
      handleInspect(facility, getCategoryTitle(facility.category));
    }
  };

  const handleToggleStatusFilter = (status: string, targetType: "CONSUMABLE" | "KONDISI") => {
    if (statusFilter === status) {
      setStatusFilter(null);
      return;
    }

    setStatusFilter(status);

    const isConsumableTab = activeTab === "apar" || activeTab === "p3k";
    const isKondisiTab = activeTab === "hydrant" || activeTab === "emergency" || activeTab === "mirror" || activeTab === "assembly";

    if (activeTab === "spi") {
      setActiveTab("all");
    } else if (targetType === "CONSUMABLE" && !isConsumableTab && activeTab !== "all") {
      setActiveTab("all");
    } else if (targetType === "KONDISI" && !isKondisiTab && activeTab !== "all") {
      setActiveTab("all");
    }

    // Scroll smoothly to facilities table
    setTimeout(() => {
      const el = document.getElementById("facilities-table-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden relative font-sans">
      <Header title="Monitoring Fasilitas & Kinerja K3" />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-5">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          
          {/* Top Control Bar: Responsive Header & Primary Actions */}
          <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center gap-4 bg-white px-5 py-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="shrink-0 w-full 2xl:w-auto">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Kesiapan Alat & Fasilitas K3</h1>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Pantau kesiapan alat consumable (masa berlaku) & non-consumable (kondisi fisik berkala)
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap w-full 2xl:w-auto justify-start 2xl:justify-end">
              {activeTab === "apar" && (
                <>
                  <button
                    type="button"
                    onClick={() => setRefillQueueOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-amber-50/70 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 px-3 py-2 rounded-xl transition-all text-xs font-semibold shadow-2xs cursor-pointer active:scale-95 shrink-0"
                    title="Lihat Antrean Refill APAR"
                  >
                    <RefreshCw size={14} className="text-amber-600" />
                    <span>Antrean Refill</span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {refillCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(facilities[0] || null);
                      setStickerModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-xl transition-all text-xs font-semibold shadow-2xs cursor-pointer active:scale-95 shrink-0"
                    title="Cetak Stiker Label QR per Zona"
                  >
                    <Layers size={14} className="text-slate-500" />
                    <span>Cetak Label</span>
                  </button>
                </>
              )}

              <Link
                to="/gis-map"
                className="inline-flex items-center gap-1.5 bg-white hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-3 py-2 rounded-xl transition-all text-xs font-semibold shadow-2xs cursor-pointer active:scale-95 shrink-0"
                title="Buka Peta GIS & Radius Geofence Pabrik"
              >
                <MapPin size={14} className="text-emerald-600" />
                <span>Peta GIS</span>
              </Link>

              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-xl transition-all text-xs font-semibold shadow-2xs cursor-pointer active:scale-95 shrink-0"
                title="Muat Ulang Data"
              >
                <RefreshCw size={14} className={cn(loading && "animate-spin text-primary")} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setScannerModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl transition-all text-xs font-bold shadow-xs cursor-pointer active:scale-95 shrink-0"
                title="Scan QR Code Alat di Lapangan"
              >
                <QrCode size={15} />
                <span>Scan QR</span>
              </button>

              {activeTab !== "spi" && activeTab !== "inspeksi" && (
                <>
                  <button 
                    type="button"
                    onClick={() => setImportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl transition-all text-xs font-bold shadow-xs whitespace-nowrap active:scale-[0.98] cursor-pointer shrink-0"
                    title="Import Data Fasilitas dari File Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={15} />
                    <span>Import Excel</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-on-primary px-3.5 py-2 rounded-xl transition-all text-xs font-bold shadow-xs whitespace-nowrap active:scale-[0.98] cursor-pointer shrink-0"
                  >
                    <Plus size={16} />
                    <span>Tambah Unit</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* §6. Dashboard & Rekap Status: 2 Dual Interactive Summary Cards (Clean, Clickable) */}
          {activeTab !== "inspeksi" && alertsSummary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Card 1: Consumable (APAR / P3K) */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                      <Flame size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Item Consumable (Masa Berlaku Expired)</h3>
                      <p className="text-xs text-gray-500">APAR & Obat-obatan P3K</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                    Total: {alertsSummary.consumable?.total || 0} Unit
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 lg:gap-2.5 mt-3 text-center">
                  {/* 1. Aman (>1th) */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("AMAN", "CONSUMABLE")}
                    title="Klik untuk memfilter alat berstatus AMAN (> 1 Tahun)"
                    className={cn(
                      "p-1.5 sm:p-2.5 lg:p-3 rounded-xl border text-center transition-all cursor-pointer select-none flex flex-col justify-between",
                      statusFilter === "AMAN"
                        ? "bg-emerald-100 border-emerald-500 ring-2 ring-emerald-500/50 shadow-xs"
                        : "bg-emerald-50/70 border-emerald-100 hover:bg-emerald-100/60 hover:border-emerald-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] lg:text-xs text-emerald-700 font-bold mb-0.5 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      <span className="truncate">Aman</span>
                    </div>
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-emerald-700 my-0.5">{alertsSummary.consumable?.aman || 0}</p>
                    <span className="text-[9px] sm:text-[10px] lg:text-[11px] text-emerald-600 font-semibold whitespace-nowrap block">&gt; 1 Thn</span>
                  </button>

                  {/* 2. H-1 Tahun */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("H_1TAHUN", "CONSUMABLE")}
                    title="Klik untuk memfilter alat dalam horizon H-1 Tahun (6-12 Bulan)"
                    className={cn(
                      "p-1.5 sm:p-2.5 lg:p-3 rounded-xl border text-center transition-all cursor-pointer select-none flex flex-col justify-between",
                      statusFilter === "H_1TAHUN"
                        ? "bg-yellow-100 border-yellow-500 ring-2 ring-yellow-500/50 shadow-xs"
                        : "bg-yellow-50/70 border-yellow-100 hover:bg-yellow-100/60 hover:border-yellow-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] lg:text-xs text-yellow-800 font-bold mb-0.5 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
                      <span className="truncate">H-1 Thn</span>
                    </div>
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-yellow-800 my-0.5">{alertsSummary.consumable?.h_1tahun || 0}</p>
                    <span className="text-[9px] sm:text-[10px] lg:text-[11px] text-yellow-700 font-semibold whitespace-nowrap block">6-12 Bln</span>
                  </button>

                  {/* 3. H-6 Bulan */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("H_6BULAN", "CONSUMABLE")}
                    title="Klik untuk memfilter alat dalam horizon H-6 Bulan (3-6 Bulan)"
                    className={cn(
                      "p-1.5 sm:p-2.5 lg:p-3 rounded-xl border text-center transition-all cursor-pointer select-none flex flex-col justify-between",
                      statusFilter === "H_6BULAN" || statusFilter === "H_5BULAN"
                        ? "bg-amber-100 border-amber-500 ring-2 ring-amber-500/50 shadow-xs"
                        : "bg-amber-50/70 border-amber-100 hover:bg-amber-100/60 hover:border-amber-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] lg:text-xs text-amber-800 font-bold mb-0.5 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                      <span className="truncate">H-6 Bln</span>
                    </div>
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-amber-800 my-0.5">
                      {alertsSummary.consumable?.h_6bulan ?? alertsSummary.consumable?.h_5bulan ?? 0}
                    </p>
                    <span className="text-[9px] sm:text-[10px] lg:text-[11px] text-amber-700 font-semibold whitespace-nowrap block">3-6 Bln</span>
                  </button>

                  {/* 4. H-3 Bulan */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("H_3BULAN", "CONSUMABLE")}
                    title="Klik untuk memfilter alat dalam horizon H-3 Bulan (< 3 Bulan)"
                    className={cn(
                      "p-1.5 sm:p-2.5 lg:p-3 rounded-xl border text-center transition-all cursor-pointer select-none flex flex-col justify-between",
                      statusFilter === "H_3BULAN" || statusFilter === "MENDEKATI_KADALUARSA" || statusFilter === "H_1BULAN"
                        ? "bg-orange-100 border-orange-500 ring-2 ring-orange-500/50 shadow-xs"
                        : "bg-orange-50/70 border-orange-100 hover:bg-orange-100/60 hover:border-orange-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] lg:text-xs text-orange-800 font-bold mb-0.5 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                      <span className="truncate">H-3 Bln</span>
                    </div>
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-orange-800 my-0.5">
                      {alertsSummary.consumable?.h_3bulan ?? alertsSummary.consumable?.h_1bulan ?? alertsSummary.consumable?.h30 ?? 0}
                    </p>
                    <span className="text-[9px] sm:text-[10px] lg:text-[11px] text-orange-700 font-semibold whitespace-nowrap block">&lt; 3 Bln</span>
                  </button>

                  {/* 5. Kadaluarsa */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("KADALUARSA", "CONSUMABLE")}
                    title="Klik untuk memfilter alat yang sudah KADALUARSA"
                    className={cn(
                      "p-1.5 sm:p-2.5 lg:p-3 rounded-xl border text-center transition-all cursor-pointer select-none flex flex-col justify-between",
                      statusFilter === "KADALUARSA"
                        ? "bg-red-100 border-red-500 ring-2 ring-red-500/50 shadow-xs"
                        : "bg-red-50/70 border-red-100 hover:bg-red-100/60 hover:border-red-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] lg:text-xs text-red-700 font-bold mb-0.5 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                      <span className="truncate">Expired</span>
                    </div>
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-red-700 my-0.5">{alertsSummary.consumable?.kadaluarsa || 0}</p>
                    <span className="text-[9px] sm:text-[10px] lg:text-[11px] text-red-600 font-semibold whitespace-nowrap block">&lt; 0 Hari</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Kondisi Fisik (Hydrant, Pintu, Rambu, Titik Kumpul) */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Item Kondisi Fisik (Inspeksi Berkala)</h3>
                      <p className="text-xs text-gray-500">Hydrant, Pintu Darurat, Safety Mirror, Titik Kumpul</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                    Total: {alertsSummary.kondisi?.total || 0} Unit
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-2.5 mt-3 text-center">
                  {/* 1. Baik */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("BAIK", "KONDISI")}
                    title="Klik untuk memfilter alat kondisi BAIK"
                    className={cn(
                      "p-2 sm:p-2.5 lg:p-3 rounded-xl border text-center transition-all cursor-pointer select-none flex flex-col justify-between",
                      statusFilter === "BAIK"
                        ? "bg-emerald-100 border-emerald-500 ring-2 ring-emerald-500/50 shadow-xs"
                        : "bg-emerald-50/70 border-emerald-100 hover:bg-emerald-100/60 hover:border-emerald-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] lg:text-xs text-emerald-700 font-bold mb-0.5 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      <span className="truncate">Baik</span>
                    </div>
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-emerald-700 my-0.5">{alertsSummary.kondisi?.baik || 0}</p>
                    <span className="text-[9px] sm:text-[10px] lg:text-[11px] text-emerald-600 font-semibold whitespace-nowrap block">Normal / Siap</span>
                  </button>

                  {/* 2. Perhatian */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("PERLU_PERHATIAN", "KONDISI")}
                    title="Klik untuk memfilter alat kondisi PERLU PERHATIAN"
                    className={cn(
                      "p-2 sm:p-2.5 lg:p-3 rounded-xl border text-center transition-all cursor-pointer select-none flex flex-col justify-between",
                      statusFilter === "PERLU_PERHATIAN"
                        ? "bg-amber-100 border-amber-500 ring-2 ring-amber-500/50 shadow-xs"
                        : "bg-amber-50/70 border-amber-100 hover:bg-amber-100/60 hover:border-amber-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] lg:text-xs text-amber-800 font-bold mb-0.5 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                      <span className="truncate">Perhatian</span>
                    </div>
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-amber-800 my-0.5">{alertsSummary.kondisi?.perhatian || 0}</p>
                    <span className="text-[9px] sm:text-[10px] lg:text-[11px] text-amber-700 font-semibold whitespace-nowrap block">Butuh Cek</span>
                  </button>

                  {/* 3. Rusak */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("RUSAK", "KONDISI")}
                    title="Klik untuk memfilter alat kondisi RUSAK / PERLU TINDAKAN"
                    className={cn(
                      "p-2 sm:p-2.5 lg:p-3 rounded-xl border text-center transition-all cursor-pointer select-none flex flex-col justify-between",
                      statusFilter === "RUSAK"
                        ? "bg-red-100 border-red-500 ring-2 ring-red-500/50 shadow-xs"
                        : "bg-red-50/70 border-red-100 hover:bg-red-100/60 hover:border-red-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] lg:text-xs text-red-700 font-bold mb-0.5 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                      <span className="truncate">Rusak</span>
                    </div>
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-red-700 my-0.5">{alertsSummary.kondisi?.rusak || 0}</p>
                    <span className="text-[9px] sm:text-[10px] lg:text-[11px] text-red-600 font-semibold whitespace-nowrap block">Perbaikan</span>
                  </button>

                  {/* 4. Terlewat */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("JADWAL_TERLEWAT", "KONDISI")}
                    title="Klik untuk memfilter alat dengan JADWAL INSPEKSI TERLEWAT"
                    className={cn(
                      "p-2 sm:p-2.5 lg:p-3 rounded-xl border text-center transition-all cursor-pointer select-none flex flex-col justify-between",
                      statusFilter === "JADWAL_TERLEWAT"
                        ? "bg-slate-200 border-slate-500 ring-2 ring-slate-500/50 shadow-xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] lg:text-xs text-slate-700 font-bold mb-0.5 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                      <span className="truncate">Terlewat</span>
                    </div>
                    <p className="text-base sm:text-xl lg:text-2xl font-black text-slate-700 my-0.5">{alertsSummary.kondisi?.terlewat || 0}</p>
                    <span className="text-[9px] sm:text-[10px] lg:text-[11px] text-slate-600 font-semibold whitespace-nowrap block">Jadwal Lewat</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Alerts Banner if needed */}
          {activeTab !== "inspeksi" && alertsSummary?.alerts && alertsSummary.alerts.length > 0 && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-amber-900">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold">Notifikasi Peringatan K3: </span>
                  Terdapat {alertsSummary.alerts.length} fasilitas terdeteksi butuh inspeksi berkala, mendekati kadaluarsa, atau butuh tindakan perbaikan.
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs - Clean, no horizontal scrollbar track */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              let activeClass = "bg-primary text-on-primary border-primary shadow-sm";
              if (isActive) {
                if (tab.id === 'apar' || tab.id === 'hydrant') {
                  activeClass = "bg-red-50 text-red-600 border-red-200 shadow-sm font-bold";
                } else if (tab.id === 'p3k' || tab.id === 'assembly') {
                  activeClass = "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm font-bold";
                } else if (tab.id === 'emergency') {
                  activeClass = "bg-teal-50 text-teal-600 border-teal-200 shadow-sm font-bold";
                } else if (tab.id === 'mirror' || tab.id === 'spi') {
                  activeClass = "bg-amber-50 text-amber-600 border-amber-200 shadow-sm font-bold";
                } else if (tab.id === 'all') {
                  activeClass = "bg-blue-50 text-blue-700 border-blue-200 shadow-sm font-bold";
                } else if (tab.id === 'inspeksi') {
                  activeClass = "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm font-bold";
                }
              }
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer",
                    isActive 
                      ? activeClass 
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Contents: Facilities Table or SPI Monitoring */}
          <div id="facilities-table-section" className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[420px]">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm font-medium">Memuat data fasilitas K3...</p>
              </div>
            ) : (
              <>
                {activeTab === "spi" ? (
                  <SPIMonitoring spiData={spiData} />
                ) : (
                  <FacilityDataTable 
                    category={activeTab}
                    facilities={facilities}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    zoneFilter={zoneFilter}
                    onZoneFilterChange={setZoneFilter}
                    refillCount={refillCount}
                    onOpenRefillQueue={() => setRefillQueueOpen(true)}
                    onOpenDetail={handleOpenDetail}
                    onShowSticker={handleShowSticker}
                    onEdit={handleOpenEdit}
                    onDelete={handleRequestDelete}
                  />
                )}
              </>
            )}
          </div>

        </div>
      </main>
      
      {/* 1. Modal Inspeksi (Checklist §4.1 Consumable / §4.2 Kondisi) */}
      <InspectionModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        item={selectedItem} 
        type={modalType} 
        onSuccess={loadData}
      />

      {/* 2. Modal Tambah Fasilitas Baru */}
      <AddInspectionModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        activeTab={activeTab}
        onSuccess={loadData}
      />

      {/* 2.1 Modal Import Excel Universal Fasilitas K3 */}
      <ImportFacilityModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={loadData}
      />

      {/* 3. Modal Cetak QR Sticker Fisik (§2.3) */}
      <FacilityQrStickerModal
        isOpen={stickerModalOpen}
        onClose={() => setStickerModalOpen(false)}
        facility={selectedItem}
        allFacilities={facilities}
      />

      {/* 4. Modal Catat Refill / Ganti Baru (§2.2) */}
      <RecordRefillModal
        isOpen={refillModalOpen}
        onClose={() => setRefillModalOpen(false)}
        facility={selectedItem}
        onSuccess={loadData}
      />

      {/* 5. Modal Scan QR Lapangan */}
      <QrScanFieldModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* 6. Modal Antrean Refill APAR 27 Unit */}
      <RefillQueueModal
        isOpen={refillQueueOpen}
        onClose={() => setRefillQueueOpen(false)}
        onSelectFacilityForRefill={handleRefill}
      />

      {/* 7. Modal Bundel Aksi & Riwayat Monitoring Fasilitas */}
      <FacilityDetailActionModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        facility={selectedItem}
        onInspect={(f) => handleInspect(f, getCategoryTitle(f.category))}
        onShowSticker={handleShowSticker}
        onRefill={handleRefill}
        onFacilityUpdated={loadData}
        onEdit={(f) => {
          setDetailModalOpen(false);
          handleOpenEdit(f);
        }}
        onDelete={(f) => {
          setDetailModalOpen(false);
          handleRequestDelete(f);
        }}
      />

      {/* 8. Modal Edit Data Fasilitas (§CRUD) */}
      <EditFacilityModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setFacilityToEdit(null);
        }}
        facility={facilityToEdit}
        onSuccess={() => {
          setEditModalOpen(false);
          setFacilityToEdit(null);
          loadData();
        }}
        onDeleteRequest={(f) => {
          setEditModalOpen(false);
          handleRequestDelete(f);
        }}
      />

      {/* 9. Konfirmasi Hapus Fasilitas Modal */}
      {deleteConfirmOpen && facilityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-red-100 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center">Hapus Fasilitas K3?</h3>
              <p className="text-sm text-gray-500 text-center mt-2">
                Apakah Anda yakin ingin menonaktifkan/menghapus fasilitas{" "}
                <span className="font-bold text-gray-800">{facilityToDelete.code} - {facilityToDelete.name}</span>?
              </p>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                Unit akan dinonaktifkan dari daftar aktif monitoring. Riwayat inspeksi terdahulu tetap diarsipkan demi kepatuhan audit K3.
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setFacilityToDelete(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Ya, Hapus Fasilitas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// ENHANCED FACILITY DATA TABLE (Supports Consumable vs Kondisi Branching)
// =========================================================================

interface FacilityDataTableProps {
  category: string;
  facilities: SafetyFacility[];
  statusFilter: string | null;
  onStatusFilterChange: (s: string | null) => void;
  zoneFilter?: string;
  onZoneFilterChange?: (z: string) => void;
  refillCount?: number;
  onOpenRefillQueue?: () => void;
  onOpenDetail: (f: SafetyFacility) => void;
  onShowSticker: (f: SafetyFacility) => void;
  onEdit?: (f: SafetyFacility) => void;
  onDelete?: (f: SafetyFacility) => void;
}

function FacilityDataTable({
  category,
  facilities,
  statusFilter,
  onStatusFilterChange,
  zoneFilter = "ALL",
  onZoneFilterChange,
  refillCount = 0,
  onOpenRefillQueue,
  onOpenDetail,
  onShowSticker,
  onEdit,
  onDelete
}: FacilityDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CONSUMABLE" | "KONDISI">("ALL");
  const [monthCheckFilter, setMonthCheckFilter] = useState<"ALL" | "CHECKED" | "UNCHECKED">("ALL");

  // Real-time Monthly Tracker metrics for active category
  const now = new Date();
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const currentMonthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeftInMonth = Math.max(0, daysInCurrentMonth - now.getDate());

  const totalUnits = facilities.length;
  const checkedThisMonth = useMemo(() => facilities.filter(f => Boolean(f.is_checked_this_month)).length, [facilities]);
  const uncheckedThisMonth = Math.max(0, totalUnits - checkedThisMonth);
  const monthlyProgress = totalUnits > 0 ? Math.round((checkedThisMonth / totalUnits) * 100) : 0;

  // Zone Breakdown for APAR
  const zoneCounts = useMemo(() => {
    let all = 0, umum = 0, f1 = 0, f2 = 0, wh = 0;
    facilities.forEach((f) => {
      all++;
      const z = (f.area_zone || "").toUpperCase();
      if (z.includes("UMUM")) umum++;
      else if (z.includes("FACTORY 1")) f1++;
      else if (z.includes("FACTORY 2")) f2++;
      else if (z.includes("WARE HOUSE") || z.includes("WAREHOUSE")) wh++;
    });
    return { all, umum, f1, f2, wh };
  }, [facilities]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AMAN": return "Aman (> 1 Tahun)";
      case "H_1TAHUN": return "H-1 Tahun (6-12 Bulan)";
      case "H_6BULAN":
      case "H_5BULAN": return "H-6 Bulan (3-6 Bulan)";
      case "H_3BULAN":
      case "MENDEKATI_KADALUARSA":
      case "H_1BULAN": return "H-3 Bulan (< 3 Bulan)";
      case "KADALUARSA": return "Kadaluarsa";
      case "BAIK": return "Kondisi Baik";
      case "PERLU_PERHATIAN": return "Perhatian";
      case "RUSAK": return "Rusak";
      case "JADWAL_TERLEWAT": return "Terlewat";
      default: return status;
    }
  };

  const filteredFacilities = facilities.filter((f) => {
    // Real-time Monthly Check status filter
    if (monthCheckFilter === "CHECKED" && !f.is_checked_this_month) return false;
    if (monthCheckFilter === "UNCHECKED" && f.is_checked_this_month) return false;

    // Type filter
    if (typeFilter !== "ALL" && f.tipe_item !== typeFilter) {
      return false;
    }

    // Zone filter for APAR
    if (category === "apar" && zoneFilter && zoneFilter !== "ALL") {
      const z = (f.area_zone || "").toUpperCase();
      if (zoneFilter === "UMUM" && !z.includes("UMUM")) return false;
      if (zoneFilter === "FACTORY 1" && !z.includes("FACTORY 1")) return false;
      if (zoneFilter === "FACTORY 2 & WORKSHOP" && !z.includes("FACTORY 2")) return false;
      if (zoneFilter === "WARE HOUSE" && !z.includes("WARE HOUSE") && !z.includes("WAREHOUSE")) return false;
    }

    // Status filter from summary cards
    if (statusFilter) {
      if (statusFilter === "AMAN") {
        if (f.tipe_item === "CONSUMABLE") {
          const days = f.days_until_expired;
          if (days !== null && days !== undefined && days <= 365) return false;
        } else {
          const s = (f.calculated_status || f.status || "").toUpperCase();
          if (s !== "AMAN" && s !== "GOOD" && s !== "BAIK") return false;
        }
      } else if (statusFilter === "H_1TAHUN") {
        if (f.tipe_item !== "CONSUMABLE") return false;
        const days = f.days_until_expired;
        if (days === null || days === undefined || days <= 180 || days > 365) return false;
      } else if (statusFilter === "H_6BULAN" || statusFilter === "H_5BULAN") {
        if (f.tipe_item !== "CONSUMABLE") return false;
        const days = f.days_until_expired;
        if (days === null || days === undefined || days <= 90 || days > 180) return false;
      } else if (statusFilter === "H_3BULAN" || statusFilter === "MENDEKATI_KADALUARSA" || statusFilter === "H_1BULAN") {
        if (f.tipe_item !== "CONSUMABLE") return false;
        const days = f.days_until_expired;
        if (days === null || days === undefined || days < 0 || days > 90) return false;
      } else if (statusFilter === "KADALUARSA") {
        if (f.tipe_item !== "CONSUMABLE") return false;
        const days = f.days_until_expired;
        if (days === null || days === undefined || days >= 0) return false;
      } else if (statusFilter === "BAIK") {
        const s = (f.calculated_status || f.status || "").toUpperCase();
        if (s !== "BAIK" && s !== "GOOD") return false;
      } else if (statusFilter === "PERLU_PERHATIAN") {
        const s = (f.calculated_status || f.status || "").toUpperCase();
        if (s !== "PERLU_PERHATIAN" && s !== "NEEDS ATTENTION") return false;
      } else if (statusFilter === "RUSAK") {
        const s = (f.calculated_status || f.status || "").toUpperCase();
        if (s !== "RUSAK" && s !== "CRITICAL") return false;
      } else if (statusFilter === "JADWAL_TERLEWAT") {
        const s = (f.calculated_status || f.status || "").toUpperCase();
        if (s !== "JADWAL_TERLEWAT" && !f.is_overdue) return false;
      }
    }

    // Search query
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const locName = typeof f.location === "object" ? f.location?.name : f.location;
    return (
      f.code.toLowerCase().includes(term) ||
      (f.qr_code_id && f.qr_code_id.toLowerCase().includes(term)) ||
      (f.nama_item && f.nama_item.toLowerCase().includes(term)) ||
      (f.name && f.name.toLowerCase().includes(term)) ||
      (locName && String(locName).toLowerCase().includes(term)) ||
      (f.calculated_status && f.calculated_status.toLowerCase().includes(term))
    );
  });

  const formatSpecs = (f: SafetyFacility) => {
    if (!f.specifications) return "-";
    const s = f.specifications;
    if (s.type && s.capacity) return `${s.type} (${s.capacity})`;
    if (s.type) return s.type;
    if (s.capacity) return s.capacity;
    if (s.pressure_bar) return `${s.pressure_bar} Bar`;
    if (s.box_type) return s.box_type;
    if (s.mechanism) return s.mechanism;
    if (s.surface) return `${s.surface} ${s.diameter || ""}`;
    return JSON.stringify(s).slice(0, 30);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const clean = String(dateStr).slice(0, 10);
    const parts = clean.split("-");
    if (parts.length === 3) {
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${parseInt(parts[2], 10)} ${months[mIdx] || parts[1]} ${parts[0]}`;
    }
    return clean;
  };

  return (
    <div className="flex flex-col h-full">
      {/* 1. Real-Time Monthly Inspection Tracker Widget (Universal: APAR, Hydrant, P3K, Door, Mirror, Assembly) */}
      <div className="p-4 bg-linear-to-r from-slate-900 via-slate-800 to-emerald-950 text-white border-b border-slate-700">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
              <CalendarCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Jadwal & Tracker Inspeksi Bulanan (Real-Time)
                </h4>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500 text-slate-950 uppercase">
                  {currentMonthLabel}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Pelacakan real-time kepatuhan inspeksi fisik: fasilitas mana yang sudah dicek vs belum dicek bulan ini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
              <Clock size={13} className="text-amber-400" />
              <span>{daysLeftInMonth} Hari Tersisa di Bulan Ini</span>
            </span>
          </div>
        </div>

        {/* Progress bar & Quick 1-Click Filters */}
        <div className="mt-3.5 pt-3 border-t border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Visual Progress */}
          <div className="w-full sm:w-80">
            <div className="flex justify-between items-center text-[11px] mb-1 font-semibold">
              <span className="text-slate-300">Progres Kepatuhan:</span>
              <span className="text-emerald-300 font-bold">{checkedThisMonth} / {totalUnits} Unit ({monthlyProgress}%)</span>
            </div>
            <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden p-0.5">
              <div 
                className="bg-linear-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${Math.min(100, monthlyProgress)}%` }}
              />
            </div>
          </div>

          {/* Quick Real-Time Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Filter Real-Time:</span>
            <button
              type="button"
              onClick={() => setMonthCheckFilter("ALL")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95",
                monthCheckFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              )}
            >
              Semua Unit ({totalUnits})
            </button>
            <button
              type="button"
              onClick={() => setMonthCheckFilter("CHECKED")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95",
                monthCheckFilter === "CHECKED"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/50"
              )}
            >
              <CheckCircle2 size={12} />
              <span>Sudah Dicek ({checkedThisMonth})</span>
            </button>
            <button
              type="button"
              onClick={() => setMonthCheckFilter("UNCHECKED")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95",
                monthCheckFilter === "UNCHECKED"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-amber-950/80 text-amber-300 hover:bg-amber-900 border border-amber-700/50"
              )}
            >
              <Clock size={12} />
              <span>Belum Dicek ({uncheckedThisMonth})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-gray-50/50">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder={`Cari data ${category.toUpperCase()} / Kode QR / Lokasi...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" 
            />
          </div>

          {/* Active Status Filter Badge (if clicked from cards above) */}
          {statusFilter && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-bold shadow-2xs self-start sm:self-auto animate-in fade-in">
              <span>Filter Status: <strong>{getStatusLabel(statusFilter)}</strong></span>
              <button 
                type="button"
                onClick={() => onStatusFilterChange(null)}
                className="p-0.5 hover:bg-blue-200 rounded text-blue-700 cursor-pointer"
                title="Hapus Filter Status"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Tipe Item filter pills */}
        <div className="flex items-center gap-1.5 self-start md:self-auto">
          <span className="text-xs text-gray-500 font-semibold mr-1">Tipe:</span>
          <button
            type="button"
            onClick={() => setTypeFilter("ALL")}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
              typeFilter === "ALL" 
                ? "bg-gray-800 text-white shadow-xs" 
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            Semua ({facilities.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("CONSUMABLE")}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
              typeFilter === "CONSUMABLE" 
                ? "bg-amber-600 text-white shadow-xs" 
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            Consumable
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("KONDISI")}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
              typeFilter === "KONDISI" 
                ? "bg-blue-600 text-white shadow-xs" 
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            Kondisi Fisik
          </button>
        </div>
      </div>

      {/* Area Zone Filters for APAR (PT Widatra Bhakti 266 units) */}
      {category === "apar" && onZoneFilterChange && (
        <div className="px-4 py-2.5 bg-slate-50 border-b border-gray-200/80 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            <span className="text-xs font-black text-slate-700 mr-1 flex items-center gap-1">
              <MapPin size={13} className="text-rose-600" />
              Zona APAR:
            </span>
            {[
              { id: "ALL", label: `Semua Area (${zoneCounts.all})` },
              { id: "UMUM", label: `Umum (${zoneCounts.umum})` },
              { id: "FACTORY 1", label: `Factory 1 (${zoneCounts.f1})` },
              { id: "FACTORY 2 & WORKSHOP", label: `Factory 2 & Workshop (${zoneCounts.f2})` },
              { id: "WARE HOUSE", label: `Warehouse (${zoneCounts.wh})` },
            ].map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => onZoneFilterChange(z.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer",
                  zoneFilter === z.id
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                )}
              >
                {z.label}
              </button>
            ))}
          </div>

          {onOpenRefillQueue && (
            <button
              type="button"
              onClick={onOpenRefillQueue}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded-lg text-xs font-extrabold transition shrink-0 cursor-pointer shadow-2xs"
            >
              <RefreshCw size={13} className="text-amber-600" />
              <span>Antrean Refill: {refillCount} Tabung</span>
            </button>
          )}
        </div>
      )}

      {/* Desktop Facilities Table (>= lg) */}
      <div className="hidden lg:block overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/80 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider">ID & QR Tag</th>
              <th className="px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider">Nama Item & Lokasi</th>
              <th className="px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider">Spesifikasi</th>
              <th className="px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider">Siklus / Masa Berlaku</th>
              <th className="px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider">Inspeksi Bulan Ini</th>
              <th className="px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider">Status K3</th>
              <th className="px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredFacilities.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  <Inbox className="mx-auto mb-2 text-gray-300" size={32} />
                  <p className="text-sm font-medium text-gray-500">Belum ada unit fasilitas terdaftar pada filter ini.</p>
                  {statusFilter && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => onStatusFilterChange(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <X size={13} />
                        Reset Filter Status ({getStatusLabel(statusFilter)})
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredFacilities.map((facility) => {
                const isConsumable = facility.tipe_item === "CONSUMABLE";
                const locationName = typeof facility.location === "object" 
                  ? facility.location?.name 
                  : facility.location;
                const displayName = facility.nama_item || facility.name || facility.code;

                return (
                  <tr key={facility.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* ID & QR Tag */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm">{facility.code}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Tag size={10} className="text-gray-400" />
                            {facility.qr_code_id || `QR-${facility.code}`}
                          </span>
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                            isConsumable 
                              ? "bg-amber-100 text-amber-800" 
                              : "bg-blue-100 text-blue-800"
                          )}>
                            {isConsumable ? "Consumable" : "Kondisi"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Nama Item & Lokasi */}
                    <td className="px-4 py-3">
                      <div className="max-w-[240px]">
                        <div className="font-bold text-gray-900 text-sm truncate" title={displayName}>
                          {displayName}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5" title={locationName || "-"}>
                          {locationName || "-"}
                        </div>
                        {facility.area_zone && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200 mt-1">
                            {facility.area_zone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Spesifikasi */}
                    <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                      {formatSpecs(facility)}
                    </td>

                    {/* Masa Berlaku / Siklus Inspeksi */}
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {isConsumable ? (
                        <div className="flex flex-col">
                          <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                            <Clock size={12} className="text-gray-400 shrink-0" />
                            <span>Exp: <strong className="text-gray-900 font-semibold">{formatDate(facility.consumable_cycle?.expired_at)}</strong></span>
                          </div>
                          {facility.days_until_expired !== undefined && facility.days_until_expired !== null && (
                            <span className={cn(
                              "text-[11px] font-medium mt-0.5",
                              facility.days_until_expired < 0 
                                ? "text-red-600 font-bold" 
                                : facility.days_until_expired <= 90 
                                  ? "text-orange-600 font-bold" 
                                  : facility.days_until_expired <= 180
                                    ? "text-amber-700 font-semibold"
                                    : facility.days_until_expired <= 365
                                      ? "text-yellow-700 font-semibold"
                                      : "text-emerald-700 font-semibold"
                            )}>
                              {facility.days_until_expired < 0 
                                ? `Kadaluarsa ${Math.abs(facility.days_until_expired)} hari lalu` 
                                : facility.days_until_expired <= 90
                                  ? `H-3 Bln (${facility.days_until_expired} hari lagi)`
                                  : facility.days_until_expired <= 180
                                    ? `H-6 Bln (${facility.days_until_expired} hari lagi)`
                                    : facility.days_until_expired <= 365
                                      ? `H-1 Thn (${facility.days_until_expired} hari lagi)`
                                      : `Aman (${facility.days_until_expired} hari lagi)`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="font-semibold text-gray-800">
                            Setiap {facility.condition_schedule?.interval_pemeriksaan_hari || 30} Hari
                          </div>
                          <span className="text-[11px] text-gray-500 mt-0.5">
                            Cek terakhir: {formatDate(facility.condition_schedule?.terakhir_diperiksa_at || (facility.condition_schedule as any)?.terakhir_diperiksa || facility.last_inspected_at)}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Inspeksi Bulan Ini */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {facility.is_checked_this_month ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Sudah Dicek</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                          <Clock size={12} className="text-amber-600" />
                          <span>Belum Dicek</span>
                        </span>
                      )}
                    </td>

                    {/* Status K3 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <MonitoringStatusBadge status={facility.expiry_tier || facility.calculated_status || facility.status} />
                    </td>

                    {/* Action Buttons: Detail & Riwayat (Primary) + QR + Edit + Hapus (Icons) */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          type="button"
                          onClick={() => onOpenDetail(facility)} 
                          title="Buka Menu Aksi & Riwayat Monitoring"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-2xs cursor-pointer active:scale-95"
                        >
                          <Eye size={13} />
                          <span>Detail</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onShowSticker(facility)}
                          title={`Cetak Label QR Stiker ${facility.code}`}
                          className="p-1.5 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-600 hover:text-purple-700 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95"
                        >
                          <QrCode size={13} />
                        </button>

                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(facility)}
                            title={`Edit Data Fasilitas ${facility.code}`}
                            className="p-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95"
                          >
                            <Edit3 size={13} />
                          </button>
                        )}

                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(facility)}
                            title={`Hapus/Nonaktifkan Fasilitas ${facility.code}`}
                            className="p-1.5 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-95"
                          >
                            <Trash2 size={13} />
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

      {/* Mobile Facility Cards (< lg) - Touch-friendly card stack, zero horizontal scroll */}
      <div className="block lg:hidden divide-y divide-gray-100">
        {filteredFacilities.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Inbox className="mx-auto mb-2 text-gray-300" size={32} />
            <p className="text-sm font-medium text-gray-500">Belum ada unit fasilitas terdaftar pada filter ini.</p>
            {statusFilter && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => onStatusFilterChange(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <X size={13} />
                  Reset Filter Status ({getStatusLabel(statusFilter)})
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredFacilities.map((facility) => {
            const isConsumable = facility.tipe_item === "CONSUMABLE";
            const locationName = typeof facility.location === "object" 
              ? facility.location?.name 
              : facility.location;
            const displayName = facility.nama_item || facility.name || facility.code;

            return (
              <div key={facility.id} className="p-3.5 hover:bg-gray-50/70 transition-colors space-y-2.5">
                {/* Header: Code, QR Chip, Consumable Tag & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-gray-900 text-sm">{facility.code}</span>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded",
                        isConsumable 
                          ? "bg-amber-100 text-amber-800" 
                          : "bg-blue-100 text-blue-800"
                      )}>
                        {isConsumable ? "Consumable" : "Kondisi"}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1 w-fit">
                      <Tag size={9} className="text-gray-400" />
                      {facility.qr_code_id || `QR-${facility.code}`}
                    </span>
                  </div>

                  <div className="shrink-0">
                    <MonitoringStatusBadge status={facility.expiry_tier || facility.calculated_status || facility.status} />
                  </div>
                </div>

                {/* Body Info: Name, Location, Zone, Specs */}
                <div className="bg-gray-50/70 rounded-lg p-2.5 border border-gray-100 text-xs space-y-1.5">
                  <div className="font-bold text-gray-900 text-sm">
                    {displayName}
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 flex-wrap">
                    <MapPin size={11} className="text-rose-500 shrink-0" />
                    <span className="font-medium">{locationName || "-"}</span>
                    {facility.area_zone && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-700 ml-1">
                        {facility.area_zone}
                      </span>
                    )}
                  </div>
                  {formatSpecs(facility) !== "-" && (
                    <div className="text-[11px] text-gray-500">
                      <span className="font-semibold text-gray-600">Spesifikasi:</span> {formatSpecs(facility)}
                    </div>
                  )}

                  {/* Masa Berlaku / Siklus */}
                  <div className="pt-1 border-t border-gray-200/60 flex items-center justify-between text-[11px] flex-wrap gap-1">
                    {isConsumable ? (
                      <>
                        <span className="text-gray-600 flex items-center gap-1 font-medium">
                          <Clock size={11} className="text-gray-400" />
                          Exp: <strong className="text-gray-900">{formatDate(facility.consumable_cycle?.expired_at)}</strong>
                        </span>
                        {facility.days_until_expired !== undefined && facility.days_until_expired !== null && (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold",
                            facility.days_until_expired < 0 
                              ? "bg-red-100 text-red-700" 
                              : facility.days_until_expired <= 90 
                                ? "bg-orange-100 text-orange-700" 
                                : facility.days_until_expired <= 180
                                  ? "bg-amber-100 text-amber-800"
                                  : facility.days_until_expired <= 365
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-emerald-100 text-emerald-800"
                          )}>
                            {facility.days_until_expired < 0 
                              ? `Kadaluarsa ${Math.abs(facility.days_until_expired)} hr lalu` 
                              : facility.days_until_expired <= 90
                                ? `H-3 Bln (${facility.days_until_expired} hr)`
                                : facility.days_until_expired <= 180
                                  ? `H-6 Bln (${facility.days_until_expired} hr)`
                                  : facility.days_until_expired <= 365
                                    ? `H-1 Thn (${facility.days_until_expired} hr)`
                                    : `Aman (${facility.days_until_expired} hr)`}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-gray-600 font-medium">
                          Siklus: Setiap {facility.condition_schedule?.interval_pemeriksaan_hari || 30} Hari
                        </span>
                        <span className="text-gray-500 text-[10px]">
                          Cek: {formatDate(facility.condition_schedule?.terakhir_diperiksa_at || (facility.condition_schedule as any)?.terakhir_diperiksa || facility.last_inspected_at)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Status Inspeksi Bulan Ini */}
                  <div className="pt-1 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-gray-500 font-medium">Inspeksi Bulan Ini:</span>
                    {facility.is_checked_this_month ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        <span>Sudah Dicek</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                        <Clock size={11} className="text-amber-500" />
                        <span>Belum Dicek</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Touch-Friendly Action Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onShowSticker(facility)}
                    title={`Cetak QR ${facility.code}`}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-2.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95"
                  >
                    <QrCode size={13} />
                    <span>QR</span>
                  </button>

                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(facility)}
                      title={`Edit Data ${facility.code}`}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-2.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                  )}

                  <button 
                    type="button"
                    onClick={() => onOpenDetail(facility)} 
                    title="Buka Menu Aksi & Riwayat Monitoring"
                    className="flex-[2] inline-flex items-center justify-center gap-1 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <Eye size={13} />
                    <span>Kelola & Riwayat</span>
                  </button>

                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(facility)}
                      title={`Hapus ${facility.code}`}
                      className="inline-flex items-center justify-center p-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SPIMonitoring({ spiData }: { spiData: any }) {
  const safeHours = spiData?.safeWorkHours ? Number(spiData.safeWorkHours).toLocaleString('id-ID') : "12,724";
  const incidentRate = spiData?.incidents === 0 ? "0.00" : String(spiData?.incidents || "0.00");
  const openFindings = spiData?.openFindings ?? 0;
  const chartData = spiData?.chartData || [
    { name: 'Jan', compliance: 95, temuan: 12 },
    { name: 'Feb', compliance: 97, temuan: 8 },
    { name: 'Mar', compliance: 94, temuan: 15 },
    { name: 'Apr', compliance: 98, temuan: 5 },
    { name: 'Mei', compliance: 99, temuan: 3 },
  ];

  return (
    <div className="p-6 space-y-6 flex-1 flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center">
          <p className="text-sm font-medium text-gray-500">Safe Man Hours (YTD)</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{safeHours}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center">
          <p className="text-sm font-medium text-gray-500">Incident Rate</p>
          <p className="text-3xl font-bold text-success mt-2">{incidentRate}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center">
          <p className="text-sm font-medium text-gray-500">Unsafe Condition / Open CAPA</p>
          <p className="text-3xl font-bold text-warning mt-2">{openFindings}</p>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] bg-white border border-gray-100 rounded-xl p-4 flex flex-col">
        <h3 className="text-sm font-bold text-gray-700 mb-4 text-center">Tren Kepatuhan & Temuan K3 (Data Live)</h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
              <YAxis yAxisId="left" orientation="left" stroke="#10b981" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <RechartsTooltip 
                cursor={{fill: '#f9fafb'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar yAxisId="left" dataKey="compliance" name="% Compliance" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar yAxisId="right" dataKey="temuan" name="Jml Temuan" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Helpers
export function MonitoringStatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();

  // Consumable statuses
  if (s === "AMAN" || s === "GOOD") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        AMAN
      </span>
    );
  }
  if (s === "H_1TAHUN" || s === "H-1 TAHUN") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
        H-1 TAHUN
      </span>
    );
  }
  if (s === "H_6BULAN" || s === "H-6 BULAN" || s === "H_5BULAN" || s === "H-5 BULAN") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        H-6 BULAN
      </span>
    );
  }
  if (s === "H_3BULAN" || s === "H-3 BULAN" || s === "MENDEKATI_KADALUARSA" || s === "H-30" || s === "H_1BULAN" || s === "H-1 BULAN" || s === "WARNING" || s === "NEEDS ATTENTION") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        H-3 BULAN
      </span>
    );
  }
  if (s === "KADALUARSA" || s === "EXPIRED" || s === "CRITICAL" || s === "ERROR") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        KADALUARSA
      </span>
    );
  }

  // Kondisi statuses
  if (s === "BAIK") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        KONDISI BAIK
      </span>
    );
  }
  if (s === "PERLU_PERHATIAN") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        PERLU PERHATIAN
      </span>
    );
  }
  if (s === "RUSAK") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        RUSAK / TINDAKAN
      </span>
    );
  }
  if (s === "JADWAL_TERLEWAT") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        JADWAL TERLEWAT
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
      {status || "UNKNOWN"}
    </span>
  );
}

export function StatusBadge(props: { status: string }) {
  return <MonitoringStatusBadge {...props} />;
}
