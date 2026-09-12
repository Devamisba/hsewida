import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ShieldCheck, 
  XCircle, 
  CheckCircle2, 
  Users, 
  AlertTriangle 
} from "lucide-react";
import { api } from "@/services/api";

export default function PublicQrVerifyPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
          setError(res.message || "Ijin kerja tidak valid.");
        }
      } catch (err: any) {
        setError(err.message || "Gagal memverifikasi QR Code.");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 font-sans antialiased">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header Branding */}
        <div className="bg-slate-900 text-white p-6 text-center">
          <div className="inline-flex p-3 bg-blue-600 rounded-2xl mb-3 shadow-lg shadow-blue-500/30">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-xl font-black tracking-tight">HSE Work Permit Verification</h1>
          <p className="text-xs text-slate-400 mt-1">PT Widatra Bhakti — Plant Safety & Security Gate</p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold text-slate-600">Memeriksa keabsahan QR Code di sistem...</p>
            </div>
          )}

          {error && !loading && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <XCircle size={36} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-rose-700">QR Code Tidak Valid / Tidak Terdaftar</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{error}</p>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
                PERINGATAN: Pekerja dilarang memasuki area pabrik tanpa ijin kerja resmi yang terverifikasi.
              </div>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div className={`p-4 rounded-2xl border text-center space-y-1 ${
                data.status === 'Disetujui' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center justify-center gap-2 font-black text-base">
                  {data.status === 'Disetujui' ? <CheckCircle2 className="text-emerald-600" size={22} /> : <AlertTriangle className="text-amber-600" size={22} />}
                  <span>{data.status === 'Disetujui' ? 'IJIN KERJA RESMI & VALID' : `STATUS: ${data.status.toUpperCase()}`}</span>
                </div>
                <div className="font-mono text-sm font-extrabold tracking-wider">{data.permit_number}</div>
              </div>

              {/* Permit Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Pekerjaan:</span>
                  <span className="font-bold text-slate-900 text-right">{data.job_title}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Kontraktor:</span>
                  <span className="font-bold text-slate-900">{data.contractor}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Lokasi Kerja:</span>
                  <span className="font-bold text-slate-900">{data.location}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Masa Berlaku:</span>
                  <span className="font-bold text-slate-900">{data.period}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Jam Kerja Harian:</span>
                  <span className="font-bold text-slate-900">{data.working_hours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tingkat Risiko:</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    data.risk_level === 'Tinggi' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                  }`}>{data.risk_level}</span>
                </div>
              </div>

              {/* Allowed Workers List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Users size={14} className="text-blue-600" /> Daftar Pekerja Diizinkan Masuk ({data.total_workers} Orang)
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto bg-slate-50 rounded-xl p-3 border border-slate-200 divide-y divide-slate-200/60 text-xs">
                  {data.workers && data.workers.map((name: string, i: number) => (
                    <div key={i} className="py-1.5 flex items-center justify-between font-medium text-slate-800">
                      <span>{i + 1}. {name}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">Terverifikasi</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Instruction */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                <strong>Instruksi Petugas Keamanan (Security Gate):</strong>
                <p className="mt-0.5 text-blue-800">
                  Pastikan nama pekerja di atas sesuai dengan kartu identitas (KTP) fisik dan seluruh pekerja telah memakai APD dasar sebelum memasuki area pabrik.
                </p>
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs text-slate-500 hover:text-slate-800 underline">
              Login ke Portal HSE Widatra
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
