import { useRef, useState, useEffect } from "react";
import { X, Printer, Download, Loader2, FileText, Lock, AlertTriangle } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { QRCodeSVG } from "./QRCodeSVG";
import { cn, formatPermitStatus } from "@/lib/utils";

interface PrintPermitModalProps {
  permit: any;
  onClose: () => void;
}

// Helper: terbilang angka kecil (1-100) untuk jumlah tenaga kerja
function formatTerbilang(n: number): string {
  const words = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  if (n <= 11) return words[n] || String(n);
  if (n < 20) return words[n - 10] + " belas";
  if (n < 100) return words[Math.floor(n / 10)] + " puluh" + (n % 10 !== 0 ? " " + words[n % 10] : "");
  return String(n);
}

// Helper: format tanggal panjang Indonesia (contoh: 11 November 2026)
function formatDateLongIndo(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const clean = String(dateStr).slice(0, 10);
    const parts = clean.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${d} ${months[m] || parts[1]} ${y}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    return dateStr;
  } catch {
    return dateStr || "-";
  }
}

export function PrintPermitModal({ permit, onClose }: PrintPermitModalProps) {
  const printContentRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const isApproved = permit?.status === "Disetujui" || permit?.status === "Selesai";
  
  const permitNo = permit?.permit_number || permit?.id || "001/IK-WB/X/2026";
  const contractorName = permit?.namaKontraktor || permit?.kontraktor || "-";
  const pjName = permit?.penanggungJawab || "-";
  const pjPhone = permit?.noHpPJ || "-";
  const supervisorName = permit?.pengawasPekerjaan || "-";
  const supervisorPhone = permit?.noHpPengawas || "-";
  const hseOfficerName = permit?.pengawasHse || "Tim K3 / HSE Lapangan";
  const hseOfficerPhone = permit?.noHpHse || "085566778899";
  
  const totalWorkers = Number(permit?.totalTenagaKerja || permit?.pekerja?.length || 1);
  const jobTitle = permit?.jenisPekerjaan || "-";
  const location = permit?.lokasi || "-";
  
  const startTime = (permit?.jamKerjaMulai || "08:00").replace(":", ".");
  const endTime = (permit?.jamKerjaAkhir || "16:00").replace(":", ".");
  const workingHours = `${startTime} s.d. ${endTime} WIB`;
  
  const startDateStr = formatDateLongIndo(permit?.mulaiKerja || permit?.start_date);
  const endDateStr = formatDateLongIndo(permit?.selesaiKerja || permit?.end_date);
  const validUntilStr = endDateStr;

  // URL yang dituju saat QR code discan
  const qrUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verify-permit/${permit?.qrToken || permit?.qr_code_token || permitNo}`
    : `https://hse.widatra.com/verify-permit/${permit?.qrToken || permit?.qr_code_token || permitNo}`;

  // Close modal on Escape key press and prevent background scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [onClose]);

  // One-click Direct PDF Download (1 Halaman Pas)
  const handleDownloadPDF = async () => {
    if (!printContentRef.current || isGenerating) return;
    
    if (!isApproved) {
      alert("Peringatan K3: Dokumen Izin Kerja ini belum disetujui resmi oleh Head Division HRD&GA dan belum dapat diunduh.");
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

      // Add single page
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, Math.min(pdfHeight, imgHeight), undefined, "FAST");

      const cleanName = String(permitNo).replace(/[^a-zA-Z0-9_-]/g, "_");
      pdf.save(`Izin_Kerja_${cleanName}.pdf`);
    } catch (error: any) {
      console.error("Gagal membuat PDF otomatis:", error);
      alert("Gagal mengunduh PDF: " + (error?.message || "Terjadi kesalahan saat memproses dokumen"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!isApproved) {
      alert("Peringatan K3: Dokumen Izin Kerja ini belum disetujui resmi oleh Head Division HRD&GA dan belum dapat dicetak.");
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
            padding: 16px !important;
            border: 1.5px solid #000 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Modal Window */}
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Modal Header (Sticky at top) */}
          <div className="px-4 py-3 bg-slate-900 text-white flex justify-between items-center shrink-0 z-20 shadow-md">
            <div className="flex items-center gap-2 text-sm font-bold">
              <FileText size={18} className="text-blue-400 shrink-0" />
              <span className="truncate">Lembar Izin Kerja Resmi (Format Standar Pabrik)</span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
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
          <div className="overflow-y-auto flex-1 p-3 sm:p-6 bg-slate-100 flex flex-col items-center">
            
            {/* Printable Paper Document (Single Page A4, Format Standar Lampiran) */}
            <div 
              ref={printContentRef} 
              id="printable-permit-content"
              className="w-full max-w-[760px] bg-white text-slate-900 font-sans p-6 sm:p-8 shadow-xl my-2 flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:my-0"
              style={{ minHeight: "1050px" }}
            >
              
              {/* BINGKAI HITAM DOKUMEN (PERSIS SEPERTI IKWB2.pdf) */}
              <div className="border-2 border-slate-900 p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                
                {/* KOP HEADER: SIMETRIS 100% PUSAT (JUDUL IZIN KERJA DEAD-CENTER) DENGAN 3 GARIS PEMBAGI VERTIKAL */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
                  {/* SAYAP KIRI (flex-1): Logo K3 + Slogan Resmi K3 */}
                  <div className="flex-1 flex items-center justify-between min-w-0 pr-2 sm:pr-4">
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <img 
                        src="/k3-logo-symbol.png" 
                        alt="Logo K3" 
                        className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="text-[7px] sm:text-[7.5px] font-black uppercase text-slate-800 leading-tight tracking-tight mt-1 text-center">
                        UTAMAKAN KESELAMATAN<br />DAN KESEHATAN KERJA
                      </span>
                    </div>

                    {/* Garis Pembagi 1: Antara Logo K3 dan IZIN KERJA */}
                    <div className="h-11 sm:h-12 w-[1px] bg-slate-300 shrink-0"></div>
                  </div>

                  {/* PUSAT (shrink-0): JUDUL DOKUMEN IZIN KERJA (DIJAMIN TEPAT DI TENGAH HORIZONTAL) */}
                  <div className="shrink-0 px-3 sm:px-6 text-center">
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-950 leading-none">
                      IZIN KERJA
                    </h1>
                    <p className="text-sm sm:text-base italic font-serif text-slate-700 mt-1 font-medium">
                      Work Permit
                    </p>
                  </div>

                  {/* SAYAP KANAN (flex-1): Lebar persis sama dengan Sayap Kiri */}
                  <div className="flex-1 flex items-center justify-between min-w-0 pl-2 sm:pl-4">
                    {/* Garis Pembagi 2: Antara IZIN KERJA dan Widatra */}
                    <div className="h-11 sm:h-12 w-[1px] bg-slate-300 shrink-0"></div>

                    <div className="flex-1 flex items-center justify-evenly gap-2 sm:gap-3 px-1">
                      {/* 3. Logo Widatra + Teks WIDATRA */}
                      <div className="flex flex-col items-center justify-center text-center">
                        <img 
                          src="/logo-widatra-symbol.png" 
                          alt="Logo Widatra" 
                          className="h-8 sm:h-9 w-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="text-[9px] sm:text-[10px] font-black text-blue-900 uppercase tracking-wider mt-0.5 whitespace-nowrap">
                          WIDATRA
                        </span>
                      </div>

                      {/* Garis Pembagi 3: Antara Widatra dan Otsuka */}
                      <div className="h-11 sm:h-12 w-[1px] bg-slate-300 shrink-0"></div>

                      {/* 4. Logo Otsuka */}
                      <div className="flex items-center justify-center">
                        <img 
                          src="/logo-otsuka.png" 
                          alt="Logo Otsuka" 
                          className="h-8 sm:h-9 w-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              {/* 1. TABEL DATA KONTRAKTOR */}
              <div className="border border-slate-900 text-xs overflow-hidden">
                <div className="bg-slate-200 px-3 py-1.5 font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 text-[11px]">
                  DATA KONTRAKTOR
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <tbody>
                    <tr className="border-b border-slate-900">
                      <td className="w-44 px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Nomor Izin Kerja
                      </td>
                      <td colSpan={3} className="px-3 py-1.5 font-mono font-bold text-slate-900">
                        {permitNo}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Nama Kontraktor
                      </td>
                      <td colSpan={3} className="px-3 py-1.5 font-bold uppercase text-slate-900">
                        {contractorName}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Penanggung Jawab
                      </td>
                      <td className="px-3 py-1.5 text-slate-900 border-r border-slate-900">
                        {pjName}
                      </td>
                      <td className="w-28 px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Nomor HP
                      </td>
                      <td className="w-44 px-3 py-1.5 text-slate-900 font-mono">
                        {pjPhone}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Pengawas Pekerjaan
                      </td>
                      <td className="px-3 py-1.5 text-slate-900 border-r border-slate-900">
                        {supervisorName}
                      </td>
                      <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Nomor HP
                      </td>
                      <td className="px-3 py-1.5 text-slate-900 font-mono">
                        {supervisorPhone}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Pengawas K3
                      </td>
                      <td className="px-3 py-1.5 text-slate-900 border-r border-slate-900">
                        {hseOfficerName}
                      </td>
                      <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Nomor HP
                      </td>
                      <td className="px-3 py-1.5 text-slate-900 font-mono">
                        {hseOfficerPhone}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Jumlah Tenaga Kerja
                      </td>
                      <td colSpan={3} className="px-3 py-1.5 text-slate-900">
                        {totalWorkers} ({formatTerbilang(totalWorkers)}) orang
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Jenis Pekerjaan
                      </td>
                      <td colSpan={3} className="px-3 py-1.5 text-slate-900">
                        {jobTitle}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Lokasi
                      </td>
                      <td colSpan={3} className="px-3 py-1.5 italic text-slate-800">
                        {location}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Jam Kerja
                      </td>
                      <td colSpan={3} className="px-3 py-1.5 text-slate-900 font-medium">
                        {workingHours}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Tanggal Mulai
                      </td>
                      <td className="px-3 py-1.5 text-slate-900 border-r border-slate-900">
                        {startDateStr}
                      </td>
                      <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Tanggal Selesai
                      </td>
                      <td className="px-3 py-1.5 text-slate-900">
                        {endDateStr}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-900">
                        Masa Berlaku Izin Kerja
                      </td>
                      <td colSpan={3} className="px-3 py-1.5 font-bold text-slate-950">
                        {validUntilStr}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 2. TABEL KONTAK DARURAT */}
              <div className="border border-slate-900 text-xs overflow-hidden">
                <div className="bg-slate-200 px-3 py-1.5 font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 text-[11px]">
                  KONTAK DARURAT
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-50/70 font-bold text-slate-900 text-[11px]">
                      <th className="px-3 py-1.5 border-r border-slate-900 w-1/3">Nama</th>
                      <th className="px-3 py-1.5 border-r border-slate-900 w-1/3">Jabatan</th>
                      <th className="px-3 py-1.5 w-1/3">Nomor HP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    <tr>
                      <td className="px-3 py-1 border-r border-slate-900 font-semibold text-slate-900">
                        Nur Yakhya Romadhon
                      </td>
                      <td className="px-3 py-1 border-r border-slate-900 italic text-slate-700">
                        Safety Officer
                      </td>
                      <td className="px-3 py-1 font-mono text-slate-900">
                        +62 812-3487-2790
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1 border-r border-slate-900 font-semibold text-slate-900">
                        Denta Wisnu Pradipta
                      </td>
                      <td className="px-3 py-1 border-r border-slate-900 italic text-slate-700">
                        HSE Section Head
                      </td>
                      <td className="px-3 py-1 font-mono text-slate-900">
                        +62 822-3345-4591
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1 border-r border-slate-900 font-semibold text-slate-900">
                        Andaru Wana Perkasa
                      </td>
                      <td className="px-3 py-1 border-r border-slate-900 italic text-slate-700">
                        HRD &amp; GA Department Head
                      </td>
                      <td className="px-3 py-1 font-mono text-slate-900">
                        +62 821-3179-9311
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 3. CATATAN KESELAMATAN K3 */}
              <div className="border border-slate-900 text-xs overflow-hidden">
                <div className="bg-slate-200 px-3 py-1.5 font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 text-[11px]">
                  CATATAN
                </div>
                <div className="p-3 text-[11px] text-slate-800 space-y-1 leading-relaxed">
                  <p>1. Melaporkan segala bentuk ketidaksesuaian kepada penanggung jawab pekerjaan/proyek.</p>
                  <p>2. Melaporkan situasi darurat kepada PIC Kontak Darurat PT WIDATRA BHAKTI.</p>
                  <p>3. Menggunakan APD dan sarana pendukung lainnya sesuai dengan risiko dan bahaya di tempat kerja.</p>
                  <p>4. Menjaga kebersihan lingkungan kerja dan memastikan tidak ada sisa material yang mengotori lingkungan.</p>
                  <p>5. Tidak meninggalkan peralatan di tempat kerja tanpa pengamanan.</p>
                </div>
              </div>

                {/* 4. BAGIAN BAWAH: SATU KOTAK UTUH DENGAN GARIS PEMISAH VERTIKAL (PERSIS SEPERTI IKWB2.pdf) */}
                <div className="border border-slate-900 grid grid-cols-12 overflow-hidden bg-white">
                  {/* 4 Pedoman Keselamatan (Kiri) */}
                  <div className="col-span-8 p-3.5 flex flex-col justify-center text-xs space-y-1 font-bold text-slate-900 border-r border-slate-900">
                    <p>1. Utamakan Keselamatan dan Kesehatan Kerja</p>
                    <p>2. Kenali Bahaya di Tempat Kerja</p>
                    <p>3. Ingat, Kecelakaan Dapat Dicegah</p>
                    <p>4. Keselamatan Adalah Tanggung Jawab Semua Orang</p>
                  </div>

                  {/* Kotak QR Code (Kanan) */}
                  <div className="col-span-4 p-2.5 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold text-slate-900 mb-1 uppercase tracking-wide">
                      QR Code
                    </span>
                    <div className="bg-white p-1 rounded-sm border border-slate-300 shadow-2xs">
                      <QRCodeSVG value={qrUrl} size={84} />
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1 leading-tight font-medium">
                      Data izin kerja:<br />
                      Nomor &ndash; Masa Berlaku
                    </div>
                  </div>
                </div>

              </div>{/* Closes BINGKAI HITAM DOKUMEN */}

              {/* FOOTER RESMI DOKUMEN (DI LUAR BINGKAI HITAM, DI TENGAH MARGIN BAWAH PERSIS IKWB2.pdf) */}
              <div className="pt-2 text-center text-[10px] text-slate-500 font-mono">
                Dokumen Izin Kerja Nomor {permitNo} | {contractorName}
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}
