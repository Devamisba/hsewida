import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Clock, ShieldAlert, Users, CheckCircle2, ChevronRight, FileCheck, ScanLine, AlertTriangle } from "lucide-react";
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
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.getHseDashboard();
        if (res.success && res.data) {
          setDashboardData(res.data);
        }
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
          <p className="text-sm font-bold text-gray-500 animate-pulse tracking-wide">Memuat Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <Header title="HSE Dashboard" />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Portal Keselamatan Kerja (HSE)</h2>
              <p className="text-sm text-gray-500 mt-1">Pantau kepatuhan, review JSA, dan amankan area kerja hari ini.</p>
            </div>
            
            <div className="flex gap-2 w-full lg:w-auto">
              <button 
                onClick={() => navigate('/review')}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-success-container/30 text-success border border-success/30 px-4 py-2.5 rounded-lg hover:bg-success-container/50 transition-colors text-sm font-semibold cursor-pointer"
              >
                <ScanLine size={18} /> Antrean Review Ijin
              </button>
            </div>
          </div>

          {/* Section 1: HSE Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              {/* Table: Butuh Persetujuan Segera */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
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

            {/* Kanan: Grafik Profil Risiko */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900">Profil Risiko Ijin Aktif</h3>
                <p className="text-xs text-gray-500 mt-1">Distribusi ijin berdasarkan klasifikasi bahaya</p>
              </div>
              
              <div className="flex-1 min-h-[250px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dashboardData.pieData && dashboardData.pieData.length > 0 ? dashboardData.pieData : [{ name: 'Umum', value: 100, color: '#3b82f6' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
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
