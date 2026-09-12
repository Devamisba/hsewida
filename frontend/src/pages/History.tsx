import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Eye, Printer, FileText, X, Shield, Users, AlertTriangle, Briefcase, FileCheck, CheckCircle2, CalendarPlus, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { PrintPermitModal } from "@/components/PrintPermitModal";

function mapApiToHistory(item: any) {
  return {
    id: item.permit_number || `WP-${item.id}`,
    rawId: item.id,
    status: item.status,
    requestType: item.request_type || "Baru",
    namaKontraktor: item.vendor?.company_name || item.user?.company_name || "PT Vendor",
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
    totalTenagaKerja: item.total_workers || item.workers?.length || 0,
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
    alasanPenolakan: item.reject_reason,
    qrToken: item.qr_code_token,
  };
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Menunggu PIC Vendor": 
    case "Menunggu HSE": 
    case "Menunggu GA Dept Head": 
    case "Menunggu GA Div Head": 
      return "bg-warning-container text-on-warning-container";
    case "Disetujui": return "bg-success-container text-on-success-container";
    case "Ditolak": return "bg-error-container text-on-error-container";
    case "Selesai": return "bg-blue-100 text-blue-800";
    default: return "bg-gray-100 text-gray-700";
  }
};

const isEligibleForExtension = (selesaiKerja: string, status: string) => {
  if (status !== "Disetujui") return false;
  
  const endDate = new Date(selesaiKerja);
  endDate.setHours(23, 59, 59, 999); 
  
  const today = new Date();
  const h3Date = new Date(endDate);
  h3Date.setDate(h3Date.getDate() - 3);
  h3Date.setHours(0, 0, 0, 0);
  
  return today >= h3Date;
};

