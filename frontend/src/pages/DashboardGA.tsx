import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Clock, Users, Building, Building2, FileCheck, CheckCircle2, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

export default function DashboardGAPage() {
  const [loading, setLoading] = useState(true);
  const [expandedVendors, setExpandedVendors] = useState<Record<string, boolean>>({});
  const [dashboardData, setDashboardData] = useState<any>({
    pendingValidationCount: 0,
    pendingValidation: [],
    activeVendorsCount: 0,
    activeVendors: [],
    activeWorkersCount: 0,
    registeredVendorsCount: 0,
    activeWorkers: [],
  });
  const navigate = useNavigate();

  const toggleExpandVendor = (vendorName: string) => {
    setExpandedVendors(prev => ({
      ...prev,
      [vendorName]: !prev[vendorName]
    }));
  };

  const activeVendorsList = useMemo(() => {
    if (dashboardData.activeVendors && Array.isArray(dashboardData.activeVendors) && dashboardData.activeVendors.length > 0) {
      return dashboardData.activeVendors;
    }

    if (dashboardData.activeWorkers && Array.isArray(dashboardData.activeWorkers) && dashboardData.activeWorkers.length > 0) {
      const groups: Record<string, any> = {};
      dashboardData.activeWorkers.forEach((w: any) => {
        const k = w.kontraktor || 'Vendor Eksternal';
        if (!groups[k]) {
          groups[k] = {
            nama: k,
            total_pekerja: 0,
            status: 'IN AREA',
            pekerjaan: '',
            workers: []
          };
        }
        groups[k].total_pekerja += 1;
        groups[k].workers.push({
          nama: w.nama,
          jabatan: w.jabatan
        });
      });
      return Object.values(groups);
    }

    return [];
  }, [dashboardData]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.getGaDashboard();
        if (res.success && res.data) {
          setDashboardData(res.data);
        }
      } catch (err: any) {
        console.warn("Could not fetch GA dashboard:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background">
        <Header title="GA/HRD Dashboard" />
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-32 h-32 bg-info/20 rounded-full animate-ping"></div>
            <img src="/logo.png" alt="Logo Widatra" className="relative w-28 h-auto object-contain animate-pulse z-10 drop-shadow-md" />
          </div>
          <p className="text-sm font-bold text-gray-500 animate-pulse tracking-wide">Memuat Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <Header title="Dashboard HRD & GA" />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Portal HRD & GA (Persetujuan Izin Kerja)</h2>
              <p className="text-sm text-gray-500 mt-1">Validasi data pekerja pihak ketiga, kepatuhan K3, dan akses masuk area pabrik.</p>
            </div>
          </div>

          {/* Section 1: GA Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard 
              title="Menunggu Validasi" 
              value={dashboardData.pendingValidationCount || 0} 
              icon={Clock} 
              color="warning" 
            />
            <MetricCard 
              title="Pekerja Eksternal Aktif" 
              value={dashboardData.activeWorkersCount || 0} 
              icon={Users} 
              color="info"
            />
            <MetricCard 
              title="Vendor Terdaftar" 
              value={dashboardData.registeredVendorsCount || 0} 
              icon={Building} 
              color="success"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Kiri: Izin Menunggu Validasi */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 md:p-5 border-b border-warning-container bg-warning-container/10 flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileCheck size={18} className="text-warning" />
                  Butuh Persetujuan Akhir (Final Approval)
                </h3>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-600">ID & Pekerjaan</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Info Eksternal</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboardData.pendingValidation && dashboardData.pendingValidation.length > 0 ? (
                      dashboardData.pendingValidation.map((req: any) => (
                        <tr key={req.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900">{req.id}</div>
                            <div className="text-gray-500 mt-0.5">{req.jenis}</div>
                            <span className="inline-block mt-1 bg-success-container text-on-success-container text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">✓ {req.statusHSE || 'Lolos HSE'}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <div>{req.kontraktor}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{req.pekerja} Orang Pekerja</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => navigate('/review')}
                              className="inline-flex items-center gap-1 bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                            >
                              Review & Setujui <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          <CheckCircle2 size={28} className="mx-auto mb-1 text-emerald-500 opacity-60" />
                          <p className="text-xs font-semibold text-gray-700">Tidak ada permit menunggu validasi</p>
                          <p className="text-[11px] text-gray-400">Semua izin telah selesai ditinjau.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Kanan: Monitor Vendor (Hari Ini) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 md:p-5 border-b border-info-container bg-info-container/10 flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Building2 size={18} className="text-info" />
                  Monitor Vendor (Hari Ini)
                </h3>
                {activeVendorsList.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {activeVendorsList.length} Vendor Aktif
                  </span>
                )}
              </div>
              <div className="p-0">
                {activeVendorsList.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {activeVendorsList.map((vendor: any, i: number) => {
                      const isExpanded = !!expandedVendors[vendor.nama];
                      const hasWorkerList = vendor.workers && vendor.workers.length > 0;

                      return (
                        <li key={i} className="p-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {vendor.nama}
                              </p>
                              <p className="text-xs text-gray-600 font-medium mt-0.5">
                                Pekerja : <span className="font-bold text-gray-900">{vendor.total_pekerja}</span>
                              </p>
                              {vendor.pekerjaan && (
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                  Pekerjaan: {vendor.pekerjaan}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className="bg-success/10 text-success border border-success/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                <CheckCircle2 size={12} /> {vendor.status || 'IN AREA'}
                              </span>
                              {hasWorkerList && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandVendor(vendor.nama)}
                                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-0.5 cursor-pointer mt-0.5"
                                >
                                  <span>{isExpanded ? "Tutup Rincian" : "Lihat Rincian"}</span>
                                  <ChevronDown size={12} className={cn("transition-transform", isExpanded && "rotate-180")} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Accordion Rincian Nama Pekerja */}
                          {isExpanded && hasWorkerList && (
                            <div className="mt-3 pt-3 border-t border-gray-100 bg-slate-50/70 p-3 rounded-xl animate-in fade-in">
                              <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                                Rincian Nama Pekerja ({vendor.workers.length} Orang):
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {vendor.workers.map((w: any, idx: number) => (
                                  <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200/80 flex items-center justify-between">
                                    <span className="font-semibold text-gray-800 truncate">{w.nama}</span>
                                    <span className="text-[10px] text-gray-500 shrink-0 ml-1">({w.jabatan || 'Pekerja'})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Building2 size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-medium text-gray-800">Tidak ada vendor berkegiatan di area hari ini.</p>
                    <p className="text-xs text-gray-400 mt-0.5">Daftar vendor akan aktif saat izin kerja disetujui dan tanggal kerja dimulai.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// --- Subcomponents ---
function MetricCard({ title, value, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    info: "bg-info-container text-on-info-container",
    success: "bg-success-container text-on-success-container",
    warning: "bg-warning-container text-on-warning-container",
    error: "bg-error-container text-on-error-container",
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-200">
      <div className={cn("p-4 rounded-full", colorMap[color] || "bg-gray-100 text-gray-600")}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  );
}
