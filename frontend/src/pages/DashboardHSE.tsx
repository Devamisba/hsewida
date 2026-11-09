import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { 
  Clock, 
  ShieldAlert, 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  FileCheck, 
  ScanLine, 
  AlertTriangle,
  ShieldCheck,
  ClipboardCheck,
  MapPin,
  Flame,
  ArrowRight,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

export default function DashboardHSEPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>({
    pendingReviewCount: 0,
    pendingReview: [],
    activeTotal: 0,
    activeHighRiskCount: 0,
    activeHighRisk: [],
    activeVendorsCount: 0,
    pieData: [],
    monitoring: {
      totalFacilities: 0,
      aparCount: 0,
      hydrantCount: 0,
      p3kCount: 0,
      emergencyDoorCount: 0,
      safetyMirrorCount: 0,
      assemblyPointCount: 0,
      otherCount: 0,
      checkedThisMonth: 0,
      uncheckedThisMonth: 0,
      inspectionPercentage: 0,
      daysLeftInMonth: 0,
      expiredCount: 0,
      refillQueueCount: 0,
      findingsCount: 0,
    },
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.getHseDashboard();
        let data = res.success && res.data ? res.data : {};

        // Fallback / Pengayaan jika monitoring object kosong
        if (!data.monitoring || data.monitoring.totalFacilities === 0) {
          try {
            const inspRes = await api.getAllInspections();
            if (inspRes.success && inspRes.data) {
              const s = inspRes.data.summary || {};
              const cat = inspRes.data.category_counts || {};
              data.monitoring = {
                ...data.monitoring,
                totalFacilities: s.total_facilities || s.total || data.monitoring?.totalFacilities || 0,
                aparCount: cat.apar || data.monitoring?.aparCount || 0,
                hydrantCount: cat.hydrant || data.monitoring?.hydrantCount || 0,
                p3kCount: cat.p3k || cat.kotak_p3k || data.monitoring?.p3kCount || 0,
                emergencyDoorCount: cat.emergency_door || data.monitoring?.emergencyDoorCount || 0,
                safetyMirrorCount: cat.safety_mirror || data.monitoring?.safetyMirrorCount || 0,
                assemblyPointCount: cat.assembly_point || data.monitoring?.assemblyPointCount || 0,
                otherCount: (cat.emergency_door || 0) + (cat.safety_mirror || 0) + (cat.assembly_point || 0),
                checkedThisMonth: s.checked_this_month ?? s.checked ?? data.monitoring?.checkedThisMonth ?? 0,
                uncheckedThisMonth: s.unchecked_this_month ?? s.unchecked ?? data.monitoring?.uncheckedThisMonth ?? 0,
                inspectionPercentage: s.percentage_this_month ?? data.monitoring?.inspectionPercentage ?? 0,
                daysLeftInMonth: s.days_left_in_month ?? data.monitoring?.daysLeftInMonth ?? 0,
                expiredCount: data.monitoring?.expiredCount || 0,
                refillQueueCount: data.monitoring?.refillQueueCount || 0,
                findingsCount: s.findings || data.monitoring?.findingsCount || 0,
              };
            }
          } catch {
            // Keep default structure
          }
        }

        setDashboardData(data);
      } catch (err: any) {
        console.warn("Could not fetch HSE dashboard:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background">
        <Header title="HSE Dashboard" />
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-32 h-32 bg-success/20 rounded-full animate-ping"></div>
            <img src="/logo.png" alt="Logo Widatra" className="relative w-28 h-auto object-contain animate-pulse z-10 drop-shadow-md" />
          </div>
          <p className="text-sm font-bold text-gray-500 animate-pulse tracking-wide">Memuat Data Portal HSE...</p>
        </div>
      </div>
    );
  }

  const monitoring = dashboardData.monitoring || {};

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <Header title="HSE Dashboard" />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Action Bar */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Portal Keselamatan Kerja (HSE)</h2>
              <p className="text-sm text-gray-500 mt-1">Pantau kepatuhan ijin kerja, JSA, dan kesiapan fasilitas keselamatan kerja hari ini.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <button 
                onClick={() => navigate('/review')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-success-container/30 text-success border border-success/30 px-3.5 py-2 rounded-lg hover:bg-success-container/50 transition-colors text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <ScanLine size={16} /> Antrean Review Ijin
              </button>
              <button 
                onClick={() => navigate('/monitoring')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-2 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <ShieldCheck size={16} /> Monitoring K3
              </button>
              <button 
                onClick={() => navigate('/inspeksi')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-3.5 py-2 rounded-lg hover:bg-amber-100 transition-colors text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <ClipboardCheck size={16} /> Inspeksi Lapangan
              </button>
            </div>
          </div>

          {/* Section 1: Work Permit Metrics - 4 Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard 
              title="Menunggu Review" 
              value={dashboardData.pendingReviewCount || 0} 
              icon={Clock} 
              color="error"
            />
            <MetricCard 
              title="Pekerjaan Aktif (Total)" 
              value={dashboardData.activeTotal || 0} 
              icon={CheckCircle2} 
              color="success"
            />
            <MetricCard 
              title="Aktif (Risiko Tinggi)" 
              value={dashboardData.activeHighRiskCount || 0} 
              icon={ShieldAlert} 
              color="warning" 
            />
            <MetricCard 
              title="Vendor Aktif" 
              value={dashboardData.activeVendorsCount || 0} 
              icon={Users} 
              color="info"
            />
          </div>

          {/* Section 2: MONITORING & INSPEKSI FASILITAS K3 (NEW) */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Kesiapan Fasilitas & Kepatuhan Inspeksi K3</h3>
                  <p className="text-xs text-gray-500">Pemantauan 6 fasilitas keselamatan dan progress checklist lapangan bulan ini</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate('/gis-map')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                >
                  <MapPin size={14} className="text-blue-600" />
                  Peta GIS
                </button>
                <button 
                  onClick={() => navigate('/monitoring')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
                >
                  Kelola Fasilitas
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Total Fasilitas */}
              <div 
                onClick={() => navigate('/monitoring')}
                className="p-4 rounded-xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100 hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-800">Total Fasilitas K3</span>
                  <Flame size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {(monitoring.totalFacilities || 0).toLocaleString()} <span className="text-xs font-normal text-gray-500">Unit</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-2 truncate">
                  {monitoring.aparCount || 0} APAR · {monitoring.hydrantCount || 0} Hydrant · {monitoring.p3kCount || 0} P3K
                </p>
              </div>

              {/* Card 2: Kepatuhan Inspeksi Bulan Ini */}
              <div 
                onClick={() => navigate('/inspeksi')}
                className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/60 to-teal-50/40 border border-emerald-100 hover:border-emerald-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-800">Inspeksi Bulan Ini</span>
                  <ClipboardCheck size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-gray-900">
                    {monitoring.checkedThisMonth || 0} <span className="text-xs font-normal text-gray-500">/ {monitoring.totalFacilities || 0}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {monitoring.inspectionPercentage || 0}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-emerald-200/50 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(0, monitoring.inspectionPercentage || 0))}%` }}
                  />
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-1.5">
                  Sisa {monitoring.daysLeftInMonth || 0} hari kerja bulan ini
                </p>
              </div>

              {/* Card 3: Belum Diperiksa */}
              <div 
                onClick={() => navigate('/inspeksi')}
                className="p-4 rounded-xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 border border-amber-100 hover:border-amber-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-800">Belum Dicek Bulan Ini</span>
                  <Clock size={18} className="text-amber-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {monitoring.uncheckedThisMonth || 0} <span className="text-xs font-normal text-gray-500">Unit</span>
                </div>
                <p className="text-[11px] text-amber-700 font-medium mt-2 flex items-center gap-1">
                  <span>Perlu checklist fisik petugas</span>
                  <ChevronRight size={12} />
                </p>
              </div>

              {/* Card 4: Antrean Refill & Temuan */}
              <div 
                onClick={() => navigate('/monitoring')}
                className="p-4 rounded-xl bg-gradient-to-br from-rose-50/60 to-pink-50/40 border border-rose-100 hover:border-rose-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-rose-800">Perhatian & Refill</span>
                  <AlertTriangle size={18} className="text-rose-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {(monitoring.expiredCount || 0) + (monitoring.refillQueueCount || 0)} <span className="text-xs font-normal text-gray-500">Unit</span>
                </div>
                <p className="text-[11px] text-rose-700 font-medium mt-2 truncate">
                  {monitoring.refillQueueCount || 0} antrean isi ulang · {monitoring.findingsCount || 0} temuan
                </p>
              </div>

            </div>
          </div>

          {/* Section 3: Tables & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              {/* Table: Butuh Persetujuan Segera */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 md:p-5 border-b border-error-container bg-error-container/10 flex justify-between items-center">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <FileCheck size={18} className="text-error" />
                    Butuh Persetujuan Segera (Pending)
                  </h3>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-600">ID & Pekerjaan</th>
                        <th className="px-4 py-3 font-semibold text-gray-600">Vendor</th>
                        <th className="px-4 py-3 font-semibold text-gray-600">Mulai</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dashboardData.pendingReview && dashboardData.pendingReview.length > 0 ? (
                        dashboardData.pendingReview.map((req: any) => (
                          <tr key={req.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-900">{req.id}</div>
                              <div className="text-gray-500 mt-0.5">{req.jenis}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{req.kontraktor}</td>
                            <td className="px-4 py-3 text-gray-700">{req.mulai}</td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={() => navigate('/review')}
                                className="inline-flex items-center gap-1 bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                              >
                                Review <ChevronRight size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            <CheckCircle2 size={28} className="mx-auto mb-1 text-emerald-500 opacity-60" />
                            <p className="text-xs font-semibold text-gray-700">Tidak ada antrean pending</p>
                            <p className="text-[11px] text-gray-400">Seluruh dokumen telah diperiksa.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table: Pekerjaan Risiko Tinggi Aktif Hari Ini (HSE Patrol Focus) */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 md:p-5 border-b border-warning-container bg-warning-container/10 flex justify-between items-center">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-warning" />
                    Fokus Patroli: Risiko Tinggi Hari Ini
                  </h3>
                </div>
                <div className="p-0">
                  {dashboardData.activeHighRisk && dashboardData.activeHighRisk.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {dashboardData.activeHighRisk.map((job: any) => (
                        <li key={job.id} className="p-4 hover:bg-gray-50/50 transition-colors flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{job.id} • {job.jenis}</p>
                            <p className="text-xs text-gray-500 mt-1">Lokasi: {job.lokasi}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <div className="flex gap-1">
                              {job.permitTypes && job.permitTypes.map((pt: string) => (
                                <span key={pt} className="inline-flex w-max items-center justify-center bg-rose-50 text-rose-700 border border-rose-200 px-3 py-0.5 rounded-full text-xs font-bold">{pt}</span>
                              ))}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <ShieldAlert size={32} className="mx-auto mb-2 text-emerald-500 opacity-60" />
                      <p className="text-sm font-medium text-gray-800">Tidak ada pekerjaan risiko tinggi aktif</p>
                      <p className="text-xs text-gray-400 mt-0.5">Seluruh pekerjaan saat ini berada pada klasifikasi aman / risiko umum.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kanan: Grafik Profil Risiko & Fasilitas Widget */}
            <div className="space-y-6">
              {/* Card 1: Grafik Profil Risiko */}
              <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gray-900">Profil Risiko Ijin Aktif</h3>
                  <p className="text-xs text-gray-500 mt-1">Distribusi ijin berdasarkan klasifikasi bahaya</p>
                </div>
                
                <div className="min-h-[220px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={dashboardData.pieData && dashboardData.pieData.length > 0 ? dashboardData.pieData : [{ name: 'Umum', value: 100, color: '#3b82f6' }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(dashboardData.pieData && dashboardData.pieData.length > 0 ? dashboardData.pieData : [{ color: '#3b82f6' }]).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 2: 6 Kategori Fasilitas K3 Quick Overview */}
              <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Layers size={16} className="text-blue-600" />
                    Kategori Fasilitas K3
                  </h3>
                  <span className="text-xs font-semibold text-gray-400">6 Kategori</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <span className="font-medium text-gray-700">🧯 APAR</span>
                    <span className="font-bold text-gray-900">{monitoring.aparCount || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <span className="font-medium text-gray-700">🚒 Hydrant</span>
                    <span className="font-bold text-gray-900">{monitoring.hydrantCount || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <span className="font-medium text-gray-700">🩹 Kotak P3K</span>
                    <span className="font-bold text-gray-900">{monitoring.p3kCount || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <span className="font-medium text-gray-700">🚪 Exit Door</span>
                    <span className="font-bold text-gray-900">{monitoring.otherCount ? Math.round(monitoring.otherCount / 3) : 0}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <span className="font-medium text-gray-700">🪞 Cermin</span>
                    <span className="font-bold text-gray-900">{monitoring.otherCount ? Math.round(monitoring.otherCount / 3) : 0}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <span className="font-medium text-gray-700">🚩 Assembly</span>
                    <span className="font-bold text-gray-900">{monitoring.otherCount ? Math.max(1, Math.round(monitoring.otherCount / 3)) : 0}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                  <button 
                    onClick={() => navigate('/gis-map')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} /> Peta GIS Geofence (500m)
                    </span>
                    <ArrowRight size={14} />
                  </button>
                  <button 
                    onClick={() => navigate('/monitoring')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" /> Antrean Refill APAR
                    </span>
                    <ArrowRight size={14} />
                  </button>
                </div>
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