export default function HistoryPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [printModalPermit, setPrintModalPermit] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.getPermitHistory();
        if (res.success && res.data) {
          setRequests(res.data.map(mapApiToHistory));
        } else {
          setRequests([]);
        }
      } catch (err: any) {
        console.warn("Could not fetch history:", err.message);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleExtend = (req: any) => {
    navigate("/create-request", { state: { extendMode: true, originalId: req.id, ...req } });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <Header title="History" />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Riwayat Ijin Kerja</h2>
              <p className="text-sm text-gray-500 mt-1">Arsip seluruh ijin kerja. Anda dapat memperpanjang ijin kerja (maksimal H-3 sebelum selesai).</p>
            </div>
            {loading && <span className="text-xs text-primary font-medium animate-pulse">Memuat riwayat...</span>}
          </div>

          {/* Desktop Table (Boxed Data Table style) */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-primary-container/20">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">No. Ijin</th>
                    <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Pekerjaan</th>
                    <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Lokasi</th>
                    <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                    <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.length > 0 ? (
                    requests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">{req.id}</td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-700">{req.jenisPekerjaan}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">{req.lokasi}</td>
                        <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{req.mulaiKerja} s.d {req.selesaiKerja}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase", getStatusBadge(req.status))}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {isEligibleForExtension(req.selesaiKerja, req.status) && (
                              <button 
                                onClick={() => handleExtend(req)}
                                className="p-2 text-warning hover:text-warning-container hover:bg-warning/10 rounded-lg transition-colors cursor-pointer" 
                                title="Perpanjang Ijin (Maksimal H-3)"
                              >
                                <CalendarPlus size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => setSelectedRequest(req)}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-primary-container/50 rounded-lg transition-colors cursor-pointer" 
                              title="Lihat Detail"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => setPrintModalPermit(req)}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-primary-container/50 rounded-lg transition-colors cursor-pointer" 
                              title="Cetak Permit"
                            >
                              <Printer size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <FileText size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-base font-medium text-gray-800">Belum Ada Riwayat Ijin Kerja</p>
                        <p className="text-xs text-gray-500 mt-1">Data arsip dan riwayat izin kerja akan tercatat di sini setelah pengajuan diproses.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-4">
            {requests.length > 0 ? (
              requests.map((req) => (
                <div key={req.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      <span className="text-sm font-bold text-gray-900">{req.id}</span>
                    </div>
                    <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusBadge(req.status))}>
                      {req.status}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 leading-tight">{req.jenisPekerjaan}</h4>
                    <p className="text-xs text-gray-500 mt-1">{req.lokasi}</p>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">{req.mulaiKerja}</span>
                    <div className="flex gap-2">
                      {isEligibleForExtension(req.selesaiKerja, req.status) && (
                        <button 
                          onClick={() => handleExtend(req)}
                          className="p-2 text-warning hover:text-warning-container bg-warning/5 hover:bg-warning/10 rounded-lg transition-colors cursor-pointer"
                          title="Perpanjang Ijin (Maksimal H-3)"
                        >
                          <CalendarPlus size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedRequest(req)}
                        className="p-2 text-gray-500 hover:text-primary bg-gray-50 hover:bg-primary-container/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => setPrintModalPermit(req)}
                        className="p-2 text-gray-500 hover:text-primary bg-gray-50 hover:bg-primary-container/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
                <FileText size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-semibold text-gray-700">Belum Ada Riwayat Ijin Kerja</p>
                <p className="text-xs text-gray-400 mt-1">Data arsip dan riwayat izin kerja akan tampil di sini.</p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* View Detail Modal - Full Screen or Large Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
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
                <p className="text-sm font-medium text-gray-500 mt-1">{selectedRequest.jenisPekerjaan}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="p-2 shrink-0 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/30">
              <div className="space-y-8">
                
                {/* 0. Alasan Penolakan */}
                {selectedRequest.status === "Rejected" && selectedRequest.alasanPenolakan && (
                  <div className="bg-error-container/20 p-5 rounded-xl border border-error-container/40 flex items-start gap-3">
                    <XCircle className="text-error shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="text-error font-bold text-sm mb-1">Ditolak karena:</h4>
                      <p className="text-error/90 text-sm leading-relaxed">{selectedRequest.alasanPenolakan}</p>
                    </div>
                  </div>
                )}

                {/* 1. Data Vendor & Pekerjaan */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="text-primary" size={18} />
                    <h4 className="text-base font-bold text-gray-900">1. Data Vendor & Pekerjaan</h4>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                    <div><span className="block text-xs text-gray-500">Tipe Request</span><span className="font-semibold text-gray-900">{selectedRequest.requestType}</span></div>
                    <div><span className="block text-xs text-gray-500">Nama Vendor</span><span className="font-semibold text-gray-900">{selectedRequest.namaKontraktor}</span></div>
                    <div><span className="block text-xs text-gray-500">Lokasi Kerja</span><span className="font-semibold text-gray-900">{selectedRequest.lokasi}</span></div>
                    <div><span className="block text-xs text-gray-500">Tanggal Pelaksanaan</span><span className="font-semibold text-gray-900">{selectedRequest.mulaiKerja} s.d {selectedRequest.selesaiKerja}</span></div>
                    <div><span className="block text-xs text-gray-500">Jam Kerja</span><span className="font-semibold text-gray-900">{selectedRequest.jamKerjaMulai} - {selectedRequest.jamKerjaAkhir}</span></div>
                    <div><span className="block text-xs text-gray-500">Total Tenaga Kerja</span><span className="font-semibold text-gray-900">{selectedRequest.totalTenagaKerja} Orang</span></div>
                    
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
                        {selectedRequest.permitTypes.map((pt: string, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-container/30 text-primary border border-primary-container rounded-lg text-xs font-medium">
                            <CheckCircle2 size={12} /> {pt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-gray-100">
                      <span className="block text-xs text-gray-500 mb-3">Alat Pelindung Diri (APD)</span>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {selectedRequest.ppe.map((item: string, i: number) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                    <div className="flex-1 p-5">
                      <span className="block text-xs text-gray-500 mb-3">Mesin / Peralatan Kerja</span>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {selectedRequest.workEquipment.map((item: string, i: number) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 3. Tenaga Kerja */}
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

                {/* 4. JSA */}
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

              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
              {isEligibleForExtension(selectedRequest.selesaiKerja, selectedRequest.status) && (
                <button 
                  onClick={() => handleExtend(selectedRequest)}
                  className="px-6 py-2.5 text-sm font-medium text-on-warning bg-warning rounded-lg hover:opacity-90 flex items-center gap-2 transition-colors shadow-sm"
                >
                  <CalendarPlus size={18} /> Perpanjang Ijin
                </button>
              )}
              <button 
                onClick={() => setPrintModalPermit(selectedRequest)}
                className="px-6 py-2.5 text-sm font-medium text-on-primary bg-primary rounded-lg hover:opacity-90 flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <Printer size={18} /> Cetak & Unduh Permit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Permit Sheet Modal */}
      {printModalPermit && (
        <PrintPermitModal permit={printModalPermit} onClose={() => setPrintModalPermit(null)} />
      )}

    </div>
  );
}
