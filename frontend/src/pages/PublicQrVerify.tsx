import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  XCircle, 
  CheckCircle2, 
  Users, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HardHat
} from "lucide-react";
import { api } from "@/services/api";

function formatTerbilang(n: number): string {
  const words = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  if (n <= 11) return words[n] || String(n);
  if (n < 20) return words[n - 10] + " belas";
  if (n < 100) return words[Math.floor(n / 10)] + " puluh" + (n % 10 !== 0 ? " " + words[n % 10] : "");
  return String(n);
}

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

export default function PublicQrVerifyPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWorkers, setShowWorkers] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!token) throw new Error("Token verifikasi tidak ditemukan.");
        const res = await api.verifyQrToken(token);
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.message || "Izin kerja tidak valid.");
        }
      } catch (err: any) {
        setError(err.message || "Gagal memverifikasi QR Code.");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const isValid = data?.status === 'Disetujui' || data?.status === 'Selesai';
  const totalWorkers = Number(data?.total_workers || data?.workers?.length || 1);
  const startDateStr = formatDateLongIndo(data?.start_date);
  const endDateStr = formatDateLongIndo(data?.end_date);
  const validUntilStr = endDateStr;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-3 sm:p-6 font-sans antialiased">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden my-4">
        
        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-slate-600">Memeriksa data izin kerja di sistem HSE Widatra...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={36} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-rose-700">QR Code Tidak Terdaftar / Tidak Valid</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{error}</p>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold max-w-md mx-auto">
              PERINGATAN: Pekerja dilarang memasuki area pabrik PT Widatra Bhakti tanpa izin kerja resmi yang terverifikasi.
            </div>
            <div className="pt-2">
              <Link to="/login" className="text-xs text-blue-600 hover:underline">
                Login ke Portal HSE Widatra
              </Link>
            </div>
          </div>
        )}

        {/* Content Body: PERSIS SEPERTI GAMBAR LAMPIRAN */}
        {data && !loading && (
          <div className="p-4 sm:p-7 space-y-5">
            
            {/* KOP RESMI: SIMETRIS 100% PUSAT (JUDUL IZIN KERJA DEAD-CENTER) DENGAN 3 GARIS PEMBAGI VERTIKAL */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              {/* SAYAP KIRI (flex-1): Logo K3 + Slogan Resmi K3 */}
              <div className="flex-1 flex items-center justify-between min-w-0 pr-1.5 sm:pr-3">
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <img 
                    src="/k3-logo-symbol.png" 
                    alt="Logo K3" 
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-[6px] sm:text-[7.5px] font-black uppercase text-slate-800 leading-tight tracking-tight mt-0.5 sm:mt-1 text-center">
                    UTAMAKAN KESELAMATAN<br />DAN KESEHATAN KERJA
                  </span>
                </div>

                {/* Garis Pembagi 1: Antara Logo K3 dan IZIN KERJA */}
                <div className="h-9 sm:h-11 w-[1px] bg-slate-300 shrink-0"></div>
              </div>

              {/* PUSAT (shrink-0): JUDUL DOKUMEN IZIN KERJA (DIJAMIN TEPAT DI TENGAH HORIZONTAL) */}
              <div className="shrink-0 px-2 sm:px-4 text-center">
                <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-slate-950 leading-none">
                  IZIN KERJA
                </h1>
                <p className="text-[10px] sm:text-xs italic font-serif text-slate-700 mt-0.5 sm:mt-1 font-medium">
                  Work Permit
                </p>
              </div>

              {/* SAYAP KANAN (flex-1): Lebar persis sama dengan Sayap Kiri */}
              <div className="flex-1 flex items-center justify-between min-w-0 pl-1.5 sm:pl-3">
                {/* Garis Pembagi 2: Antara IZIN KERJA dan Widatra */}
                <div className="h-9 sm:h-11 w-[1px] bg-slate-300 shrink-0"></div>

                <div className="flex-1 flex items-center justify-evenly gap-1.5 sm:gap-3 px-0.5 sm:px-1">
                  {/* 3. Logo Widatra + Teks WIDATRA */}
                  <div className="flex flex-col items-center justify-center text-center">
                    <img 
                      src="/logo-widatra-symbol.png" 
                      alt="Logo Widatra" 
                      className="h-6 sm:h-8 w-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="text-[7.5px] sm:text-[9px] font-black text-blue-900 uppercase tracking-wider mt-0.5 whitespace-nowrap">
                      WIDATRA
                    </span>
                  </div>

                  {/* Garis Pembagi 3: Antara Widatra dan Otsuka */}
                  <div className="h-8 sm:h-10 w-[1px] bg-slate-300 shrink-0"></div>

                  {/* 4. Logo Otsuka */}
                  <div className="flex items-center justify-center">
                    <img 
                      src="/logo-otsuka.png" 
                      alt="Logo Otsuka" 
                      className="h-6 sm:h-8 w-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Status Pill */}
            <div className={`p-2.5 rounded-xl border text-center flex items-center justify-center gap-2 font-bold text-xs sm:text-sm shadow-2xs ${
              isValid
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              {isValid ? <CheckCircle2 className="text-emerald-600 shrink-0" size={18} /> : <AlertTriangle className="text-amber-600 shrink-0" size={18} />}
              <span>{isValid ? 'IZIN KERJA RESMI & TERVERIFIKASI SISTEM' : `STATUS IZIN: ${data.status?.toUpperCase()}`}</span>
            </div>

            {/* TABEL DATA KONTRAKTOR */}
            <div className="border border-slate-900 rounded-sm text-xs overflow-hidden shadow-xs">
              <div className="bg-slate-200 px-3 py-2 font-bold uppercase tracking-wider text-slate-950 border-b border-slate-900 text-xs">
                DATA KONTRAKTOR
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <tbody>
                    <tr className="border-b border-slate-900">
                      <td className="w-40 sm:w-48 px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Nomor Izin Kerja
                      </td>
                      <td colSpan={3} className="px-3 py-2 font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        {data.permit_number}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Nama Kontraktor
                      </td>
                      <td colSpan={3} className="px-3 py-2 font-bold uppercase text-slate-900">
                        {data.contractor}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Penanggung Jawab
                      </td>
                      <td className="px-3 py-2 text-slate-900 border-r border-slate-900">
                        {data.pic_name}
                      </td>
                      <td className="w-24 sm:w-28 px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Nomor HP
                      </td>
                      <td className="w-36 sm:w-44 px-3 py-2 text-slate-900 font-mono">
                        {data.pic_phone}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Pengawas Pekerjaan
                      </td>
                      <td className="px-3 py-2 text-slate-900 border-r border-slate-900">
                        {data.supervisor_name}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Nomor HP
                      </td>
                      <td className="px-3 py-2 text-slate-900 font-mono">
                        {data.supervisor_phone}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Pengawas K3
                      </td>
                      <td className="px-3 py-2 text-slate-900 border-r border-slate-900">
                        {data.hse_officer_name}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Nomor HP
                      </td>
                      <td className="px-3 py-2 text-slate-900 font-mono">
                        {data.hse_officer_phone}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Jumlah Tenaga Kerja
                      </td>
                      <td colSpan={3} className="px-3 py-2 text-slate-900">
                        {totalWorkers} ({formatTerbilang(totalWorkers)}) orang
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Jenis Pekerjaan
                      </td>
                      <td colSpan={3} className="px-3 py-2 text-slate-900 font-medium">
                        {data.job_title}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Lokasi
                      </td>
                      <td colSpan={3} className="px-3 py-2 italic text-slate-800">
                        {data.location}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Jam Kerja
                      </td>
                      <td colSpan={3} className="px-3 py-2 text-slate-900 font-medium">
                        {data.working_hours}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Tanggal Mulai
                      </td>
                      <td className="px-3 py-2 text-slate-900 border-r border-slate-900">
                        {startDateStr}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Tanggal Selesai
                      </td>
                      <td className="px-3 py-2 text-slate-900">
                        {endDateStr}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-900">
                        Masa Berlaku Izin Kerja
                      </td>
                      <td colSpan={3} className="px-3 py-2 font-bold text-slate-950">
                        {validUntilStr}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Accordion: Daftar Pekerja & APD (Optional for Security Gate Check) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setShowWorkers(!showWorkers)}
                className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-semibold text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-blue-600" />
                  <span>Lihat Rincian {totalWorkers} Tenaga Kerja Terdaftar &amp; APD</span>
                </div>
                {showWorkers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showWorkers && (
                <div className="p-4 bg-white border-t border-slate-200 space-y-3 animate-in fade-in">
                  {data.permit_types?.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">Jenis Izin Kerja Khusus:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {data.permit_types.map((pt: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[11px] font-medium">
                            ✓ {pt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.ppes?.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                        <HardHat size={13} className="text-amber-600" /> APD Wajib:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {data.ppes.map((ppe: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded text-[11px]">
                            {ppe}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">Daftar Pekerja Terverifikasi:</span>
                    <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                      {data.workers && data.workers.length > 0 ? (
                        data.workers.map((w: any, i: number) => (
                          <li key={i} className="p-2 flex items-center justify-between text-xs hover:bg-slate-50">
                            <span className="font-medium text-slate-900">{i + 1}. {w.name || w}</span>
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Lolos K3
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="p-2 text-slate-400 italic">Data pekerja mengikuti surat permohonan kontraktor.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Verification Info */}
            <div className="pt-2 text-center space-y-1">
              <p className="text-[11px] text-slate-500 font-mono">
                Sistem Manajemen K3 &amp; Keselamatan Lingkungan &bull; PT Widatra Bhakti
              </p>
              <div>
                <Link to="/login" className="text-xs font-semibold text-blue-600 hover:underline">
                  Login ke Portal HSE Widatra
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
