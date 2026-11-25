import { useState, useEffect } from "react";
import { X, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { api } from "@/services/api";

interface RecordRefillModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: any;
  onSuccess?: () => void;
}

export function RecordRefillModal({ isOpen, onClose, facility, onSuccess }: RecordRefillModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isP3k = facility?.category === "p3k" || facility?.tipe_fasilitas === "p3k";

  const defaultNewExp = (months = 12) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  };

  const [newExpiredAt, setNewExpiredAt] = useState(defaultNewExp(12));
  const [vendorName, setVendorName] = useState("");
  const [sealNumber, setSealNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (facility && isOpen) {
      if (isP3k) {
        setVendorName("Klinik PT Widatra Bhakti / Tim K3");
        setSealNumber(facility.specifications?.seal_number || "");
        setNotes("Pengisian ulang item obat & perlengkapan yang kurang/habis sesuai standar 21 item P3K.");
        setNewExpiredAt(defaultNewExp(12));
      } else {
        setVendorName("PT Servvo Fire Safety");
        setSealNumber("");
        setNotes("Penggantian isi media tabung baru dan uji tekanan.");
        setNewExpiredAt(defaultNewExp(12));
      }
      setError("");
    }
  }, [facility, isOpen, isP3k]);

  if (!isOpen || !facility) return null;

  const setExtensionMonths = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setNewExpiredAt(d.toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.recordRefill(facility.id || facility.rawId, {
        new_expired_at: newExpiredAt,
        vendor_name: vendorName,
        seal_number: sealNumber,
        notes: notes,
      });

      if (res.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(res.message || (isP3k ? "Gagal mencatat restock P3K." : "Gagal mencatat penggantian media."));
      }
    } catch (err: any) {
      setError(err.message || "Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95">
        
        {/* Header */}
        <div className={`p-4 border-b border-slate-100 flex items-center justify-between ${isP3k ? 'bg-emerald-50/70' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isP3k ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
              <RefreshCw size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isP3k ? "Catat Refill & Restock Kotak P3K" : "Catat Refill / Penggantian Media"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Unit: <span className="font-bold text-slate-700">{facility.code}</span> • {facility.nama_item || (isP3k ? 'Kotak P3K' : 'APAR')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {isP3k && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs flex items-start gap-2.5 text-emerald-900">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Standar 21 Item Kotak P3K</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Pengisian ulang ini akan merestock item yang kurang/habis dan memulihkan status unit menjadi <span className="font-bold">AMAN</span>.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Quick Extension Buttons */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1.5">
              {isP3k ? "Pilihan Cepat Masa Kadaluarsa Obat Baru:" : "Pilihan Cepat Masa Berlaku Baru:"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {isP3k ? (
                <>
                  <button
                    type="button"
                    onClick={() => setExtensionMonths(6)}
                    className="py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-xl font-bold transition-all"
                  >
                    +6 Bulan (Cairan/Saline)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtensionMonths(12)}
                    className="py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-xl font-bold transition-all text-emerald-800 border-emerald-200 bg-emerald-50/50"
                  >
                    +1 Tahun (Standar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtensionMonths(24)}
                    className="py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-xl font-bold transition-all"
                  >
                    +2 Tahun (Alat Medis)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setExtensionMonths(12)}
                    className="py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-xl font-bold transition-all"
                  >
                    +1 Tahun (Standar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtensionMonths(24)}
                    className="py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-xl font-bold transition-all"
                  >
                    +2 Tahun (CO2/Clean)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtensionMonths(60)}
                    className="py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-xl font-bold transition-all"
                  >
                    +5 Tahun (Hydrotest)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tanggal Kadaluarsa Baru */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Tanggal Kadaluarsa Baru (Expired Date) *
            </label>
            <input
              required
              type="date"
              value={newExpiredAt}
              onChange={(e) => setNewExpiredAt(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Vendor / Petugas Pengisi */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              {isP3k ? "Petugas / Klinik / Vendor Pengisi *" : "Vendor Rekanan / Teknisi Pengisi *"}
            </label>
            <input
              type="text"
              required
              placeholder={isP3k ? "Contoh: Klinik PT Widatra Bhakti, Tim K3" : "Contoh: PT Servvo Fire, Tim Internal K3"}
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Nomor Segel */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              {isP3k ? "Nomor Segel Plastik Kotak P3K (Opsional)" : "Nomor Segel / Barcode Tabung Baru"}
            </label>
            <input
              type="text"
              placeholder={isP3k ? "Contoh: SEAL-P3K-2026-01" : "Contoh: SEAL-2026-X812"}
              value={sealNumber}
              onChange={(e) => setSealNumber(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-slate-900"
            />
          </div>

          {/* Catatan Restock */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              {isP3k ? "Catatan Restock / Item yang Diisi Ulang *" : "Catatan Penggantian"}
            </label>
            <textarea
              rows={2}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer ${
                isP3k ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <CheckCircle2 size={14} /> {isP3k ? "Simpan Restock P3K" : "Simpan Penggantian Baru"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
