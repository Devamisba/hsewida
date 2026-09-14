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
  Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { InspectionModal } from "@/components/InspectionModal";
import { AddInspectionModal } from "@/components/AddInspectionModal";
import { api } from "@/services/api";

const TABS = [
  { id: "apar", label: "APAR", icon: Flame },
  { id: "hydrant", label: "Hydrant", icon: Droplet },
  { id: "emergency", label: "Pintu Emergency", icon: DoorOpen },
  { id: "p3k", label: "P3K", icon: Cross },
  { id: "mirror", label: "Safety Mirror", icon: Eye },
  { id: "assembly", label: "Assembly Point", icon: MapPin },
  { id: "spi", label: "SPI", icon: LineChart },
];

const TAB_TO_CATEGORY: Record<string, string> = {
  apar: "apar",
  hydrant: "hydrant",
  emergency: "emergency_door",
  p3k: "p3k",
  mirror: "safety_mirror",
  assembly: "assembly_point",
};

export default function MonitoringHSEPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState("");

  const [facilities, setFacilities] = useState<any[]>([]);
  const [spiData, setSpiData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
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

  const handleInspect = (item: any, type: string) => {
    setSelectedItem(item);
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <Header title="Monitoring Fasilitas & Kinerja K3" />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col space-y-6">
        <div className="max-w-7xl mx-auto w-full space-y-6 flex-1 flex flex-col">
          
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Monitoring K3</h2>
              <p className="text-sm text-gray-500 mt-1">Pantau kesiapan fasilitas tanggap darurat dan performa keselamatan kerja real-time.</p>
            </div>
            
            <div className="flex gap-2 w-full lg:w-auto">
              {activeTab !== "spi" && (
                <button 
                  onClick={() => setAddModalOpen(true)}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm font-semibold shadow-sm"
                >
                  <Plus size={18} /> Tambah Data Baru
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                }
              }
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border",
                    isActive 
                      ? activeClass 
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon size={16} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm font-medium">Memuat data fasilitas K3...</p>
              </div>
            ) : (
              <>
                {activeTab === "apar" && <APARMonitoring facilities={facilities} onInspect={(item) => handleInspect(item, "APAR")} />}
                {activeTab === "hydrant" && <HydrantMonitoring facilities={facilities} onInspect={(item) => handleInspect(item, "Hydrant")} />}
                {activeTab === "emergency" && <EmergencyDoorMonitoring facilities={facilities} onInspect={(item) => handleInspect(item, "Pintu Emergency")} />}
                {activeTab === "p3k" && <P3KMonitoring facilities={facilities} onInspect={(item) => handleInspect(item, "P3K")} />}
                {activeTab === "mirror" && <SafetyMirrorMonitoring facilities={facilities} onInspect={(item) => handleInspect(item, "Safety Mirror")} />}
                {activeTab === "assembly" && <AssemblyPointMonitoring facilities={facilities} onInspect={(item) => handleInspect(item, "Assembly Point")} />}
                {activeTab === "spi" && <SPIMonitoring spiData={spiData} />}
              </>
            )}
          </div>

        </div>
      </main>
      
      <InspectionModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        item={selectedItem} 
        type={modalType} 
        onSuccess={loadData}
      />

      <AddInspectionModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        activeTab={activeTab}
        onSuccess={loadData}
      />
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS UNTUK MASING-MASING TAB
// ==========================================

