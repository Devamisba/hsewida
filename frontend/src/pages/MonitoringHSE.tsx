import { useState, useEffect, useCallback } from "react";
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
  ClipboardCheck,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { InspectionModal } from "@/components/InspectionModal";
import { AddInspectionModal } from "@/components/AddInspectionModal";
import { FacilityQrStickerModal } from "@/components/FacilityQrStickerModal";
import { RecordRefillModal } from "@/components/RecordRefillModal";
import { QrScanFieldModal } from "@/components/QrScanFieldModal";
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
  const [activeTab, setActiveTab] = useState("apar");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [stickerModalOpen, setStickerModalOpen] = useState(false);
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);

  // Selected items
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState("");

  // Data state
  const [facilities, setFacilities] = useState<SafetyFacility[]>([]);
  const [alertsSummary, setAlertsSummary] = useState<AlertsSummary | null>(null);
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

  const handleScanSuccess = (facility: SafetyFacility) => {
    setScannerModalOpen(false);
    handleInspect(facility, getCategoryTitle(facility.category));
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
          
          {/* Top Control Bar: Header & Primary Actions in single neat row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white px-5 py-3.5 rounded-xl border border-gray-200 shadow-xs">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Kesiapan Alat & Fasilitas K3</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Pantau kesiapan alat consumable (masa berlaku) & non-consumable (kondisi fisik berkala)
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setScannerModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg transition-all text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                title="Scan QR Code Alat di Lapangan"
              >
                <QrCode size={15} />
                <span>Scan QR Lapangan</span>
              </button>

              <button
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-2 rounded-lg transition-all text-xs font-semibold shadow-2xs cursor-pointer active:scale-95"
                title="Muat Ulang Data"
              >
                <RefreshCw size={14} className={cn(loading && "animate-spin text-primary")} />
                <span>Refresh</span>
              </button>

              {activeTab !== "spi" && (
                <button 
                  onClick={() => setAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-primary hover:opacity-90 text-on-primary px-3 py-2 rounded-lg transition-all text-xs font-bold shadow-xs whitespace-nowrap active:scale-[0.98] cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Tambah Data Baru</span>
                </button>
              )}
            </div>
          </div>

          {/* §6. Dashboard & Rekap Status: 2 Dual Interactive Summary Cards (Clean, Clickable) */}
          {alertsSummary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Card 1: Consumable (APAR / P3K) */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between">
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

                <div className="grid grid-cols-3 gap-2.5 mt-3 text-center">
                  {/* 1. Aman (>30h) */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("AMAN", "CONSUMABLE")}
                    title="Klik untuk memfilter alat berstatus AMAN (>30 Hari)"
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all cursor-pointer select-none",
                      statusFilter === "AMAN"
                        ? "bg-emerald-100 border-emerald-500 ring-2 ring-emerald-500/50 shadow-xs"
                        : "bg-emerald-50/70 border-emerald-100 hover:bg-emerald-100/60 hover:border-emerald-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-xs text-emerald-700 font-semibold mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Aman (&gt;30h)
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{alertsSummary.consumable?.aman || 0}</p>
                  </button>

                  {/* 2. H-30 Hari */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("MENDEKATI_KADALUARSA", "CONSUMABLE")}
                    title="Klik untuk memfilter alat mendekati batas kadaluarsa (H-30 Hari)"
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all cursor-pointer select-none",
                      statusFilter === "MENDEKATI_KADALUARSA"
                        ? "bg-amber-100 border-amber-500 ring-2 ring-amber-500/50 shadow-xs"
                        : "bg-amber-50/70 border-amber-100 hover:bg-amber-100/60 hover:border-amber-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-xs text-amber-700 font-semibold mb-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      H-30 Hari
                    </div>
                    <p className="text-2xl font-bold text-amber-700">{alertsSummary.consumable?.h30 || 0}</p>
                  </button>

                  {/* 3. Kadaluarsa */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("KADALUARSA", "CONSUMABLE")}
                    title="Klik untuk memfilter alat yang sudah KADALUARSA"
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all cursor-pointer select-none",
                      statusFilter === "KADALUARSA"
                        ? "bg-red-100 border-red-500 ring-2 ring-red-500/50 shadow-xs"
                        : "bg-red-50/70 border-red-100 hover:bg-red-100/60 hover:border-red-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-xs text-red-700 font-semibold mb-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                      Kadaluarsa
                    </div>
                    <p className="text-2xl font-bold text-red-700">{alertsSummary.consumable?.kadaluarsa || 0}</p>
                  </button>
                </div>
              </div>

              {/* Card 2: Kondisi Fisik (Hydrant, Pintu, Rambu, Titik Kumpul) */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between">
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

                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                  {/* 1. Baik */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("BAIK", "KONDISI")}
                    title="Klik untuk memfilter alat kondisi BAIK"
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all cursor-pointer select-none",
                      statusFilter === "BAIK"
                        ? "bg-emerald-100 border-emerald-500 ring-2 ring-emerald-500/50 shadow-xs"
                        : "bg-emerald-50/70 border-emerald-100 hover:bg-emerald-100/60 hover:border-emerald-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-xs text-emerald-700 font-semibold mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Baik
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{alertsSummary.kondisi?.baik || 0}</p>
                  </button>

                  {/* 2. Perhatian */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("PERLU_PERHATIAN", "KONDISI")}
                    title="Klik untuk memfilter alat kondisi PERLU PERHATIAN"
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all cursor-pointer select-none",
                      statusFilter === "PERLU_PERHATIAN"
                        ? "bg-amber-100 border-amber-500 ring-2 ring-amber-500/50 shadow-xs"
                        : "bg-amber-50/70 border-amber-100 hover:bg-amber-100/60 hover:border-amber-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-xs text-amber-700 font-semibold mb-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      Perhatian
                    </div>
                    <p className="text-2xl font-bold text-amber-700">{alertsSummary.kondisi?.perhatian || 0}</p>
                  </button>

                  {/* 3. Rusak */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("RUSAK", "KONDISI")}
                    title="Klik untuk memfilter alat kondisi RUSAK / PERLU TINDAKAN"
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all cursor-pointer select-none",
                      statusFilter === "RUSAK"
                        ? "bg-red-100 border-red-500 ring-2 ring-red-500/50 shadow-xs"
                        : "bg-red-50/70 border-red-100 hover:bg-red-100/60 hover:border-red-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-xs text-red-700 font-semibold mb-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                      Rusak
                    </div>
                    <p className="text-2xl font-bold text-red-700">{alertsSummary.kondisi?.rusak || 0}</p>
                  </button>

                  {/* 4. Terlewat */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatusFilter("JADWAL_TERLEWAT", "KONDISI")}
                    title="Klik untuk memfilter alat dengan JADWAL INSPEKSI TERLEWAT"
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all cursor-pointer select-none",
                      statusFilter === "JADWAL_TERLEWAT"
                        ? "bg-slate-200 border-slate-500 ring-2 ring-slate-500/50 shadow-xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-700 font-semibold mb-1">
                      <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                      Terlewat
                    </div>
                    <p className="text-2xl font-bold text-slate-700">{alertsSummary.kondisi?.terlewat || 0}</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Alerts Banner if needed */}
          {alertsSummary?.alerts && alertsSummary.alerts.length > 0 && (
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

          {/* Tab Contents */}
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
                    onInspect={(f) => handleInspect(f, getCategoryTitle(f.category))}
                    onShowSticker={handleShowSticker}
                    onRefill={handleRefill}
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

      {/* 3. Modal Cetak QR Sticker Fisik (§2.3) */}
      <FacilityQrStickerModal
        isOpen={stickerModalOpen}
        onClose={() => setStickerModalOpen(false)}
        facility={selectedItem}
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
  onInspect: (f: SafetyFacility) => void;
  onShowSticker: (f: SafetyFacility) => void;
  onRefill: (f: SafetyFacility) => void;
}

function FacilityDataTable({
  category,
  facilities,
  statusFilter,
  onStatusFilterChange,
  onInspect,
  onShowSticker,
  onRefill
}: FacilityDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CONSUMABLE" | "KONDISI">("ALL");

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AMAN": return "Aman (>30h)";
      case "MENDEKATI_KADALUARSA": return "H-30 Hari";
      case "KADALUARSA": return "Kadaluarsa";
      case "BAIK": return "Kondisi Baik";
      case "PERLU_PERHATIAN": return "Perhatian";
      case "RUSAK": return "Rusak";
      case "JADWAL_TERLEWAT": return "Terlewat";
      default: return status;
    }
  };

  const filteredFacilities = facilities.filter((f) => {
    // Type filter
    if (typeFilter !== "ALL" && f.tipe_item !== typeFilter) {
      return false;
    }

    // Status filter from summary cards
    if (statusFilter) {
      const s = (f.calculated_status || f.status || "").toUpperCase();
      if (statusFilter === "AMAN") {
        if (s !== "AMAN" && s !== "GOOD") return false;
      } else if (statusFilter === "MENDEKATI_KADALUARSA") {
        if (s !== "MENDEKATI_KADALUARSA" && s !== "H-30" && s !== "WARNING") return false;
      } else if (statusFilter === "KADALUARSA") {
        if (s !== "KADALUARSA" && s !== "EXPIRED" && s !== "CRITICAL") return false;
      } else if (statusFilter === "BAIK") {
        if (s !== "BAIK" && s !== "GOOD") return false;
      } else if (statusFilter === "PERLU_PERHATIAN") {
        if (s !== "PERLU_PERHATIAN" && s !== "NEEDS ATTENTION") return false;
      } else if (statusFilter === "RUSAK") {
        if (s !== "RUSAK" && s !== "CRITICAL") return false;
      } else if (statusFilter === "JADWAL_TERLEWAT") {
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

      {/* Facilities Table */}
      <div className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/80 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider">ID & QR Tag</th>
              <th className="px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider">Nama Item & Lokasi</th>
              <th className="px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider">Spesifikasi</th>
              <th className="px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider">Siklus / Masa Berlaku</th>
              <th className="px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider">Status K3</th>
              <th className="px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredFacilities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
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
                                : facility.days_until_expired <= 30 
                                  ? "text-amber-600 font-bold" 
                                  : "text-gray-500"
                            )}>
                              {facility.days_until_expired < 0 
                                ? `Kadaluarsa ${Math.abs(facility.days_until_expired)} hari lalu` 
                                : `${facility.days_until_expired} hari lagi`}
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

                    {/* Status K3 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <MonitoringStatusBadge status={facility.calculated_status || facility.status} />
                    </td>

                    {/* Action Buttons */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* 1. Inspect Button */}
                        <button 
                          onClick={() => onInspect(facility)} 
                          title="Lakukan Checklist Inspeksi"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          <ClipboardCheck size={13} />
                          Inspect
                        </button>

                        {/* 2. Cetak Label QR Sticker */}
                        <button 
                          onClick={() => onShowSticker(facility)} 
                          title="Cetak Stiker Label QR Fisik"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          <QrCode size={13} />
                          Label
                        </button>

                        {/* 3. Refill / Ganti (Khusus Consumable) */}
                        {isConsumable && (
                          <button 
                            onClick={() => onRefill(facility)} 
                            title="Catat Refill Media / Ganti Baru"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors shadow-xs"
                          >
                            <RefreshCw size={13} />
                            Refill
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
  if (s === "MENDEKATI_KADALUARSA" || s === "H-30" || s === "WARNING" || s === "NEEDS ATTENTION") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        H-30 PERHATIAN
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
