import { useState } from "react";
import { X, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
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

  const defaultNewExp = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  };

  const [newExpiredAt, setNewExpiredAt] = useState(defaultNewExp());
  const [vendorName, setVendorName] = useState("PT Servvo Fire Safety");
  const [sealNumber, setSealNumber] = useState("");
  const [notes, setNotes] = useState("Penggantian isi media tabung baru dan uji tekanan.");

  if (!isOpen || !facility) return null;

  const setExtensionYears = (years: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
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
        setError(res.message || "Gagal mencatat penggantian media.");
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
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <RefreshCw size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Catat Refill / Penggantian Media</h3>
              <p className="text-[11px] text-slate-500 font-medium">Unit: {facility.code} • {facility.nama_item}</p>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Quick Extension Buttons */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1.5">
              Pilihan Cepat Masa Berlaku Baru:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExtensionYears(1)}
                className="py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-xl font-bold transition-all"
              >
                +1 Tahun (Standar)
              </button>
              <button
                type="button"
                onClick={() => setExtensionYears(2)}
                className="py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-xl font-bold transition-all"
              >
                +2 Tahun (CO2/Clean)
              </button>
              <button
                type="button"
                onClick={() => setExtensionYears(5)}
                className="py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-xl font-bold transition-all"
              >
                +5 Tahun (Hydrotest)
              </button>
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
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Vendor Pengisi */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Vendor Rekanan / Teknisi Pengisi
            </label>
            <input
              type="text"
              placeholder="Contoh: PT Servvo Fire, Tim Internal K3"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Nomor Segel Tabung Baru */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Nomor Segel / Barcode Tabung Baru
            </label>
            <input
              type="text"
              placeholder="Contoh: SEAL-2026-X812"
              value={sealNumber}
              onChange={(e) => setSealNumber(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono text-slate-900"
            />
          </div>

          {/* Catatan Perawatan */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Catatan Penggantian
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 resize-none"
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              <CheckCircle2 size={14} /> Simpan Penggantian Baru
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
