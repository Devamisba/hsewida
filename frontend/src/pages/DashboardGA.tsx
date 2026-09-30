import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Clock, Users, Building, FileCheck, CheckCircle2, ChevronRight, Contact } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

export default function DashboardGAPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>({
    pendingValidationCount: 0,
    pendingValidation: [],
    activeWorkersCount: 0,
    registeredVendorsCount: 0,
    activeWorkers: [],
  });
  const navigate = useNavigate();

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
              <h2 className="text-2xl font-bold text-gray-900">Portal HRD & GA (Persetujuan Ijin Kerja)</h2>
              <p className="text-sm text-gray-500 mt-1">Validasi data pekerja pihak ketiga, kepatuhan K3, dan akses masuk area pabrik.</p>
            </div>
          </div>

          {/* Section 1: GA Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard 
              title="Menunggu Validasi GA" 
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
            
            {/* Kiri: Ijin Menunggu Validasi GA */}
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
                          <p className="text-xs font-semibold text-gray-700">Tidak ada permit menunggu validasi GA</p>
                          <p className="text-[11px] text-gray-400">Semua ijin telah selesai ditinjau.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Kanan: Pekerja Eksternal Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 md:p-5 border-b border-info-container bg-info-container/10 flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Contact size={18} className="text-info" />
                  Monitor Pekerja Pihak Ketiga (Hari Ini)
                </h3>
              </div>
              <div className="p-0">
                {dashboardData.activeWorkers && dashboardData.activeWorkers.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {dashboardData.activeWorkers.map((pekerja: any, i: number) => (
                      <li key={i} className="p-4 hover:bg-gray-50/50 transition-colors flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{pekerja.nama} <span className="text-xs font-normal text-gray-500">({pekerja.jabatan})</span></p>
                          <p className="text-xs text-gray-500 mt-1">{pekerja.kontraktor}</p>
                        </div>
                        <div>
                          <span className="bg-success/10 text-success border border-success/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                            <CheckCircle2 size={12} /> {pekerja.status || 'In Area'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Users size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-medium text-gray-800">Tidak ada pekerja eksternal di area hari ini.</p>
                    <p className="text-xs text-gray-400 mt-0.5">Daftar nama pekerja akan aktif saat permit disetujui dan tanggal kerja dimulai.</p>
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
