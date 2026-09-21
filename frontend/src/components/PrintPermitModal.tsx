import { useRef, useState, useEffect } from "react";
import { X, Printer, ShieldCheck, Download, Loader2, FileText, Lock, AlertTriangle } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { QRCodeSVG } from "./QRCodeSVG";
import { cn, calculateInclusiveDays } from "@/lib/utils";

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
  const parentNumber = permit?.parentPermit?.permit_number || permit?.parent_permit?.permit_number;
  const parentStartDate = permit?.parentPermit?.start_date || permit?.parent_permit?.start_date;
  const cumulativeStart = permit?.cumulativeStartDate || parentStartDate || permit?.mulaiKerja || permit?.start_date;
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
      alert("Peringatan K3: Dokumen Surat Ijin Kerja Aman (SIKA) ini belum disetujui resmi oleh HRD & GA Div Head dan belum dapat diunduh.");
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
      alert("Peringatan K3: Dokumen Surat Ijin Kerja Aman (SIKA) ini belum disetujui resmi oleh HRD & GA Div Head dan belum dapat dicetak.");
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
              <span className="truncate">Lembar Ijin Kerja Aman Resmi (Factory Standard)</span>
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
                title={!isApproved ? "Cetak terkunci: Menunggu persetujuan akhir dari GA Div Head" : "Unduh PDF"}
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
              <span>DOKUMEN DRAFT / BELUM DISETUJUI RESMI — Ijin kerja ini masih dalam tahap '{permit.status}' dan belum sah untuk operasional pabrik.</span>
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
              
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={28} className="text-blue-700" />
                    <h1 className="text-2xl font-black uppercase tracking-tight">PT WIDATRA BHAKTI</h1>
                  </div>
                  <p className="text-xs font-bold text-slate-600">DEPARTEMEN KESEHATAN, KESELAMATAN KERJA & LINGKUNGAN (HSE)</p>
                  <p className="text-[11px] text-slate-500">Jl. Raya Pandaan - Bangil, Pasuruan, Jawa Timur — Telepon Darurat: 112 / (0343) 631000</p>
                </div>

                <div className="text-right border-2 border-slate-900 p-2.5 rounded-xl bg-slate-50 flex items-center gap-3">
                  {(permit.qrToken || permit.qr_code_token) && (
                    <div className="bg-white p-1 rounded-lg border border-slate-300 shrink-0">
                      <QRCodeSVG value={permit.qrToken || permit.qr_code_token} size={48} />
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      SURAT IJIN KERJA AMAN {isExtension ? "(PERPANJANGAN)" : ""}
                    </div>
                    <div className="text-base font-black font-mono text-blue-900">{permit.id || permit.permit_number}</div>
                    <div className={cn("text-[10px] font-bold", isApproved ? "text-emerald-700" : "text-amber-700")}>
                      STATUS: {permit.status?.toUpperCase() || (isApproved ? 'DISETUJUI' : 'DRAFT')}
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
                  SIKA Perpanjangan {parentNumber ? `(Induk: ${parentNumber})` : ""}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 p-4 gap-y-2.5 gap-x-6">
              <div><span className="text-slate-500 block">Nama Perusahaan Kontraktor:</span><strong className="text-sm">{permit.namaKontraktor || permit.kontraktor || '-'}</strong></div>
              <div><span className="text-slate-500 block">Jenis / Judul Pekerjaan:</span><strong className="text-sm">{permit.jenisPekerjaan || '-'}</strong></div>
              <div><span className="text-slate-500 block">Lokasi / Area Pabrik:</span><strong>{permit.lokasi || '-'}</strong></div>
              <div>
                <span className="text-slate-500 block">Masa Berlaku Ijin (Periode Aktif):</span>
                <strong>{permit.mulaiKerja} s/d {permit.selesaiKerja} ({permit.jamKerjaMulai} - {permit.jamKerjaAkhir} WIB)</strong>
                {isExtension && (
                  <div className="mt-1.5 p-2 bg-amber-50/90 border border-amber-200 rounded-md text-[11px] text-amber-900 leading-tight">
                    <div className="font-bold flex items-center gap-1.5 flex-wrap">
                      <span>Rentang Kumulatif Proyek:</span>
                      <span className="font-mono text-amber-950 underline">{cumulativeStart} s/d {cumulativeEnd}</span>
                      <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        Total {cumulativeDays} Hari Kalender
                      </span>
                    </div>
                    {parentNumber && (
                      <div className="text-[10px] text-amber-700 mt-1">
                        Izin Induk SIKA: <span className="font-mono font-semibold">{parentNumber}</span> (Awal: {parentStartDate || '-'})
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
              II. KLASIFIKASI IJIN KERJA & ALAT PELINDUNG DIRI (APD) WAJIB
            </div>
            <div className="grid grid-cols-2 p-4 gap-4">
              <div>
                <span className="text-slate-500 block mb-1 font-semibold">Jenis Ijin Kerja Terverifikasi:</span>
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

          {/* 4. Four Sign-off Approval Boxes */}
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 font-bold px-4 py-2 border-b border-slate-300 uppercase tracking-wider text-slate-800">
              IV. PENGESAHAN & PERSETUJUAN OTORISASI BERJENJANG
            </div>
            <div className="grid grid-cols-4 divide-x divide-slate-300 text-center">
              <div className="p-3 space-y-8">
                <span className="font-bold text-slate-600 text-[11px] block">1. PIC Vendor Internal</span>
                <div className="font-bold text-emerald-700 text-xs">TERVERIFIKASI SISTEM</div>
                <span className="text-[10px] text-slate-500 block border-t pt-1 border-slate-200">PIC PT Widatra Bhakti</span>
              </div>
              <div className="p-3 space-y-8">
                <span className="font-bold text-slate-600 text-[11px] block">2. Tim K3 / HSE Officer</span>
                <div className="font-bold text-emerald-700 text-xs">TERVERIFIKASI SISTEM</div>
                <span className="text-[10px] text-slate-500 block border-t pt-1 border-slate-200">HSE Department</span>
              </div>
              <div className="p-3 space-y-8">
                <span className="font-bold text-slate-600 text-[11px] block">3. HRD & GA Dept Head</span>
                <div className="font-bold text-emerald-700 text-xs">TERVERIFIKASI SISTEM</div>
                <span className="text-[10px] text-slate-500 block border-t pt-1 border-slate-200">GA Department Head</span>
              </div>
              <div className="p-3 space-y-8">
                <span className="font-bold text-slate-600 text-[11px] block">4. HRD & GA Div Head</span>
                <div className="font-bold text-emerald-700 text-xs">DISAHKAN DIGITAL</div>
                <span className="text-[10px] text-slate-500 block border-t pt-1 border-slate-200">GA Division Head</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-200">
            <div>
              * Lembar ijin kerja ini wajib dipasang di papan informasi keselamatan kerja (Permit Board) di dekat lokasi pekerjaan.
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
              title="Dokumen belum disetujui resmi oleh GA Div Head"
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
