import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Activity, ShieldCheck, AlertTriangle, PlusCircle, CalendarPlus, Clock, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

// Dummy Data untuk Dashboard User/Kontraktor
const DUMMY_ACTIVE_TODAY = [
  { id: "WP-2608-050", jobName: "Pembersihan Silo", location: "Area Pabrik 1", shift: "08:00 - 16:00" },
  { id: "WP-2608-042", jobName: "Inspeksi Jalur Pipa", location: "Blok C", shift: "09:00 - 17:00" },
];

const DUMMY_CHART_DATA = [
  { name: 'Jan', pengajuan: 4, disetujui: 4 },
  { name: 'Feb', pengajuan: 6, disetujui: 5 },
  { name: 'Mar', pengajuan: 3, disetujui: 3 },
  { name: 'Apr', pengajuan: 8, disetujui: 7 },
  { name: 'Mei', pengajuan: 5, disetujui: 5 },
  { name: 'Jun', pengajuan: 9, disetujui: 8 },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulasi loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
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
              <h2 className="text-2xl font-bold text-gray-900">Selamat Pagi, PT Maju Terus!</h2>
              <p className="text-sm text-gray-500 mt-1">Pantau status ijin kerja operasional Anda hari ini.</p>
            </div>
          </div>

          {/* Section 1: Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Menunggu Approval" 
              value="2" 
              icon={Clock} 
              color="warning"
            />
            <MetricCard 
              title="Aktif Hari Ini" 
              value="2" 
              icon={Activity} 
              color="info"
            />
            <MetricCard 
              title="Segera Berakhir (H-3)" 
              value="1" 
              icon={AlertTriangle} 
              color="error" // using error/danger red as it's an urgent action
            />
            <MetricCard 
              title="Safe Man-Hours" 
              value="1,450" 
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
                  className="group bg-primary text-on-primary p-5 rounded-xl shadow-sm hover:opacity-90 transition-all flex flex-col justify-between h-32 relative overflow-hidden"
                >
                  <PlusCircle size={28} className="mb-2" />
                  <div className="text-left relative z-10">
                    <h3 className="font-bold text-lg">Buat Ijin Baru</h3>
                    <p className="text-primary-container text-xs opacity-90 mt-1">Ajukan Work Permit baru</p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    <PlusCircle size={100} />
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/history')}
                  className="group bg-white border border-gray-200 text-gray-800 p-5 rounded-xl shadow-sm hover:bg-gray-50 transition-all flex flex-col justify-between h-32 relative overflow-hidden"
                >
                  <CalendarPlus size={28} className="mb-2 text-warning" />
                  <div className="text-left relative z-10">
                    <h3 className="font-bold text-lg">Perpanjang Ijin</h3>
                    <p className="text-gray-500 text-xs mt-1">Cek Ijin H-3 di History</p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                    <CalendarPlus size={100} />
                  </div>
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
                  {DUMMY_ACTIVE_TODAY.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {DUMMY_ACTIVE_TODAY.map((job) => (
                        <li key={job.id} className="p-4 hover:bg-gray-50/50 transition-colors flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{job.id}</p>
                            <p className="text-xs text-gray-500 mt-1">{job.jobName} • {job.location}</p>
                          </div>
                          <div className="text-right">
                            <span className="block text-xs font-medium text-gray-500">{job.shift}</span>
                            <button 
                              onClick={() => navigate('/my-requests')}
                              className="mt-2 text-xs font-semibold text-primary hover:text-primary/80 bg-primary-container/20 px-3 py-1.5 rounded"
                            >
                              Buka Permit
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <FileText size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Tidak ada pekerjaan aktif hari ini.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kanan: Grafik Aktivitas */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900">Aktivitas Pengajuan Ijin</h3>
                <p className="text-xs text-gray-500 mt-1">Tren ijin kerja 6 bulan terakhir</p>
              </div>
              
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={DUMMY_CHART_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} />
                    <Tooltip 
                      cursor={{fill: '#f3f4f6'}}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <Bar dataKey="pengajuan" name="Total Pengajuan" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="disetujui" name="Disetujui" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
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


