import { useRef, useState, useEffect } from "react";
import { X, Printer, Download, Loader2, FileText, Lock, AlertTriangle } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { QRCodeSVG } from "./QRCodeSVG";
import { cn, calculateInclusiveDays, formatPermitStatus, formatDateDDMMYY } from "@/lib/utils";

interface PrintPermitModalProps {
  permit: any;
  onClose: () => void;
}

export function PrintPermitModal({ permit, onClose }: PrintPermitModalProps) {
  const printContentRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const isApproved = permit?.status === "Disetujui" || permit?.status === "Selesai";
  
  const isExtension = Boolean(
    permit?.isExtension ||
    permit?.requestType?.toLowerCase() === "perpanjangan" ||
    permit?.request_type?.toLowerCase() === "perpanjangan" ||
    permit?.parentPermit ||
    permit?.parent_permit ||
    permit?.parent_permit_id
  );
  const extensionPhase = typeof permit?.extensionPhase === 'number' 
    ? permit.extensionPhase 
    : (typeof permit?.extension_phase === 'number' ? permit.extension_phase : (isExtension ? 1 : 0));

  const parentNumber = permit?.parentPermit?.permit_number || permit?.parentPermit?.permitNumber || permit?.parent_permit?.permit_number;
  const parentStartDate = permit?.parentPermit?.start_date || permit?.parentPermit?.startDate || permit?.parent_permit?.start_date;
  const rootNumber = permit?.rootPermit?.permit_number || permit?.rootPermit?.permitNumber || permit?.rootPermitNumber || parentNumber;
  const rootStartDate = permit?.rootPermit?.start_date || permit?.rootPermit?.startDate || parentStartDate;

  const cumulativeStart = permit?.cumulativeStartDate || rootStartDate || parentStartDate || permit?.mulaiKerja || permit?.start_date;
  const cumulativeEnd = permit?.cumulativeEndDate || permit?.selesaiKerja || permit?.end_date;
  const cumulativeDays = calculateInclusiveDays(cumulativeStart, cumulativeEnd);

  // Close modal on Escape key press and prevent background scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    
    // Lock body scroll while modal is open
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [onClose]);

  // One-click Direct PDF Download
  const handleDownloadPDF = async () => {
    if (!printContentRef.current || isGenerating) return;
    
    if (!isApproved) {
      alert("Peringatan K3: Dokumen Surat Izin Kerja Aman (SIKA) ini belum disetujui resmi oleh Head Division HRD&GA dan belum dapat diunduh.");
      return;
    }

    setIsGenerating(true);
    try {
      const element = printContentRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2, // 2x scale for sharp text & graphics
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
        heightLeft -= pdfHeight;
      }

      const permitNo = permit.permit_number || permit.id || "SIKA";
      const cleanName = String(permitNo).replace(/[^a-zA-Z0-9_-]/g, "_");
      pdf.save(`SIKA_${cleanName}.pdf`);
    } catch (error: any) {
      console.error("Gagal membuat PDF otomatis:", error);
      alert("Gagal mengunduh PDF: " + (error?.message || "Terjadi kesalahan saat memproses dokumen"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!isApproved) {
      alert("Peringatan K3: Dokumen Surat Izin Kerja Aman (SIKA) ini belum disetujui resmi oleh Head Division HRD&GA dan belum dapat dicetak.");
      return;
    }
    window.print();
  };

  if (!permit) return null;

  return (
    <>
      {/* Clean print style override */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-permit-content, #printable-permit-content * {
            visibility: visible !important;
          }
          #printable-permit-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Overlay Backdrop - click backdrop to close */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Modal Window: max-h-[92vh] with flex-col so header & footer stay fixed while body scrolls */}
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* 1. Modal Header (ALWAYS VISIBLE & STICKY AT TOP) */}
          <div className="px-4 py-3 bg-slate-900 text-white flex justify-between items-center shrink-0 z-20 shadow-md">
            <div className="flex items-center gap-2 text-sm font-bold">
              <FileText size={18} className="text-blue-400 shrink-0" />
              <span className="truncate">Lembar Izin Kerja Aman Resmi (Factory Standard)</span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {/* One-click PDF Download Button */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isGenerating || !isApproved}
                className={cn(
                  "px-3.5 py-1.5 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm",
                  !isApproved
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-60"
                    : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 cursor-pointer"
                )}
                title={!isApproved ? "Cetak terkunci: Menunggu persetujuan akhir dari Head Division HRD&GA" : "Unduh PDF"}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Membuat PDF...</span>
                  </>
                ) : !isApproved ? (
                  <>
                    <Lock size={14} />
                    <span>Cetak Terkunci</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Unduh PDF</span>
                  </>
                )}
              </button>

              {/* Physical Print Dialog Button */}
              {isApproved && (
                <button
                  type="button"
                  onClick={handlePrint}
                  title="Buka dialog cetak browser (Ctrl+P)"
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Printer size={14} />
                  <span className="hidden sm:inline">Print</span>
                </button>
              )}

              {/* Close Button Top */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
                title="Tutup Jendela (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Warning Strip for Unapproved Permits */}
          {!isApproved && (
            <div className="bg-amber-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shrink-0 shadow-inner">
              <AlertTriangle size={16} />
              <span>DOKUMEN DRAFT / BELUM DISETUJUI RESMI — Izin kerja ini masih dalam tahap '{formatPermitStatus(permit.status)}' dan belum sah untuk operasional pabrik.</span>
            </div>
          )}

          {/* 2. Scrollable Body: Paper Sheet Container */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-8 bg-slate-100/70">
            
            {/* Printable Paper Document (A4 format) */}
            <div 
              ref={printContentRef} 
              id="printable-permit-content"
              className="p-6 sm:p-10 md:p-12 text-slate-900 bg-white font-sans space-y-6 border border-slate-200 rounded-xl shadow-sm print:border-none print:shadow-none print:p-0"
            >
              
              {/* Document Control Header (Format Resmi Standar Pabrik PT Widatra Bhakti) */}
              <div className="border-2 border-slate-900 rounded-xl overflow-hidden mb-2">
                <div className="grid grid-cols-12 divide-x-2 divide-slate-900 bg-slate-50 text-slate-900">
                  {/* Left: Company & Dept info */}
                  <div className="col-span-12 sm:col-span-5 p-3 sm:p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-xl">
                      WB
                    </div>
                    <div>
                      <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
                        PT WIDATRA BHAKTI
                      </h1>
                      <p className="text-[10px] font-bold text-blue-900 uppercase">
                        Departemen K3 &amp; Keselamatan Lingkungan (HSE)
                      </p>
                      <p className="text-[9px] text-slate-500 leading-tight">
                        Pandaan - Pasuruan, Jawa Timur | Telp Darurat: 112 / (0343) 631000
                      </p>
                    </div>
                  </div>

                  {/* Center: Title & SIKA Number */}
                  <div className="col-span-12 sm:col-span-4 p-3 sm:p-4 flex flex-col justify-center text-center bg-white border-t-2 sm:border-t-0 border-slate-900">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                      FORMULIR SISTEM MANAJEMEN K3 (SMK3)
                    </span>
                    <h2 className="text-sm sm:text-base font-black uppercase text-blue-950 tracking-tight">
                      SURAT IZIN KERJA AMAN (SIKA)
                    </h2>
                    <span className="text-[10px] font-mono font-bold text-slate-600">
                      {permit.id || permit.permit_number || "SIKA-WB-2026"}
                    </span>
                    {isExtension && (
                      <span className="mt-0.5 inline-block text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-full mx-auto">
                        Perpanjangan Ke-{extensionPhase || 1}
                      </span>
                    )}
                  </div>

                  {/* Right: Document Control Box & QR */}
                  <div className="col-span-12 sm:col-span-3 p-2.5 sm:p-3 text-[9px] flex items-center justify-between sm:flex-col sm:justify-center sm:items-center text-center bg-slate-50 border-t-2 sm:border-t-0 border-slate-900">
                    {(permit.qrToken || permit.qr_code_token) ? (
                      <div className="bg-white p-1 rounded-md border border-slate-300 shadow-2xs mb-1">
                        <QRCodeSVG value={permit.qrToken || permit.qr_code_token} size={42} />
                      </div>
                    ) : (
                      <div className="text-[9px] font-mono text-slate-400 mb-1">PTWB-VERIFIED</div>
                    )}
                    <div className="text-left sm:text-center font-mono space-y-0.5 text-slate-700">
                      <div><strong>No. Dok:</strong> WB-HSE-FM-01</div>
                      <div><strong>Revisi:</strong> 02 | <strong>Tgl:</strong> 01/01/26</div>
                      <div className={cn("font-bold text-[9px] uppercase", isApproved ? "text-emerald-700" : "text-amber-700")}>
                        ● {isApproved ? "DISETUJUI RESMI" : "DRAFT PENGAJUAN"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

          {/* 1. General Info Box */}
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 font-bold px-4 py-2 border-b border-slate-300 uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span>I. DATA PERMOHONAN & PELAKSANA PEKERJAAN</span>
              {isExtension && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  SIKA Perpanjangan {extensionPhase > 0 ? `Ke-${extensionPhase}` : ""} {rootNumber ? `(Induk: ${rootNumber})` : ""}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 p-4 gap-y-2.5 gap-x-6">
              <div><span className="text-slate-500 block">Nama Perusahaan Kontraktor:</span><strong className="text-sm">{permit.namaKontraktor || permit.kontraktor || '-'}</strong></div>
              <div><span className="text-slate-500 block">Jenis / Judul Pekerjaan:</span><strong className="text-sm">{permit.jenisPekerjaan || '-'}</strong></div>
              <div><span className="text-slate-500 block">Lokasi / Area Pabrik:</span><strong>{permit.lokasi || '-'}</strong></div>
              <div>
                <span className="text-slate-500 block">
                  Masa Berlaku Izin {extensionPhase > 0 ? `(Fase ${extensionPhase} Aktif)` : "(Periode Aktif)"}:
                </span>
                <strong>{formatDateDDMMYY(permit.mulaiKerja)} s/d {formatDateDDMMYY(permit.selesaiKerja)} ({permit.jamKerjaMulai} - {permit.jamKerjaAkhir} WIB)</strong>
                {isExtension && (
                  <div className="mt-1.5 p-2 bg-amber-50/90 border border-amber-200 rounded-md text-[11px] text-amber-900 leading-tight">
                    <div className="font-bold flex items-center gap-1.5 flex-wrap">
                      <span>Rentang Kumulatif Proyek:</span>
                      <span className="font-mono text-amber-950 underline">{formatDateDDMMYY(cumulativeStart)} s/d {formatDateDDMMYY(cumulativeEnd)}</span>
                      <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        Total {cumulativeDays} Hari Kalender
                      </span>
                    </div>
                    {rootNumber && (
                      <div className="text-[10px] text-amber-700 mt-1">
                        SIKA Induk Pertama: <span className="font-mono font-semibold">{rootNumber}</span>
                        {parentNumber && parentNumber !== rootNumber && (
                          <span className="ml-2">| SIKA Sebelumnya: <span className="font-mono font-semibold">{parentNumber}</span></span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div><span className="text-slate-500 block">Penanggung Jawab [Vendor / Rekanan]:</span><strong>{permit.penanggungJawab || '-'} ({permit.noHpPJ || '-'})</strong></div>
              <div><span className="text-slate-500 block">Pengawas Lapangan & K3 [Internal Widatra]:</span><strong>{permit.pengawasPekerjaan || '-'} / {permit.pengawasHse || '-'}</strong></div>
            </div>
          </div>

          {/* 2. Safety & APD */}
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 font-bold px-4 py-2 border-b border-slate-300 uppercase tracking-wider text-slate-800">
              II. KLASIFIKASI IZIN KERJA & ALAT PELINDUNG DIRI (APD) WAJIB
            </div>
            <div className="grid grid-cols-2 p-4 gap-4">
              <div>
                <span className="text-slate-500 block mb-1 font-semibold">Jenis Izin Kerja Terverifikasi:</span>
                <div className="flex flex-wrap gap-1">
                  {permit.permitTypes && permit.permitTypes.map((pt: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 rounded text-[11px] font-bold">
                      ✓ {pt}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block mb-1 font-semibold">APD Wajib Digunakan di Lokasi:</span>
                <div className="flex flex-wrap gap-1">
                  {permit.ppe && permit.ppe.map((p: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 rounded text-[11px] font-medium">
                      • {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Workers List */}
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 font-bold px-4 py-2 border-b border-slate-300 uppercase tracking-wider text-slate-800">
              III. DAFTAR TENAGA KERJA BERWENANG ({permit.pekerja ? permit.pekerja.length : 0} Orang)
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-2 w-10 text-center">No</th>
                  <th className="px-4 py-2">Nama Tenaga Kerja</th>
                  <th className="px-4 py-2">Jabatan / Keahlian</th>
                  <th className="px-4 py-2">Alamat Domisili</th>
                  <th className="px-4 py-2 text-right">Identitas / KTP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permit.pekerja && permit.pekerja.length > 0 ? (
                  permit.pekerja.map((w: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-1.5 text-center">{i + 1}</td>
                      <td className="px-4 py-1.5 font-bold">{w.nama}</td>
                      <td className="px-4 py-1.5 text-slate-600">{w.jabatan || "-"}</td>
                      <td className="px-4 py-1.5 text-slate-500">{w.alamat || "-"}</td>
                      <td className="px-4 py-1.5 text-right font-medium">
                        {w.id_card_photo ? (
                          <span className="text-emerald-700 font-semibold">✓ Terlampir</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-2 text-center text-slate-400 italic">
                      Tidak ada data pekerja terdaftar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

                    {/* IV. Pernyataan & Disclaimer Keselamatan K3 (Dicentang [✓]) */}
          <div className="border-2 border-blue-900/30 bg-blue-50/60 rounded-xl p-3.5 text-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-950 font-bold text-xs uppercase tracking-wide">
              <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                ✓
              </span>
              <span>IV. PERNYATAAN &amp; DISCLAIMER KESELAMATAN (K3) TELAH DICENTANG &amp; DISETUJUI</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-700 leading-snug">
              <div className="p-2.5 bg-white/90 rounded-lg border border-blue-150">
                <span className="font-bold text-blue-900 block mb-0.5 flex items-center gap-1">
                  <span className="text-emerald-700 font-bold">☑</span> Pernyataan Pemohon / Kontraktor Pelaksana:
                </span>
                Telah membaca, memahami, dan menyetujui seluruh ketentuan K3 PT Widatra Bhakti. Pekerjaan akan dilaksanakan sesuai prosedur aman, JSA terlampir, dan APD wajib digunakan secara disiplin selama berada di area pabrik.
              </div>
              <div className="p-2.5 bg-white/90 rounded-lg border border-blue-150">
                <span className="font-bold text-blue-900 block mb-0.5 flex items-center gap-1">
                  <span className="text-emerald-700 font-bold">☑</span> Pernyataan Otorisasi Reviewer &amp; HSE PT Widatra Bhakti:
                </span>
                Telah memeriksa persyaratan teknis, kesiapan pekerja, dan kelayakan mitigasi bahaya di lapangan. Surat Izin Kerja Aman ini diotorisasi secara digital dan sah berlaku sesuai masa berlakunya.
              </div>
            </div>
          </div>

          {/* V. Four Sign-off Approval Boxes */}
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 font-bold px-4 py-2 border-b border-slate-300 uppercase tracking-wider text-slate-800">
              V. PENGESAHAN & PERSETUJUAN OTORISASI BERJENJANG
            </div>
            <div className="grid grid-cols-4 divide-x divide-slate-300 text-center">
              <div className="p-3 space-y-8">
                <span className="font-bold text-slate-600 text-[11px] block">1. PIC Internal Widatra</span>
                <div className="font-bold text-emerald-700 text-xs">TERVERIFIKASI SISTEM</div>
                <span className="text-[10px] text-slate-500 block border-t pt-1 border-slate-200">PIC PT Widatra Bhakti</span>
              </div>
              <div className="p-3 space-y-8">
                <span className="font-bold text-slate-600 text-[11px] block">2. Tim K3 / HSE Officer</span>
                <div className="font-bold text-emerald-700 text-xs">TERVERIFIKASI SISTEM</div>
                <span className="text-[10px] text-slate-500 block border-t pt-1 border-slate-200">HSE Department</span>
              </div>
              <div className="p-3 space-y-8">
                <span className="font-bold text-slate-600 text-[11px] block">3. Head Dept HRD&GA</span>
                <div className="font-bold text-emerald-700 text-xs">TERVERIFIKASI SISTEM</div>
                <span className="text-[10px] text-slate-500 block border-t pt-1 border-slate-200">Head Dept HRD & GA</span>
              </div>
              <div className="p-3 space-y-8">
                <span className="font-bold text-slate-600 text-[11px] block">4. Head Division HRD&GA</span>
                <div className="font-bold text-emerald-700 text-xs">DISAHKAN DIGITAL</div>
                <span className="text-[10px] text-slate-500 block border-t pt-1 border-slate-200">Head Division HRD & GA</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-200">
            <div>
              * Lembar izin kerja ini wajib dipasang di papan informasi keselamatan kerja (Permit Board) di dekat lokasi pekerjaan.
            </div>
            <div className="font-mono">Dicetak otomatis melalui HSE Portal PT Widatra Bhakti</div>
          </div>

        </div>{/* Closes printable-permit-content */}

      </div>{/* Closes overflow-y-auto flex-1 */}

      {/* 3. Modal Footer (ALWAYS VISIBLE & STICKY AT BOTTOM) */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0 z-20">
        <div className="text-xs text-slate-500">
          Tekan <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono text-slate-700 font-semibold shadow-xs">Esc</kbd> atau klik di luar untuk menutup
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Tutup Jendela
          </button>
          
          {isApproved ? (
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Membuat PDF...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Unduh PDF Langsung</span>
                </>
              )}
            </button>
          ) : (
            <button
              disabled
              className="px-4 py-2 bg-gray-200 text-gray-500 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-not-allowed opacity-75"
              title="Dokumen belum disetujui resmi oleh Head Division HRD&GA"
            >
              <Lock size={14} />
              <span>Belum Disetujui (Cetak Terkunci)</span>
            </button>
          )}
        </div>
      </div>

    </div>{/* Closes modal window */}
  </div>{/* Closes backdrop */}
</>
  );
}
