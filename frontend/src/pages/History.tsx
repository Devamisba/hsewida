import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Eye, Printer, FileText, X, Shield, Users, AlertTriangle, Briefcase, FileCheck, CheckCircle2, Lock, CalendarPlus } from "lucide-react";
import { cn, calculateInclusiveDays } from "@/lib/utils";
import { api } from "@/services/api";
import { PrintPermitModal } from "@/components/PrintPermitModal";
import { ApprovalWorkflowStepper } from "@/components/ApprovalWorkflowStepper";

function mapApiToHistory(item: any) {
  const parent = item.parent_permit || item.parentPermit || null;
  const parentStartDate = parent?.start_date ? parent.start_date.substring(0, 10) : (parent?.startDate || null);
  const parentEndDate = parent?.end_date ? parent.end_date.substring(0, 10) : (parent?.endDate || null);
  const currentStart = item.start_date ? item.start_date.substring(0, 10) : item.mulaiKerja;
  const currentEnd = item.end_date ? item.end_date.substring(0, 10) : item.selesaiKerja;

  return {
    id: item.permit_number || `WP-${item.id}`,
    rawId: item.id,
    status: item.status,
    requestType: item.request_type || "Baru",
    parentPermitId: item.parent_permit_id || item.parentPermitId || (parent?.id ?? null),
    parentPermit: parent ? {
      id: parent.id,
      permitNumber: parent.permit_number || parent.permitNumber || `WP-${parent.id}`,
      startDate: parentStartDate,
      endDate: parentEndDate,
      jobTitle: parent.job_title || parent.jobTitle || "",
    } : null,
    cumulativeStartDate: parentStartDate || currentStart,
    cumulativeEndDate: currentEnd,
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
      id_card_photo: w.id_card_photo || null,
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
    approvals: item.approvals || [],
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

const canPrintPermit = (status: string) => {
  return status === "Disetujui" || status === "Selesai";
};

const isEligibleForExtension = (selesaiKerja: string, status: string, windowDays: number = 3) => {
  if (status !== "Disetujui") return false;
  if (!selesaiKerja) return false;
  const endDate = new Date(selesaiKerja);
  endDate.setHours(23, 59, 59, 999);
  const today = new Date();
  const windowDate = new Date(endDate);
  windowDate.setDate(windowDate.getDate() - windowDays);
  windowDate.setHours(0, 0, 0, 0);
  return today >= windowDate;
};

export default function HistoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const filterExpiringSoon = (location.state as any)?.filterExpiringSoon === true;

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [printModalPermit, setPrintModalPermit] = useState<any>(null);
  const [showExpiringOnly, setShowExpiringOnly] = useState(filterExpiringSoon);
  const [extensionWindowDays] = useState(3);

  const handleExtend = (req: any) => {
    navigate("/create-request", {
      state: {
        extendMode: true,
        originalId: req.rawId || req.id,
        permitNumber: req.id,
        ...req
      }
    });
  };

  const handleOpenPrintModal = (permit: any) => {
    if (!canPrintPermit(permit.status)) {
      alert("Surat Ijin Kerja Aman (SIKA) resmi hanya dapat dicetak setelah disetujui penuh oleh seluruh pihak berwenang (hingga HRD & GA Div Head).");
      return;
    }
    setPrintModalPermit(permit);
  };

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

  // Hitung izin yang akan berakhir dalam 3 hari
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiringItems = requests.filter((req) => {
    if (req.status !== "Disetujui") return false;
    const end = new Date(req.selesaiKerja);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  });

  const displayedRequests = showExpiringOnly ? expiringItems : requests;

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <Header title="Riwayat" />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Riwayat Ijin Kerja</h2>
              <p className="text-sm text-gray-500 mt-1">Arsip dan pencatatan seluruh riwayat ijin kerja yang telah diajukan.</p>
            </div>
            {loading && <span className="text-xs text-primary font-medium animate-pulse">Memuat riwayat...</span>}
          </div>

          {/* Banner filter segera berakhir */}
          {expiringItems.length > 0 && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <AlertTriangle size={18} className="text-rose-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-rose-700">
                  {expiringItems.length} izin akan berakhir dalam 3 hari ke depan!
                </p>
                <p className="text-xs text-rose-500 mt-0.5">Segera ajukan perpanjangan sebelum izin habis masa berlakunya.</p>
              </div>
              <button
                onClick={() => setShowExpiringOnly(!showExpiringOnly)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  showExpiringOnly
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-white border border-rose-300 text-rose-600 hover:bg-rose-50"
                }`}
              >
                {showExpiringOnly ? "Tampilkan Semua" : "Lihat yang Berakhir"}
              </button>
            </div>
          )}

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
                  {displayedRequests.length > 0 ? (
                    displayedRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                          <div className="font-mono text-gray-900">{req.id}</div>
                          {req.requestType === 'Perpanjangan' && (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200" title={`Diperpanjang dari izin ${req.parentPermit?.permitNumber || req.parentPermitId}`}>
                                Perpanjangan: {req.parentPermit?.permitNumber || (req.parentPermitId ? `ID #${req.parentPermitId}` : "SIKA Induk")}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-700">{req.jenisPekerjaan}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">{req.lokasi}</td>
                        <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <div className="font-medium text-gray-800">{req.mulaiKerja} s.d {req.selesaiKerja}</div>
                          {req.requestType === 'Perpanjangan' && req.cumulativeStartDate && (
                            <div className="text-[11px] font-semibold text-amber-700 mt-0.5 flex items-center gap-1">
                              <span>Kumulatif: {req.cumulativeStartDate} s.d {req.cumulativeEndDate}</span>
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">
                                {calculateInclusiveDays(req.cumulativeStartDate, req.cumulativeEndDate)} Hari
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase", getStatusBadge(req.status))}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {isEligibleForExtension(req.selesaiKerja, req.status, extensionWindowDays) && (
                              <button
                                onClick={() => handleExtend(req)}
                                className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title={`Perpanjang Ijin Kerja (H-${extensionWindowDays})`}
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
                            {canPrintPermit(req.status) ? (
                              <button 
                                onClick={() => handleOpenPrintModal(req)}
                                className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" 
                                title="Cetak & Unduh Surat Ijin Kerja Resmi"
                              >
                                <Printer size={18} />
                              </button>
                            ) : (
                              <button 
                                disabled
                                className="p-2 text-gray-300 bg-gray-50 rounded-lg cursor-not-allowed opacity-60" 
                                title={`Cetak Terkunci: Menunggu persetujuan akhir dari GA Div Head (Status: ${req.status})`}
                              >
                                <Lock size={18} className="text-gray-400" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <AlertTriangle size={40} className="mx-auto mb-3 text-rose-300" />
                        {showExpiringOnly ? (
                          <>
                            <p className="text-base font-medium text-gray-800">Tidak Ada Izin yang Segera Berakhir</p>
                            <p className="text-xs text-gray-500 mt-1">Semua izin Anda masih aman, tidak ada yang berakhir dalam 3 hari ke depan.</p>
                            <button onClick={() => setShowExpiringOnly(false)} className="mt-3 text-xs font-semibold text-primary hover:underline">
                              Tampilkan semua riwayat
                            </button>
                          </>
                        ) : (
                          <>
                            <FileText size={40} className="mx-auto mb-3 opacity-20" />
                            <p className="text-base font-medium text-gray-800">Belum Ada Riwayat Ijin Kerja</p>
                            <p className="text-xs text-gray-500 mt-1">Data arsip dan riwayat izin kerja akan tercatat di sini setelah pengajuan diproses.</p>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-4">
            {displayedRequests.length > 0 ? (
              displayedRequests.map((req) => (
                <div key={req.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400 shrink-0" />
                      <div>
                        <span className="text-sm font-bold text-gray-900 font-mono">{req.id}</span>
                        {req.requestType === 'Perpanjangan' && (
                          <div className="mt-0.5">
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Perpanjangan: {req.parentPermit?.permitNumber || (req.parentPermitId ? `ID #${req.parentPermitId}` : "Induk")}
                            </span>
                          </div>
                        )}
                      </div>
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
                    <div className="text-xs">
                      <div className="font-medium text-gray-800">{req.mulaiKerja} s.d {req.selesaiKerja}</div>
                      {req.requestType === 'Perpanjangan' && req.cumulativeStartDate && (
                        <div className="text-[10px] font-semibold text-amber-700 mt-0.5">
                          Kumulatif: {req.cumulativeStartDate} - {req.cumulativeEndDate} ({calculateInclusiveDays(req.cumulativeStartDate, req.cumulativeEndDate)} Hari)
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isEligibleForExtension(req.selesaiKerja, req.status, extensionWindowDays) && (
                        <button
                          onClick={() => handleExtend(req)}
                          className="p-2 text-amber-600 hover:text-amber-700 bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title={`Perpanjang Ijin Kerja (H-${extensionWindowDays})`}
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
                      {canPrintPermit(req.status) ? (
                        <button 
                          onClick={() => handleOpenPrintModal(req)}
                          className="p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Cetak Permit"
                        >
                          <Printer size={16} />
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="p-2 text-gray-300 bg-gray-50 rounded-lg cursor-not-allowed opacity-60"
                          title="Cetak Terkunci: Menunggu persetujuan akhir GA Div Head"
                        >
                          <Lock size={16} className="text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
                <FileText size={32} className="mx-auto mb-2 opacity-20" />
                {showExpiringOnly ? (
                  <>
                    <p className="text-sm font-semibold text-gray-700">Tidak Ada Izin yang Segera Berakhir</p>
                    <button onClick={() => setShowExpiringOnly(false)} className="mt-2 text-xs font-semibold text-primary hover:underline">
                      Tampilkan semua riwayat
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gray-700">Belum Ada Riwayat Ijin Kerja</p>
                    <p className="text-xs text-gray-400 mt-1">Data arsip dan riwayat izin kerja akan tampil di sini.</p>
                  </>
                )}
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
              <div className="space-y-6">

                {/* 0. Alur Persetujuan Berjenjang (Sequential Workflow Stepper) */}
                <ApprovalWorkflowStepper
                  status={selectedRequest.status}
                  approvals={selectedRequest.approvals}
                  rejectReason={selectedRequest.alasanPenolakan}
                />

                {/* 0.5. Info Audit Jejak Perpanjangan Ijin (Khusus Tipe Perpanjangan) */}
                {selectedRequest.requestType === 'Perpanjangan' && (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                        <CalendarPlus size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-950">Informasi Audit Perpanjangan Ijin Kerja</h4>
                        <p className="text-xs text-amber-800 mt-0.5">Ijin ini dicatat sebagai kelanjutan legal dari izin kerja sebelumnya.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/70 text-xs">
                      <div className="bg-white/90 p-3 rounded-lg border border-amber-200">
                        <span className="text-gray-500 block font-medium">Ijin Induk Awal:</span>
                        <strong className="text-sm text-gray-900 block font-mono mt-0.5">
                          {selectedRequest.parentPermit?.permitNumber || (selectedRequest.parentPermitId ? `ID #${selectedRequest.parentPermitId}` : "SIKA Induk")}
                        </strong>
                        {selectedRequest.parentPermit?.startDate && (
                          <span className="text-gray-500 text-[11px] block mt-1">
                            Masa Awal: {selectedRequest.parentPermit.startDate} s.d {selectedRequest.parentPermit.endDate}
                          </span>
                        )}
                      </div>
                      <div className="bg-white/90 p-3 rounded-lg border border-amber-200">
                        <span className="text-gray-500 block font-medium">Periode Perpanjangan Aktif:</span>
                        <strong className="text-sm text-amber-900 block mt-0.5 font-mono">
                          {selectedRequest.mulaiKerja} s.d {selectedRequest.selesaiKerja}
                        </strong>
                        <span className="text-amber-800 text-[11px] font-medium block mt-1">
                          Tambahan: {calculateInclusiveDays(selectedRequest.mulaiKerja, selectedRequest.selesaiKerja)} Hari Kerja
                        </span>
                      </div>
                      <div className="bg-amber-100/70 p-3 rounded-lg border border-amber-300">
                        <span className="text-amber-900 block font-bold">Rentang Kumulatif Pekerjaan:</span>
                        <strong className="text-sm text-amber-950 block mt-0.5 font-mono">
                          {selectedRequest.cumulativeStartDate} s.d {selectedRequest.cumulativeEndDate}
                        </strong>
                        <span className="text-amber-900 font-bold text-[11px] block mt-1">
                          Total Durasi Proyek: {calculateInclusiveDays(selectedRequest.cumulativeStartDate, selectedRequest.cumulativeEndDate)} Hari Kalender
                        </span>
                      </div>
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
                    
                    <div className="col-span-full border-t border-gray-100 pt-3 mt-1 grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs text-gray-500 font-medium">Penanggung Jawab</span>
                          <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">Vendor</span>
                        </div>
                        <span className="font-semibold text-gray-900 block">{selectedRequest.penanggungJawab}</span>
                        <span className="text-xs text-gray-500 font-mono">{selectedRequest.noHpPJ || "-"}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs text-gray-500 font-medium">Pengawas Pekerjaan</span>
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">Internal Widatra</span>
                        </div>
                        <span className="font-semibold text-gray-900 block">{selectedRequest.pengawasPekerjaan}</span>
                        <span className="text-xs text-gray-500 font-mono">{selectedRequest.noHpPengawas || "-"}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs text-gray-500 font-medium">Pengawas K3/HSE</span>
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">Internal Widatra</span>
                        </div>
                        <span className="font-semibold text-gray-900 block">{selectedRequest.pengawasHse}</span>
                        <span className="text-xs text-gray-500 font-mono">{selectedRequest.noHpHse || "-"}</span>
                      </div>
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
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              <div className="w-full sm:w-auto">
                {!canPrintPermit(selectedRequest.status) && (
                  <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                    <Lock size={14} className="shrink-0 text-amber-600" />
                    <span>Dokumen resmi baru dapat dicetak setelah disetujui penuh oleh <strong>HRD & GA Div Head</strong>.</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button 
                  onClick={() => setSelectedRequest(null)} 
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                {canPrintPermit(selectedRequest.status) ? (
                  <button 
                    onClick={() => handleOpenPrintModal(selectedRequest)}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <Printer size={18} /> Cetak & Unduh Permit Resmi
                  </button>
                ) : (
                  <button 
                    disabled
                    className="px-5 py-2.5 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-2 cursor-not-allowed opacity-75"
                    title="Ijin kerja belum dapat dicetak karena belum disetujui penuh oleh GA Div Head"
                  >
                    <Lock size={16} /> Menunggu Approval Akhir (Terkunci)
                  </button>
                )}
              </div>
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
