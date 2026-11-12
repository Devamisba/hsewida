import { useState } from "react";
import { 
  Eye, 
  Printer, 
  X, 
  Shield, 
  Users, 
  AlertTriangle, 
  Briefcase, 
  FileCheck, 
  CheckCircle2, 
  Lock, 
  CalendarPlus,
  RotateCcw
} from "lucide-react";
import { cn, calculateInclusiveDays, formatPermitStatus, formatDateDDMMYY } from "@/lib/utils";
import { ApprovalWorkflowStepper } from "./ApprovalWorkflowStepper";
import { ProjectPhaseTimeline } from "./ProjectPhaseTimeline";
import { PrintPermitModal } from "./PrintPermitModal";

export const canPrintPermit = (status: string) => {
  return status === "Disetujui" || status === "Selesai";
};

export const isEligibleForExtension = (selesaiKerja: string, status: string, windowDays: number = 3) => {
  if (status !== "Disetujui") return false;
  if (!selesaiKerja) return false;
  
  const endDate = new Date(selesaiKerja);
  endDate.setHours(23, 59, 59, 999); 
  
  const today = new Date();
  const windowDate = new Date(endDate);
  windowDate.setDate(windowDate.getDate() - windowDays);
  windowDate.setHours(0, 0, 0, 0);
  
  return today >= windowDate && today <= endDate;
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "Menunggu PIC Vendor": 
    case "Menunggu PIC Widatra": 
    case "Menunggu HSE": 
    case "Menunggu Head Dept HRD&GA":
    case "Menunggu Head Division HRD&GA":
    case "Menunggu GA Dept Head": 
    case "Menunggu GA Div Head": 
      return "bg-warning-container text-on-warning-container";
    case "Disetujui": return "bg-success-container text-on-success-container";
    case "Ditolak": return "bg-error-container text-on-error-container";
    case "Selesai": return "bg-blue-100 text-blue-800";
    default: return "bg-gray-100 text-gray-700";
  }
};

export function mapApiToPermitDetail(item: any) {
  if (!item) return null;
  const parent = item.parent_permit || item.parentPermit || null;
  const root = item.root_permit || item.rootPermit || null;
  const parentStartDate = parent?.start_date ? parent.start_date.substring(0, 10) : (parent?.startDate || null);
  const parentEndDate = parent?.end_date ? parent.end_date.substring(0, 10) : (parent?.endDate || null);
  const rootStartDate = root?.start_date ? root.start_date.substring(0, 10) : (root?.startDate || null);
  const rootEndDate = root?.end_date ? root.end_date.substring(0, 10) : (root?.endDate || null);
  const currentStart = item.start_date ? item.start_date.substring(0, 10) : item.mulaiKerja;
  const currentEnd = item.end_date ? item.end_date.substring(0, 10) : item.selesaiKerja;

  const childPermits = item.child_permits || item.childPermits || [];
  const hasActiveChild = item.has_active_child_extension !== undefined
    ? Boolean(item.has_active_child_extension)
    : childPermits.some((c: any) => c.status !== 'Ditolak');

  const extensionPhase = typeof item.extension_phase === 'number' 
    ? item.extension_phase 
    : (item.request_type === 'Perpanjangan' ? 1 : 0);

  const cumulativeStartDate = rootStartDate || item.cumulative_start_date || parentStartDate || currentStart;

  return {
    id: item.permit_number || `WP-${item.id}`,
    rawId: item.id,
    status: item.status,
    requestType: item.request_type || "Baru",
    extensionPhase,
    rootPermitId: item.root_permit_id || (root?.id ?? null),
    rootPermit: root ? {
      id: root.id,
      permitNumber: root.permit_number || root.permitNumber || `WP-${root.id}`,
      startDate: rootStartDate,
      endDate: rootEndDate,
      jobTitle: root.job_title || root.jobTitle || "",
    } : null,
    parentPermitId: item.parent_permit_id || item.parentPermitId || (parent?.id ?? null),
    parentPermit: parent ? {
      id: parent.id,
      permitNumber: parent.permit_number || parent.permitNumber || `WP-${parent.id}`,
      startDate: parentStartDate,
      endDate: parentEndDate,
      jobTitle: parent.job_title || parent.jobTitle || "",
      extensionPhase: parent.extension_phase ?? 0,
    } : null,
    childPermits,
    hasActiveChild,
    projectChain: item.project_chain || [],
    cumulativeStartDate,
    cumulativeEndDate: currentEnd,
    namaKontraktor: item.vendor?.company_name || item.user?.company_name || "PT Vendor",
    jenisPekerjaan: item.job_title || item.jenisPekerjaan || "Pekerjaan Vendor",
    lokasi: item.location?.name || item.lokasi || "Area Pabrik",
    mulaiKerja: currentStart,
    selesaiKerja: currentEnd,
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
    qrToken: item.qr_code_token,
    approvals: item.approvals || [],
    rejectReason: item.reject_reason || null,
    updatedAt: item.updated_at || item.updatedAt,
    createdAt: item.created_at || item.createdAt,
  };
}

