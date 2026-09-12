import { useRef } from "react";
import { X, Printer, ShieldCheck } from "lucide-react";

interface PrintPermitModalProps {
  permit: any;
  onClose: () => void;
}

export function PrintPermitModal({ permit, onClose }: PrintPermitModalProps) {
  const printContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  if (!permit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden flex flex-col">
        
        {/* Modal Controls (Not printed) */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Printer size={18} className="text-blue-400" />
            <span>Format Cetak Lembar Ijin Kerja Resmi (Factory Standard)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer size={14} /> Cetak / Unduh PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Paper Document (A4 format) */}
        <div ref={printContentRef} className="p-8 md:p-12 text-slate-900 bg-white font-sans space-y-6 print:p-0">
          
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

            <div className="text-right border-2 border-slate-900 p-2.5 rounded-xl bg-slate-50">
              <div className="text-[10px] uppercase font-bold text-slate-500">SURAT IJIN KERJA AMAN</div>
              <div className="text-base font-black font-mono text-blue-900">{permit.id || permit.permit_number}</div>
              <div className="text-[10px] font-bold text-emerald-700">STATUS: {permit.status?.toUpperCase() || 'DISETUJUI'}</div>
            </div>
          </div>

          {/* 1. General Info Box */}
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 font-bold px-4 py-2 border-b border-slate-300 uppercase tracking-wider text-slate-800">
              I. DATA PERMOHONAN & PELAKSANA PEKERJAAN
            </div>
            <div className="grid grid-cols-2 p-4 gap-y-2.5 gap-x-6">
              <div><span className="text-slate-500 block">Nama Perusahaan Kontraktor:</span><strong className="text-sm">{permit.namaKontraktor || permit.kontraktor || '-'}</strong></div>
              <div><span className="text-slate-500 block">Jenis / Judul Pekerjaan:</span><strong className="text-sm">{permit.jenisPekerjaan || '-'}</strong></div>
              <div><span className="text-slate-500 block">Lokasi / Area Pabrik:</span><strong>{permit.lokasi || '-'}</strong></div>
              <div><span className="text-slate-500 block">Masa Berlaku Ijin:</span><strong>{permit.mulaiKerja} s/d {permit.selesaiKerja} ({permit.jamKerjaMulai} - {permit.jamKerjaAkhir} WIB)</strong></div>
              <div><span className="text-slate-500 block">Penanggung Jawab Kontraktor:</span><strong>{permit.penanggungJawab || '-'} ({permit.noHpPJ || '-'})</strong></div>
              <div><span className="text-slate-500 block">Pengawas K3 / Lapangan:</span><strong>{permit.pengawasHse || permit.pengawasPekerjaan || '-'}</strong></div>
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
                  <th className="px-4 py-2 w-10">No</th>
                  <th className="px-4 py-2">Nama Tenaga Kerja</th>
                  <th className="px-4 py-2">Jabatan / Keahlian</th>
                  <th className="px-4 py-2 text-right">Status BPJS / Asuransi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permit.pekerja && permit.pekerja.map((w: any, i: number) => (
                  <tr key={i}>
                    <td className="px-4 py-1.5">{i + 1}</td>
                    <td className="px-4 py-1.5 font-bold">{w.nama}</td>
                    <td className="px-4 py-1.5 text-slate-600">{w.jabatan}</td>
                    <td className="px-4 py-1.5 text-right text-emerald-700 font-semibold">Aktif & Terdaftar</td>
                  </tr>
                ))}
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

        </div>

      </div>
    </div>
  );
}
