import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Activity, ShieldCheck, AlertTriangle, PlusCircle, CalendarPlus, Clock, CheckCircle2, FileText, ArrowRight, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { auth } from "@/lib/auth";
import { WorkPermitDetailModal, mapApiToPermitDetail } from "@/components/WorkPermitDetailModal";

export default function DashboardPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [dashboardData, setDashboardData] = useState<any>({
    pendingCount: 0,
    activeCount: 0,
    activeToday: [],
    expiringSoonCount: 0,
    safeManHours: 0,
    chartData: [],
  });
  const [selectedPermit, setSelectedPermit] = useState<any | null>(null);
  const [loadingPermitId, setLoadingPermitId] = useState<string | number | null>(null);
  const [extensionWindowDays, setExtensionWindowDays] = useState(3);
  const navigate = useNavigate();
  const userName = auth.getUser()?.name || "Mitra Rekanan PT Widatra Bhakti";
  const userRole = auth.getRole();
  const isVendorRole = ["pemohon", "vendor", "kontraktor", "contractor"].includes((userRole || "").toLowerCase().trim());

  useEffect(() => {
    api.getSettings().then(sRes => {
      if (sRes?.success && sRes.data?.map?.extension_window_days) {
        setExtensionWindowDays(Number(sRes.data.map.extension_window_days) || 3);
      }
    }).catch(() => {});
  }, []);

  const handleOpenPermit = async (job: any) => {
    const permitIdentifier = job.permit_id || job.id;
    if (!permitIdentifier) return;

    setLoadingPermitId(job.id);
    try {
      const res = await api.getPermitDetail(permitIdentifier);
      if (res?.success && res.data) {
        const mapped = mapApiToPermitDetail(res.data);
        setSelectedPermit(mapped);
      } else {
        alert("Gagal memuat rincian izin kerja.");
      }
    } catch (err: any) {
      console.error("Error opening permit detail:", err);
      alert("Gagal memuat rincian izin kerja: " + (err.message || "Terjadi kesalahan server"));
    } finally {
      setLoadingPermitId(null);
    }
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
        rootPermitId: req.rootPermitId || req.rawId,
        rootPermitNumber: req.rootPermit?.permitNumber || req.id,
        rootStartDate: req.cumulativeStartDate || req.rootPermit?.startDate || req.mulaiKerja,
        parentPermitId: req.rawId,
        parentPermitNumber: req.id,
        ...req 
      } 
    });
  };

  const handleResubmit = (req: any) => {
    navigate("/create-request", { 
      state: { 
        resubmitMode: true, 
        originalId: req.rawId || req.id, 
        permitNumber: req.id,
        rejectReason: req.rejectReason || req.alasanPenolakan,
        ...req 
      } 
    });
  };

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      if (!initialLoading) {
        setChartLoading(true);
      }
      try {
        const res = await api.getContractorDashboard({ period: chartPeriod });
        if (isMounted && res.success && res.data) {
          setDashboardData(res.data);
        }
      } catch (err: any) {
        console.warn("Could not fetch contractor dashboard:", err.message);
      } finally {
        if (isMounted) {
          setInitialLoading(false);
          setChartLoading(false);
        }
      }
    };
    fetchDashboard();
    return () => { isMounted = false; };
  }, [chartPeriod]);

  if (initialLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background">
        <Header title="Dashboard" />
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-32 h-32 bg-primary/20 rounded-full animate-ping"></div>
            <img src="/logo.png" alt="Logo Widatra" className="relative w-28 h-auto object-contain animate-pulse z-10 drop-shadow-md" />
          </div>
          <p className="text-sm font-bold text-gray-500 animate-pulse tracking-wide">Memuat Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <Header title="Dashboard" />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Welcome & Alert Section */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Selamat Datang, {userName}!</h2>
              <p className="text-sm text-gray-500 mt-1">Pantau status izin kerja operasional Anda hari ini.</p>
            </div>
          </div>
{/* Alert K3 */}
{dashboardData.expiringSoonCount > 0 && (
  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-md mb-4">
    <AlertTriangle size={20} />
    <span className="font-medium">Ada izin yang akan berakhir dalam 3 hari ke depan. Segera periksa dan perpanjang!</span>
    <button onClick={() => navigate(isVendorRole ? '/my-requests' : '/history', { state: { filterExpiringSoon: true } })} className="ml-auto text-rose-600 hover:underline font-semibold">
      Lihat Detail
    </button>
  </div>
)}

          {/* Section 1: Summary Cards - 2x2 Grid on Mobile, 4-Cols on Desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard 
              title="Menunggu Approval" 
              value={dashboardData.pendingCount || 0} 
              icon={Clock} 
              color="warning"
            />
            <MetricCard 
              title="Aktif Hari Ini" 
              value={dashboardData.activeCount || 0} 
              icon={Activity} 
              color="info"
            />
            <MetricCard 
              title="Segera Berakhir (H-3)" 
              value={dashboardData.expiringSoonCount || 0} 
              icon={AlertTriangle} 
              color="error"
            />
            <MetricCard 
              title="Safe Man-Hours" 
              value={(dashboardData.safeManHours || 0).toLocaleString()} 
              icon={ShieldCheck} 
              color="success"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Kiri: Quick Actions & Pekerjaan Aktif */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Section 2: Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => navigate('/create-request')}
                  className="group bg-slate-900 hover:bg-slate-800 text-white p-4 sm:p-5 rounded-xl shadow-xs transition-all flex items-center justify-between text-left cursor-pointer border border-slate-800 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                      <PlusCircle size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-white">Buat Izin Baru</h3>
                      <p className="text-slate-400 text-xs mt-0.5">Ajukan Work Permit keselamatan baru</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                <button 
                  onClick={() => navigate(isVendorRole ? '/my-requests' : '/history')}
                  className="group bg-white border border-gray-200 text-gray-800 p-4 sm:p-5 rounded-xl shadow-xs hover:border-gray-300 hover:bg-gray-50/70 transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0 group-hover:scale-105 transition-transform">
                      <CalendarPlus size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-gray-900">Perpanjang Izin</h3>
                      <p className="text-gray-500 text-xs mt-0.5">Cek izin aktif & ajukan perpanjangan</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              </div>

              {/* Section 3: Today's Active Permits Mini-table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-success" />
                    Pekerjaan Aktif Hari Ini
                  </h3>
                  <button onClick={() => navigate('/my-requests')} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    Lihat Semua <ArrowRight size={14} />
                  </button>
                </div>
                <div className="p-0">
                  {dashboardData.activeToday && dashboardData.activeToday.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {dashboardData.activeToday.map((job: any) => (
                        <li key={job.id} className="p-4 hover:bg-gray-50/50 transition-colors flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{job.id}</p>
                            <p className="text-xs text-gray-500 mt-1">{job.jobName} • {job.location}</p>
                          </div>
                          <div className="text-right">
                            <span className="block text-xs font-medium text-gray-500">{job.shift}</span>
                            <button 
                              type="button"
                              disabled={loadingPermitId === job.id}
                              onClick={() => handleOpenPermit(job)}
                              className="mt-2 text-xs font-semibold text-primary hover:text-primary/80 bg-primary-container/20 hover:bg-primary-container/30 px-3 py-1.5 rounded cursor-pointer transition-colors inline-flex items-center gap-1.5 disabled:opacity-60"
                            >
                              {loadingPermitId === job.id ? (
                                <>
                                  <Loader2 size={12} className="animate-spin" /> Memuat...
                                </>
                              ) : (
                                "Buka Permit"
                              )}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <FileText size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm font-medium text-gray-800">Tidak ada pekerjaan aktif hari ini.</p>
                      <p className="text-xs text-gray-400 mt-0.5">Izin kerja yang telah disetujui akan muncul saat tanggal kerja tiba.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kanan: Grafik Aktivitas */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900">Aktivitas Pengajuan Izin</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboardData.periodSubtitle || (
                    chartPeriod === 'daily' ? 'Tren izin kerja 7 hari terakhir' :
                    chartPeriod === 'weekly' ? 'Tren izin kerja 4 minggu terakhir' :
                    chartPeriod === 'yearly' ? 'Tren izin kerja 5 tahun terakhir' :
                    'Tren izin kerja 6 bulan terakhir'
                  )}
                </p>
              </div>
              
              <div className={cn("flex-1 min-h-[250px] w-full transition-opacity duration-200", chartLoading && "opacity-50")}>
  <div className="flex gap-2 mt-2 mb-4">
    {(['daily','weekly','monthly','yearly'] as const).map(p => (
      <button
        key={p}
        onClick={() => setChartPeriod(p)}
        className={cn(
          "px-3 py-1 rounded text-sm font-medium cursor-pointer transition-colors",
          p === chartPeriod ? "bg-primary text-on-primary" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        )}
      >
        {p.charAt(0).toUpperCase() + p.slice(1)}
      </button>
    ))}
  </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.chartData || []} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} />
                    <Tooltip 
                      cursor={{fill: '#f3f4f6'}}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }} 
                    />
                    <Bar dataKey="pengajuan" name="Total Pengajuan" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="disetujui" name="Disetujui" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ditolak" name="Ditolak" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Modal Detail Izin Kerja Aktif */}
      <WorkPermitDetailModal
        permit={selectedPermit}
        onClose={() => setSelectedPermit(null)}
        onExtend={handleExtend}
        onResubmit={handleResubmit}
        extensionWindowDays={extensionWindowDays}
      />
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
    <div className="bg-white p-3.5 sm:p-5 rounded-xl shadow-xs border border-gray-200 flex items-center gap-3 sm:gap-4 hover:-translate-y-0.5 transition-transform duration-200">
      <div className={cn("p-2.5 sm:p-4 rounded-xl shrink-0", colorMap[color] || "bg-gray-100 text-gray-600")}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] sm:text-xs font-semibold text-gray-500 mb-0.5 sm:mb-1 truncate">{title}</p>
        <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  );
}