export interface WorkPermitDetailModalProps {
  permit: any | null;
  onClose: () => void;
  onExtend?: (permit: any) => void;
  onResubmit?: (permit: any) => void;
  extensionWindowDays?: number;
}

export function WorkPermitDetailModal({
  permit,
  onClose,
  onExtend,
  onResubmit,
  extensionWindowDays = 3,
}: WorkPermitDetailModalProps) {
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [printModalPermit, setPrintModalPermit] = useState<any | null>(null);

  if (!permit) return null;

  const handleOpenPrint = (p: any) => {
    if (!canPrintPermit(p.status)) {
      alert("Surat Izin Kerja Aman (SIKA) resmi hanya dapat dicetak setelah disetujui penuh oleh seluruh pihak berwenang (hingga Head Division HRD&GA).");
      return;
    }
    setPrintModalPermit(p);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Modal Header */}
          <div className="flex justify-between items-start sm:items-center p-4 sm:p-6 border-b border-gray-100 bg-white z-10 shrink-0">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileCheck className="text-primary" size={24} />
                  {permit.id}
                </h3>
                <span className={cn("inline-flex self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusBadge(permit.status))}>
                  {formatPermitStatus(permit.status)}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500 mt-1">{permit.jenisPekerjaan}</p>
            </div>
            <button 
              type="button"
              onClick={onClose} 
              className="p-2 shrink-0 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Modal Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/30">
            <div className="space-y-6">

              {/* 0. Alur Persetujuan Berjenjang (Sequential Stepper) */}
              <ApprovalWorkflowStepper
                status={permit.status}
                approvals={permit.approvals}
                rejectReason={permit.rejectReason}
              />

              {/* 0.4. Timeline Rantai Fase Proyek */}
              {(permit.extensionPhase > 0 || (permit.projectChain && permit.projectChain.length > 1) || permit.hasActiveChild) && (
                <ProjectPhaseTimeline
                  currentPermitId={permit.rawId || permit.id}
                  phases={permit.projectChain?.length ? permit.projectChain : [
                    ...(permit.rootPermit ? [{
                      id: permit.rootPermit.id,
                      permit_number: permit.rootPermit.permitNumber,
                      request_type: "Baru",
                      extension_phase: 0,
                      start_date: permit.rootPermit.startDate,
                      end_date: permit.rootPermit.endDate,
                      status: "Disetujui"
                    }] : []),
                    {
                      id: permit.rawId,
                      permit_number: permit.id,
                      request_type: permit.requestType,
                      extension_phase: permit.extensionPhase,
                      start_date: permit.mulaiKerja,
                      end_date: permit.selesaiKerja,
                      status: permit.status
                    }
                  ]}
                  rootPermitNumber={permit.rootPermit?.permitNumber || permit.parentPermit?.permitNumber || permit.id}
                  cumulativeStartDate={permit.cumulativeStartDate}
                  cumulativeEndDate={permit.cumulativeEndDate}
                />
              )}

              {/* 0.5. Info Audit Jejak Perpanjangan Izin (Khusus Tipe Perpanjangan) */}
              {permit.requestType === 'Perpanjangan' && (
                <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                      <CalendarPlus size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-950">
                        Informasi Audit Perpanjangan Izin Kerja Ke-{permit.extensionPhase || 1}
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Izin ini diterbitkan sebagai kelanjutan legal Fase {permit.extensionPhase || 1} dari proyek SIKA.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/70 text-xs">
                    <div className="bg-white/90 p-3 rounded-lg border border-amber-200">
                      <span className="text-gray-500 block font-medium">SIKA Induk & Acuan:</span>
                      <strong className="text-sm text-gray-900 block font-mono mt-0.5">
                        {permit.rootPermit?.permitNumber || permit.parentPermit?.permitNumber || "SIKA Induk"}
                      </strong>
                      <span className="text-gray-500 text-[11px] block mt-1">
                        {permit.parentPermit?.permitNumber && permit.parentPermit.permitNumber !== (permit.rootPermit?.permitNumber || '')
                          ? `Fase sebelumnya: ${permit.parentPermit.permitNumber}`
                          : `Mulai Awal: ${permit.cumulativeStartDate || '-'}`}
                      </span>
                    </div>
                    <div className="bg-white/90 p-3 rounded-lg border border-amber-200">
                      <span className="text-gray-500 block font-medium">
                        Periode Aktif Fase {permit.extensionPhase || 1}:
                      </span>
                      <strong className="text-sm text-amber-900 block mt-0.5 font-mono">
                        {formatDateDDMMYY(permit.mulaiKerja)} s/d {formatDateDDMMYY(permit.selesaiKerja)}
                      </strong>
                      <span className="text-amber-800 text-[11px] font-medium block mt-1">
                        Durasi: {calculateInclusiveDays(permit.mulaiKerja, permit.selesaiKerja)} Hari Kalender (Maks. 6)
                      </span>
                    </div>
                    <div className="bg-amber-100/70 p-3 rounded-lg border border-amber-300">
                      <span className="text-amber-900 block font-bold">Rentang Kumulatif Proyek:</span>
                      <strong className="text-sm text-amber-950 block mt-0.5 font-mono">
                        {formatDateDDMMYY(permit.cumulativeStartDate)} s/d {formatDateDDMMYY(permit.cumulativeEndDate)}
                      </strong>
                      <span className="text-amber-900 font-bold text-[11px] block mt-1">
                        Total Durasi Proyek: {calculateInclusiveDays(permit.cumulativeStartDate, permit.cumulativeEndDate)} Hari Kalender
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
                  <div><span className="block text-xs text-gray-500">Tipe Request</span><span className="font-semibold text-gray-900">{permit.requestType}</span></div>
                  <div><span className="block text-xs text-gray-500">Nama Vendor</span><span className="font-semibold text-gray-900">{permit.namaKontraktor}</span></div>
                  <div><span className="block text-xs text-gray-500">Lokasi Kerja</span><span className="font-semibold text-gray-900">{permit.lokasi}</span></div>
                  <div><span className="block text-xs text-gray-500">Tanggal Pelaksanaan</span><span className="font-semibold text-gray-900">{formatDateDDMMYY(permit.mulaiKerja)} s/d {formatDateDDMMYY(permit.selesaiKerja)}</span></div>
                  <div><span className="block text-xs text-gray-500">Jam Kerja</span><span className="font-semibold text-gray-900">{permit.jamKerjaMulai} - {permit.jamKerjaAkhir}</span></div>
                  <div><span className="block text-xs text-gray-500">Total Tenaga Kerja</span><span className="font-semibold text-gray-900">{permit.totalTenagaKerja} Orang</span></div>
                  
                  <div className="col-span-full border-t border-gray-100 pt-3 mt-1 grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs text-gray-500 font-medium">Penanggung Jawab</span>
                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">Vendor</span>
                      </div>
                      <span className="font-semibold text-gray-900 block">{permit.penanggungJawab}</span>
                      <span className="text-xs text-gray-500 font-mono">{permit.noHpPJ || "-"}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs text-gray-500 font-medium">Pengawas Pekerjaan</span>
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">Internal Widatra</span>
                      </div>
                      <span className="font-semibold text-gray-900 block">{permit.pengawasPekerjaan}</span>
                      <span className="text-xs text-gray-500 font-mono">{permit.noHpPengawas || "-"}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs text-gray-500 font-medium">Pengawas K3/HSE</span>
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">Internal Widatra</span>
                      </div>
                      <span className="font-semibold text-gray-900 block">{permit.pengawasHse}</span>
                      <span className="text-xs text-gray-500 font-mono">{permit.noHpHse || "-"}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Jenis Izin & APD */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="text-primary" size={18} />
                  <h4 className="text-base font-bold text-gray-900">2. Klasifikasi Izin & Keselamatan</h4>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                  <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-gray-100">
                    <span className="block text-xs text-gray-500 mb-3">Jenis Izin Kerja (Permit Type)</span>
                    <div className="flex flex-wrap gap-2">
                      {permit.permitTypes.map((pt: string, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-container/30 text-primary border border-primary-container rounded-lg text-xs font-medium">
                          <CheckCircle2 size={12} /> {pt}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-gray-100">
                    <span className="block text-xs text-gray-500 mb-3">Alat Pelindung Diri (APD)</span>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {permit.ppe.map((item: string, i: number) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="flex-1 p-5">
                    <span className="block text-xs text-gray-500 mb-3">Mesin / Peralatan Kerja</span>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {permit.workEquipment.map((item: string, i: number) => <li key={i}>{item}</li>)}
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
                        <th className="px-4 py-3 text-xs font-semibold text-gray-600 border-b border-gray-200 text-center w-36">ID Card / Foto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {permit.pekerja.map((p: any, i: number) => (
                        <tr key={p.id || i}>
                          <td className="px-4 py-3 text-center text-gray-500">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{p.nama}</td>
                          <td className="px-4 py-3 text-gray-700">{p.jabatan}</td>
                          <td className="px-4 py-3 text-gray-500">{p.alamat}</td>
                          <td className="px-4 py-3 text-center">
                            {p.id_card_photo ? (
                              <button
                                type="button"
                                onClick={() => setPreviewPhoto(p.id_card_photo)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                              >
                                <Eye size={13} />
                                <span>Lihat Foto</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Tidak ada foto</span>
                            )}
                          </td>
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
                  {permit.jsa.map((j: any, i: number) => (
                    <div key={j.id || i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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
              {!canPrintPermit(permit.status) && (
                <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  <Lock size={14} className="shrink-0 text-amber-600" />
                  <span>Dokumen resmi baru dapat dicetak setelah disetujui penuh oleh <strong>Head Division HRD&GA</strong>.</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
              {permit.status === "Ditolak" && onResubmit && (
                <button 
                  type="button"
                  onClick={() => {
                    const req = permit;
                    onClose();
                    onResubmit(req);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm whitespace-nowrap"
                  title="Ajukan kembali izin kerja ini dengan mengisi periode tanggal baru"
                >
                  <RotateCcw size={16} /> Ajukan Kembali
                </button>
              )}
              {isEligibleForExtension(permit.selesaiKerja, permit.status, extensionWindowDays) && onExtend && (
                <button 
                  type="button"
                  onClick={() => {
                    const req = permit;
                    onClose();
                    onExtend(req);
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  title={`Perpanjang Izin Kerja (Masa H-${extensionWindowDays})`}
                >
                  <CalendarPlus size={18} /> Perpanjang Izin
                </button>
              )}
              <button 
                type="button"
                onClick={onClose} 
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                Tutup
              </button>
              {canPrintPermit(permit.status) ? (
                <button 
                  type="button"
                  onClick={() => handleOpenPrint(permit)}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Printer size={18} /> Cetak & Unduh Permit Resmi
                </button>
              ) : (
                <button 
                  type="button"
                  disabled
                  className="px-5 py-2.5 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-2 cursor-not-allowed opacity-75 whitespace-nowrap"
                  title="Izin kerja belum dapat dicetak karena belum disetujui penuh oleh Head Division HRD&GA"
                >
                  <Lock size={16} /> Menunggu Approval Akhir (Terkunci)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Preview Foto ID Card Pekerja */}
      {previewPhoto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users size={16} className="text-primary" /> Foto ID Card / Profil Pekerja
              </h4>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-50 max-h-[70vh] overflow-auto">
              <img
                src={previewPhoto}
                alt="ID Card Pekerja"
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm border border-gray-200"
              />
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak & Unduh Permit Resmi */}
      {printModalPermit && (
        <PrintPermitModal
          permit={printModalPermit}
          onClose={() => setPrintModalPermit(null)}
        />
      )}
    </>
  );
}
