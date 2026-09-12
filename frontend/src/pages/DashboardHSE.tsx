import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Clock, ShieldAlert, Users, CheckCircle2, ChevronRight, FileCheck, ScanLine, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";

// Dummy Data untuk HSE
const DUMMY_PENDING_REVIEW = [
  { id: "WP-2608-058", kontraktor: "PT Bangun Karya", jenis: "Pengelasan Pipa", lokasi: "Area Tangki A", mulai: "2026-08-21", risiko: "Tinggi" },
  { id: "WP-2608-059", kontraktor: "CV Berkah Jaya", jenis: "Pemasangan CCTV", lokasi: "Gudang B", mulai: "2026-08-21", risiko: "Rendah" },
];

const DUMMY_ACTIVE_HIGH_RISK = [
  { id: "WP-2608-050", jenis: "Pembersihan Silo", lokasi: "Area Pabrik 1", permitTypes: ["Ruang Terbatas"] },
  { id: "WP-2608-055", jenis: "Perbaikan Atap", lokasi: "Gudang Utama", permitTypes: ["Ketinggian"] },
];

const PIE_DATA = [
  { name: 'Ketinggian', value: 30, color: '#f59e0b' },
  { name: 'Panas', value: 40, color: '#ef4444' },
  { name: 'Ruang Terbatas', value: 15, color: '#6366f1' },
  { name: 'Umum', value: 15, color: '#10b981' },
];

export default function DashboardHSEPage() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
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
              <h2 className="text-2xl font-bold text-gray-900">Portal PIC HSE</h2>
              <p className="text-sm text-gray-500 mt-1">Pantau kepatuhan, review JSA, dan amankan area kerja hari ini.</p>
            </div>
            
            <div className="flex gap-2 w-full lg:w-auto">
              <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-success-container/30 text-success border border-success/30 px-4 py-2.5 rounded-lg hover:bg-success-container/50 transition-colors text-sm font-semibold">
                <ScanLine size={18} /> Scan Permit (QR)
              </button>
            </div>
          </div>

          {/* Section 1: HSE Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Menunggu Review" 
              value={DUMMY_PENDING_REVIEW.length} 
              icon={Clock} 
              color="error" // Red indicates action needed urgently
            />
            <MetricCard 
              title="Pekerjaan Aktif (Total)" 
              value="12" 
              icon={CheckCircle2} 
              color="success"
            />
            <MetricCard 
              title="Aktif (Risiko Tinggi)" 
              value="5" 
              icon={ShieldAlert} 
              color="warning" 
            />
            <MetricCard 
              title="Vendor Aktif" 
              value="8" 
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
                      {DUMMY_PENDING_REVIEW.map((req) => (
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
                              className="inline-flex items-center gap-1 bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                            >
                              Review <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
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
                  <ul className="divide-y divide-gray-100">
                    {DUMMY_ACTIVE_HIGH_RISK.map((job) => (
                      <li key={job.id} className="p-4 hover:bg-gray-50/50 transition-colors flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{job.id} • {job.jenis}</p>
                          <p className="text-xs text-gray-500 mt-1">Lokasi: {job.lokasi}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <div className="flex gap-1">
                            {job.permitTypes.map(pt => (
                              <span key={pt} className="inline-flex w-max items-center justify-center bg-gray-100 text-gray-600 border border-gray-200 px-3 py-0.5 rounded-full text-xs font-bold">{pt}</span>
                            ))}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
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
                      data={PIE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {PIE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