function APARMonitoring({ facilities, onInspect }: { facilities: any[], onInspect: (item: any) => void }) {
  const [searchTerm, setSearchTerm] = useState("");

  const data = facilities.map(f => ({
    id: f.code,
    rawId: f.id,
    lokasi: f.location?.name || "-",
    jenis: f.specifications?.type || "Powder",
    berat: f.specifications?.capacity || "6 Kg",
    expired: f.last_inspected_at ? f.last_inspected_at.slice(0, 10) : "2026-08-20",
    status: f.status || "Good",
  }));

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari data APAR..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
          />
        </div>
      </div>
      <div className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-600">ID APAR</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Lokasi</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Jenis & Kapasitas</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Tgl Inspeksi</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                  <Inbox className="mx-auto mb-2 text-gray-300" size={32} />
                  Belum ada data unit APAR terdaftar di sistem.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-900">{item.id}</td>
                  <td className="px-6 py-4 text-gray-700">{item.lokasi}</td>
                  <td className="px-6 py-4 text-gray-700">{item.jenis} ({item.berat})</td>
                  <td className="px-6 py-4 text-gray-700">{item.expired}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status === 'Needs Attention' ? 'Warning' : item.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onInspect(item)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 hover:text-sky-700 rounded-lg text-xs font-bold transition-colors">
                      <Search size={14} /> Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HydrantMonitoring({ facilities, onInspect }: { facilities: any[], onInspect: (item: any) => void }) {
  const [searchTerm, setSearchTerm] = useState("");

  const data = facilities.map(f => ({
    id: f.code,
    rawId: f.id,
    lokasi: f.location?.name || "-",
    tekanan: f.specifications?.pressure_bar ? `${f.specifications.pressure_bar} Bar` : "7.0 Bar",
    selang: f.specifications?.equipment || "Lengkap",
    nozzle: "Ada",
    maintenance: f.last_inspected_at ? f.last_inspected_at.slice(0, 10) : "2026-08-20",
    status: f.status || "Good",
  }));

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari data Hydrant..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
          />
        </div>
      </div>
      <div className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-600">ID Pilar</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Lokasi</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Tekanan Statis</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Selang & Nozzle</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Tgl Maintenance</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  <Inbox className="mx-auto mb-2 text-gray-300" size={32} />
                  Belum ada data pilar/box hydrant terdaftar.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-900">{item.id}</td>
                  <td className="px-6 py-4 text-gray-700">{item.lokasi}</td>
                  <td className="px-6 py-4 text-gray-700">{item.tekanan}</td>
                  <td className="px-6 py-4 text-gray-700">{item.selang} / {item.nozzle}</td>
                  <td className="px-6 py-4 text-gray-700">{item.maintenance}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status === 'Needs Attention' ? 'Warning' : item.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onInspect(item)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 hover:text-sky-700 rounded-lg text-xs font-bold transition-colors">
                      <Search size={14} /> Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmergencyDoorMonitoring({ facilities, onInspect }: { facilities: any[], onInspect: (item: any) => void }) {
  const [searchTerm, setSearchTerm] = useState("");

  const data = facilities.map(f => ({
    id: f.code,
    rawId: f.id,
    lokasi: f.location?.name || "-",
    akses: f.specifications?.pathway || "Bebas",
    fungsi: f.specifications?.mechanism || "Normal",
    maintenance: f.last_inspected_at ? f.last_inspected_at.slice(0, 10) : "2026-08-20",
    status: f.status || "Good",
  }));

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari data Pintu Darurat..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
          />
        </div>
      </div>
      <div className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-600">ID Pintu</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Lokasi</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Akses Evakuasi</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Fungsi Buka</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Tgl Maintenance</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  <Inbox className="mx-auto mb-2 text-gray-300" size={32} />
                  Belum ada pintu darurat terdaftar.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-900">{item.id}</td>
                  <td className="px-6 py-4 text-gray-700">{item.lokasi}</td>
                  <td className="px-6 py-4 text-gray-700">{item.akses}</td>
                  <td className="px-6 py-4 text-gray-700">{item.fungsi}</td>
                  <td className="px-6 py-4 text-gray-700">{item.maintenance}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status === 'Needs Attention' ? 'Warning' : item.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onInspect(item)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 hover:text-sky-700 rounded-lg text-xs font-bold transition-colors">
                      <Search size={14} /> Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function P3KMonitoring({ facilities, onInspect }: { facilities: any[], onInspect: (item: any) => void }) {
  const [searchTerm, setSearchTerm] = useState("");

  const data = facilities.map(f => ({
    id: f.code,
    rawId: f.id,
    lokasi: f.location?.name || "-",
    kelengkapan: f.specifications?.checklist || "100%",
    expired: f.last_inspected_at ? f.last_inspected_at.slice(0, 10) : "2026-08-20",
    status: f.status || "Good",
  }));

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari data P3K..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
          />
        </div>
      </div>
      <div className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-600">ID Kotak</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Lokasi</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Kelengkapan Standar</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Tgl Inspeksi</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                  <Inbox className="mx-auto mb-2 text-gray-300" size={32} />
                  Belum ada kotak P3K terdaftar.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-900">{item.id}</td>
                  <td className="px-6 py-4 text-gray-700">{item.lokasi}</td>
                  <td className="px-6 py-4 text-gray-700">{item.kelengkapan}</td>
                  <td className="px-6 py-4 text-gray-700">{item.expired}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status === 'Needs Attention' ? 'Warning' : item.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onInspect(item)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 hover:text-sky-700 rounded-lg text-xs font-bold transition-colors">
                      <Search size={14} /> Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SafetyMirrorMonitoring({ facilities, onInspect }: { facilities: any[], onInspect: (item: any) => void }) {
  const [searchTerm, setSearchTerm] = useState("");

  const data = facilities.map(f => ({
    id: f.code,
    rawId: f.id,
    lokasi: f.location?.name || "-",
    kondisi: f.specifications?.surface || "Bagus",
    posisi: f.specifications?.view || "Tepat",
    maintenance: f.last_inspected_at ? f.last_inspected_at.slice(0, 10) : "2026-08-20",
    status: f.status || "Good",
  }));

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari data Safety Mirror..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
          />
        </div>
      </div>
      <div className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-600">ID Cermin</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Lokasi (Blind Spot)</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Kondisi Kaca</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Posisi Angle</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Tgl Maintenance</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  <Inbox className="mx-auto mb-2 text-gray-300" size={32} />
                  Belum ada safety mirror terdaftar.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-900">{item.id}</td>
                  <td className="px-6 py-4 text-gray-700">{item.lokasi}</td>
                  <td className="px-6 py-4 text-gray-700">{item.kondisi}</td>
                  <td className="px-6 py-4 text-gray-700">{item.posisi}</td>
                  <td className="px-6 py-4 text-gray-700">{item.maintenance}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status === 'Needs Attention' ? 'Warning' : item.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onInspect(item)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 hover:text-sky-700 rounded-lg text-xs font-bold transition-colors">
                      <Search size={14} /> Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssemblyPointMonitoring({ facilities, onInspect }: { facilities: any[], onInspect: (item: any) => void }) {
  const [searchTerm, setSearchTerm] = useState("");

  const data = facilities.map(f => ({
    id: f.code,
    rawId: f.id,
    lokasi: f.location?.name || "-",
    plang: f.specifications?.signage || "Jelas",
    area: f.specifications?.capacity || "Bebas Rintangan",
    maintenance: f.last_inspected_at ? f.last_inspected_at.slice(0, 10) : "2026-08-20",
    status: f.status || "Good",
  }));

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari data Titik Kumpul..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
          />
        </div>
      </div>
      <div className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-600">ID Titik Kumpul</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Lokasi</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Rambu & Plang</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Kondisi Area</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Tgl Maintenance</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  <Inbox className="mx-auto mb-2 text-gray-300" size={32} />
                  Belum ada titik kumpul darurat terdaftar.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-900">{item.id}</td>
                  <td className="px-6 py-4 text-gray-700">{item.lokasi}</td>
                  <td className="px-6 py-4 text-gray-700">{item.plang}</td>
                  <td className="px-6 py-4 text-gray-700">{item.area}</td>
                  <td className="px-6 py-4 text-gray-700">{item.maintenance}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status === 'Needs Attention' ? 'Warning' : item.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onInspect(item)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 hover:text-sky-700 rounded-lg text-xs font-bold transition-colors">
                      <Search size={14} /> Inspect
                    </button>
                  </td>
                </tr>
              ))
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
function StatusBadge({ status }: { status: string }) {
  if (status === "Good") {
    return <span className="inline-block whitespace-nowrap bg-success-container text-on-success-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Aman</span>;
  }
  if (status === "Warning" || status === "Needs Attention") {
    return <span className="inline-block whitespace-nowrap bg-warning-container text-on-warning-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Butuh Perhatian</span>;
  }
  if (status === "Expired" || status === "Critical" || status === "Error") {
    return <span className="inline-block whitespace-nowrap bg-error-container text-on-error-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Kritis</span>;
  }
  return <span className="inline-block whitespace-nowrap bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>;
}
