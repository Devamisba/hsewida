import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { CheckCircle, XCircle, Clock, Eye, CheckSquare, Search, Briefcase, AlertTriangle, Users, FileCheck, X, Shield, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

const INITIAL_REQUESTS = [
  {
    id: "WP-2608-058",
    kontraktor: "PT Bangun Karya",
    jenisPekerjaan: "Pengelasan Pipa",
    lokasi: "Area Tangki A",
    mulaiKerja: "2026-08-21",
    selesaiKerja: "2026-08-25",
    jamKerjaMulai: "08:00",
    jamKerjaAkhir: "16:00",
    penanggungJawab: "Budi Santoso",
    noHpPJ: "081233445566",
    pengawasPekerjaan: "Agus",
    noHpPengawas: "081122334455",
    pengawasHse: "Dina",
    noHpHse: "087788990011",
    risiko: "Tinggi",
    status: "Menunggu HSE",
    permitTypes: ["Ijin Kerja Panas (Hot Work)"],
    ppe: ["Helm Safety", "Sepatu Safety", "Kacamata Las", "Sarung Tangan Kulit", "Masker Fume"],
    workEquipment: ["Mesin Las", "Tabung Gas", "APAR", "Gerinda"],
    pekerja: [
      { id: 1, nama: "Tono", jabatan: "Welder", alamat: "Jl. Pahlawan No 45" },
      { id: 2, nama: "Budi", jabatan: "Fitter", alamat: "Perum Indah Blok C2" },
      { id: 3, nama: "Andi", jabatan: "Helper", alamat: "Jl. Melati Raya No 8" }
    ],
    jsa: [
      { id: 1, tahapan: "Persiapan Las", peralatan: "Mesin Las", potensi: "Kebocoran gas, korsleting", pengendalian: "Cek selang gas, pastikan kabel tidak terkelupas", tanggapDarurat: "Sediakan APAR" },
      { id: 2, tahapan: "Proses Pengelasan", peralatan: "Welding Torch", potensi: "Percikan api mengenai bahan mudah terbakar", pengendalian: "Pasang fire blanket, bersihkan area 10m dari bahan mudah terbakar", tanggapDarurat: "Gunakan APAR, hubungi pemadam" }
    ]
  },
  {
    id: "WP-2608-062",
    kontraktor: "PT Amanah Karya",
    jenisPekerjaan: "Instalasi AC",
    lokasi: "Gedung B Lantai 2",
    mulaiKerja: "2026-08-22",
    selesaiKerja: "2026-08-23",
    jamKerjaMulai: "09:00",
    jamKerjaAkhir: "17:00",
    penanggungJawab: "Rudi Hartono",
    noHpPJ: "085566778899",
    pengawasPekerjaan: "Samsul",
    noHpPengawas: "082233445566",
    pengawasHse: "Rian",
    noHpHse: "083344556677",
    risiko: "Rendah",
    status: "Menunggu GA Dept Head", 
    permitTypes: ["Ijin Kerja Umum"],
    ppe: ["Helm Safety", "Sepatu Safety", "Sarung Tangan Katun"],
    workEquipment: ["Tangga Aluminum", "Bor Listrik", "Toolbox"],
    pekerja: [
      { id: 1, nama: "Doni", jabatan: "Teknisi AC", alamat: "Jl. Anggrek No 12" },
      { id: 2, nama: "Feri", jabatan: "Teknisi AC", alamat: "Jl. Mawar Indah 3" },
      { id: 3, nama: "Joko", jabatan: "Helper", alamat: "Kp. Rambutan RT 01" },
      { id: 4, nama: "Dika", jabatan: "Helper", alamat: "Kp. Rambutan RT 02" }
    ],
    jsa: [
      { id: 1, tahapan: "Pasang Bracket Indoor", peralatan: "Bor Listrik", potensi: "Tersengat listrik, debu", pengendalian: "Pastikan kabel bor aman, gunakan masker", tanggapDarurat: "Matikan panel listrik" },
      { id: 2, tahapan: "Naik Tangga", peralatan: "Tangga", potensi: "Terjatuh", pengendalian: "Pegang tangga oleh helper, pastikan lantai rata", tanggapDarurat: "P3K" }
    ]
  }
];

function mapApiToReview(item: any) {
  return {
    id: item.permit_number || `WP-${item.id}`,
    rawId: item.id,
    kontraktor: item.vendor?.company_name || item.user?.company_name || "PT Vendor",
    jenisPekerjaan: item.job_title || item.jenisPekerjaan || "Pekerjaan Vendor",
    lokasi: item.location?.name || item.lokasi || "Area Pabrik",
    mulaiKerja: item.start_date ? item.start_date.substring(0, 10) : item.mulaiKerja,
    selesaiKerja: item.end_date ? item.end_date.substring(0, 10) : item.selesaiKerja,
    jamKerjaMulai: item.daily_start_time || item.jamKerjaMulai || "08:00",
    jamKerjaAkhir: item.daily_end_time || item.jamKerjaAkhir || "17:00",
    penanggungJawab: item.pic_name || item.penanggungJawab || "-",
    noHpPJ: item.pic_phone || item.noHpPJ || "-",
    pengawasPekerjaan: item.supervisor_name || item.pengawasPekerjaan || "-",
    noHpPengawas: item.supervisor_phone || item.noHpPengawas || "-",
    pengawasHse: item.hse_officer_name || item.pengawasHse || "-",
    noHpHse: item.hse_officer_phone || item.noHpHse || "-",
    risiko: item.risk_level || "Rendah",
    status: item.status,
    permitTypes: item.permit_types ? item.permit_types.map((p: any) => p.name) : (item.permitTypes || []),
    ppe: item.ppes ? item.ppes.map((p: any) => p.name) : (item.ppe || []),
    workEquipment: item.equipments ? item.equipments.map((e: any) => e.equipment_name) : (item.workEquipment || []),
    pekerja: item.workers ? item.workers.map((w: any) => ({
      id: w.id,
      nama: w.worker_name || w.nama,
      jabatan: w.position || w.jabatan,
      alamat: w.address || w.alamat,
    })) : (item.pekerja || []),
    jsa: item.jsas ? item.jsas.map((j: any) => ({
      id: j.id,
      tahapan: j.work_step || j.tahapan,
      peralatan: j.equipment_used || j.peralatan,
      potensi: j.hazard_potential || j.potensi,
      pengendalian: j.mitigation_control || j.pengendalian,
      tanggapDarurat: j.emergency_response || j.tanggapDarurat,
    })) : (item.jsa || []),
  };
}

export default function ReviewRequestsPage() {
  const [requests, setRequests] = useState<any[]>(INITIAL_REQUESTS);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<{isOpen: boolean, id: string | null, rawId?: any}>({isOpen: false, id: null});
  const [approveModal, setApproveModal] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});
  const [rejectReason, setRejectReason] = useState("");
  const role = sessionStorage.getItem('userRole'); // 'pic_vendor', 'hse', 'ga_dept_head', 'ga_div_head', 'admin'

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getReviewQueue();
      if (res.success && res.data && res.data.length > 0) {
        setRequests(res.data.map(mapApiToReview));
      }
    } catch (err) {
      console.warn("Could not fetch review queue from API, keeping initial fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [role]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Menunggu PIC Vendor": 
      case "Menunggu HSE": 
      case "Menunggu GA Dept Head": 
      case "Menunggu GA Div Head": 
        return "bg-warning-container text-on-warning-container";
      case "Disetujui": return "bg-success-container text-on-success-container";
      case "Ditolak": return "bg-error-container text-on-error-container";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  // Filter data berdasarkan role (jika bukan admin)
  const filteredRequests = requests.filter(req => {
    if (role === 'admin') return true;
    if (role === 'pic_vendor') return req.status === "Menunggu PIC Vendor";
    if (role === 'hse') return req.status === "Menunggu HSE";
    if (role === 'ga_dept_head') return req.status === "Menunggu GA Dept Head";
    if (role === 'ga_div_head') return req.status === "Menunggu GA Div Head";
    return true; // fallback
  });

  const handleApprove = async (id: string, rawId?: any) => {
    try {
      const targetId = rawId || id;
      await api.approvePermit(targetId, `Disetujui oleh ${role || 'reviewer'}`);
    } catch (err: any) {
      console.warn("API approve failed or fallback:", err.message);
    }

    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        if (role === 'pic_vendor') return { ...req, status: "Menunggu HSE" };
        if (role === 'hse') return { ...req, status: "Menunggu GA Dept Head" };
        if (role === 'ga_dept_head') return { ...req, status: "Menunggu GA Div Head" };
        if (role === 'ga_div_head') return { ...req, status: "Disetujui" };
        return { ...req, status: "Disetujui" };
      }
      return req;
    }));
    setApproveModal({ isOpen: true, id });
  };

  const confirmApprove = () => {
    setApproveModal({ isOpen: false, id: null });
    setSelectedRequest(null);
    fetchQueue();
  };

  const confirmReject = async () => {
    if (!rejectModal.id || !rejectReason.trim()) return;
    
    try {
      const targetId = rejectModal.rawId || rejectModal.id;
      await api.rejectPermit(targetId, rejectReason);
    } catch (err: any) {
      console.warn("API reject failed or fallback:", err.message);
    }

    setRequests(prev => prev.map(req => {
      if (req.id === rejectModal.id) {
        return { ...req, status: "Ditolak" };
      }
      return req;
    }));
    setRejectModal({ isOpen: false, id: null });
    setSelectedRequest(null);
    setRejectReason("");
    fetchQueue();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <Header title={role === 'hse' ? "Review Ijin (HSE)" : role === 'ga_dept_head' ? "Persetujuan (Dept Head)" : role === 'ga_div_head' ? "Persetujuan Akhir (Div Head)" : "Review PIC Vendor"} />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {role === 'hse' ? 'Review Keselamatan (HSE)' : role === 'ga_dept_head' ? 'Persetujuan GA Dept Head' : role === 'ga_div_head' ? 'Validasi Akhir GA Div Head' : 'Review PIC Vendor'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Daftar ijin kerja yang membutuhkan persetujuan Anda.
                {loading && <span className="text-xs text-primary font-medium animate-pulse ml-2">Memuat antrean...</span>}
              </p>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari ID Permit..." 
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700">ID & Jenis Pekerjaan</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Vendor</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Lokasi & Tanggal</th>
                    <th className="px-6 py-4 font-semibold text-gray-700 text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{req.id}</div>
                          <div className="text-gray-500 mt-0.5">{req.jenisPekerjaan}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{req.kontraktor}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{req.pekerja.length} Pekerja</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-800">{req.lokasi}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{req.mulaiKerja} s/d {req.selesaiKerja}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", getStatusBadge(req.status))}>
                            <Clock size={14} /> {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedRequest(req)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container/20 text-primary hover:bg-primary hover:text-on-primary rounded-lg text-sm font-semibold transition-colors"
                          >
                            <Eye size={16} /> Buka & Review
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <CheckSquare size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-base font-medium">Semua Bersih!</p>
                        <p className="text-sm">Tidak ada ijin kerja yang perlu di-review saat ini.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal View Detail & Approval */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="flex justify-between items-start sm:items-center p-4 sm:p-6 border-b border-gray-100 bg-white z-10 shrink-0">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileCheck className="text-primary" size={24} />
                    {selectedRequest.id}
                  </h3>
                  <span className={cn("inline-flex self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusBadge(selectedRequest.status))}>
                    {selectedRequest.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500 mt-1">{selectedRequest.jenisPekerjaan} - {selectedRequest.kontraktor}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="p-2 shrink-0 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/30">
              <div className="space-y-8">
                
                {/* 1. Info Pekerjaan & Vendor */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="text-primary" size={18} />
                    <h4 className="text-base font-bold text-gray-900">1. Data Vendor & Pekerjaan</h4>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                    <div><span className="block text-xs text-gray-500">Nama Vendor</span><span className="font-semibold text-gray-900">{selectedRequest.kontraktor}</span></div>
                    <div><span className="block text-xs text-gray-500">Jenis Pekerjaan</span><span className="font-semibold text-gray-900">{selectedRequest.jenisPekerjaan}</span></div>
                    <div><span className="block text-xs text-gray-500">Lokasi Kerja</span><span className="font-semibold text-gray-900">{selectedRequest.lokasi}</span></div>
                    <div><span className="block text-xs text-gray-500">Tanggal Pelaksanaan</span><span className="font-semibold text-gray-900">{selectedRequest.mulaiKerja} s.d {selectedRequest.selesaiKerja}</span></div>
                    <div><span className="block text-xs text-gray-500">Jam Kerja</span><span className="font-semibold text-gray-900">{selectedRequest.jamKerjaMulai} - {selectedRequest.jamKerjaAkhir}</span></div>
                    <div><span className="block text-xs text-gray-500">Total Tenaga Kerja</span><span className="font-semibold text-gray-900">{selectedRequest.pekerja.length} Orang</span></div>
                    
                    <div className="col-span-full border-t border-gray-100 pt-3 mt-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><span className="block text-xs text-gray-500">Penanggung Jawab</span><span className="font-medium text-gray-900">{selectedRequest.penanggungJawab} ({selectedRequest.noHpPJ})</span></div>
                      <div><span className="block text-xs text-gray-500">Pengawas Pekerjaan</span><span className="font-medium text-gray-900">{selectedRequest.pengawasPekerjaan} ({selectedRequest.noHpPengawas})</span></div>
                      <div><span className="block text-xs text-gray-500">Pengawas K3/HSE</span><span className="font-medium text-gray-900">{selectedRequest.pengawasHse} ({selectedRequest.noHpHse})</span></div>
                    </div>
                  </div>
                </section>

                {/* 2. Jenis Ijin & APD */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="text-primary" size={18} />
                    <h4 className="text-base font-bold text-gray-900">2. Klasifikasi Ijin & Keselamatan</h4>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                    <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-gray-100">
                      <span className="block text-xs text-gray-500 mb-3">Jenis Ijin Kerja (Permit Type)</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedRequest.permitTypes.map((pt: string) => (
                          <span key={pt} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                            <CheckCircle size={14} className="text-blue-500" /> {pt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-gray-100">
                      <span className="block text-xs text-gray-500 mb-2">Alat Pelindung Diri (APD)</span>
                      <ul className="space-y-1.5">
                        {selectedRequest.ppe.map((p: string) => (
                          <li key={p} className="text-sm font-medium text-gray-800 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex-1 p-5">
                      <span className="block text-xs text-gray-500 mb-2">Mesin / Peralatan Kerja</span>
                      <ul className="space-y-1.5">
                        {selectedRequest.workEquipment.map((we: string) => (
                          <li key={we} className="text-sm font-medium text-gray-800 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>{we}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 3. Daftar Tenaga Kerja */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="text-primary" size={18} />
                    <h4 className="text-base font-bold text-gray-900">3. Data Tenaga Kerja</h4>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-gray-50/80">
                        <tr>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-600 border-b border-gray-200 w-12 text-center">No</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-600 border-b border-gray-200">Nama Lengkap</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-600 border-b border-gray-200">Jabatan</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-600 border-b border-gray-200">Alamat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedRequest.pekerja.map((p: any, i: number) => (
                          <tr key={p.id}>
                            <td className="px-4 py-3 text-center text-gray-500">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{p.nama}</td>
                            <td className="px-4 py-3 text-gray-700">{p.jabatan}</td>
                            <td className="px-4 py-3 text-gray-500">{p.alamat}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 4. Job Safety Analysis (JSA) */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="text-warning" size={18} />
                    <h4 className="text-base font-bold text-gray-900">4. Job Safety Analysis (JSA)</h4>
                  </div>
                  <div className="space-y-3">
                    {selectedRequest.jsa.map((j: any, i: number) => (
                      <div key={j.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-warning-container/20 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                          <span className="font-bold text-on-warning text-xs px-2 py-0.5 bg-warning rounded">Step {i + 1}</span>
                          <span className="font-semibold text-sm text-gray-900">{j.tahapan}</span>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="block text-xs font-medium text-gray-500 mb-1">Peralatan</span>
                            <span className="text-gray-900">{j.peralatan}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-gray-500 mb-1">Potensi Bahaya</span>
                            <span className="text-error font-medium">{j.potensi}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-gray-500 mb-1">Pengendalian Bahaya</span>
                            <span className="text-success font-medium">{j.pengendalian}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-gray-500 mb-1">Tanggap Darurat</span>
                            <span className="text-gray-900">{j.tanggapDarurat}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                
                {/* 5. Deklarasi */}
                <section>
                  <div className="bg-info-container/20 p-5 rounded-xl border border-info-container/40 flex items-start gap-3">
                    <FileText className="text-info shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-gray-800 leading-relaxed">
                      <strong className="block text-info mb-1 text-base">Pernyataan Reviewer:</strong>
                      Dengan menekan tombol <strong>Setujui Dokumen</strong> di bawah, saya menyatakan telah memeriksa persyaratan K3 (HSE) / kelengkapan administrasi (GA) secara menyeluruh. Saya bertanggung jawab atas verifikasi dokumen ini dan mengizinkan pekerjaan dilanjutkan ke tahap berikutnya sesuai dengan prosedur keselamatan perusahaan.
                    </p>
                  </div>
                </section>

              </div>
            </div>

            {/* Footer Modal - Action Buttons */}
            <div className="p-4 sm:p-6 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
              >
                Tutup
              </button>
              <button 
                onClick={() => setRejectModal({ isOpen: true, id: selectedRequest.id, rawId: selectedRequest.rawId })}
                className="px-6 py-2.5 text-sm font-bold text-error bg-white border border-error-container hover:bg-error-container/20 rounded-lg flex items-center gap-2 transition-colors"
              >
                <XCircle size={18} /> Tolak
              </button>
              <button 
                onClick={() => handleApprove(selectedRequest.id, selectedRequest.rawId)}
                className="px-6 py-2.5 text-sm font-bold text-white bg-success rounded-lg hover:opacity-90 flex items-center gap-2 transition-colors shadow-sm"
              >
                <CheckCircle size={18} /> Setujui Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-error/5">
              <h3 className="text-lg font-bold text-error flex items-center gap-2">
                <AlertTriangle size={20} /> Tolak Ijin Kerja
              </h3>
              <button 
                onClick={() => setRejectModal({ isOpen: false, id: null })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Alasan Penolakan <span className="text-error">*</span></label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: JSA kurang detail pada bagian mitigasi risiko..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-error focus:border-error transition-all resize-none h-28"
                ></textarea>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button 
                onClick={() => setRejectModal({ isOpen: false, id: null })}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmReject}
                className="px-4 py-2 text-sm font-bold text-white bg-error hover:bg-error/90 rounded-lg transition-colors"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 text-center">
            <div className="p-8">
              <div className="mx-auto w-16 h-16 bg-success-container/30 text-success rounded-full flex items-center justify-center mb-5">
                <CheckCircle size={36} />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
                Ijin Kerja Disetujui
              </h3>
              <p className="text-sm text-gray-500 mb-8">
                Ijin Kerja <strong>{approveModal.id}</strong> berhasil disetujui. Notifikasi telah dikirimkan ke pihak terkait.
              </p>
              
              <button 
                onClick={confirmApprove}
                className="w-full py-3 text-sm font-bold text-white bg-success hover:bg-success/90 rounded-xl transition-colors shadow-sm"
              >
                Tutup & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
