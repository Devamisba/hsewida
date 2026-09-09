import { useState } from "react";
import { X, Save, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
}

export function AddInspectionModal({ isOpen, onClose, activeTab }: AddInspectionModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulasi pengiriman data
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 1000);
  };

  const getTitle = () => {
    switch (activeTab) {
      case "apar": return "Data APAR Baru";
      case "hydrant": return "Data Pilar Hydrant Baru";
      case "emergency": return "Data Pintu Darurat Baru";
      case "p3k": return "Data Kotak P3K Baru";
      case "mirror": return "Data Safety Mirror Baru";
      case "assembly": return "Data Titik Kumpul Baru";
      default: return "Data Inspeksi Baru";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Tambah {getTitle()}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Daftarkan fasilitas baru ke sistem</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">ID / Kode Alat <span className="text-error">*</span></label>
            <input required type="text" placeholder="Contoh: AP-004" className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lokasi Penempatan <span className="text-error">*</span></label>
            <input required type="text" placeholder="Contoh: Gudang Bahan Baku" className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>

          {activeTab === 'apar' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis</label>
                <select className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-primary/20">
                  <option>Powder</option>
                  <option>CO2</option>
                  <option>Foam</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kapasitas</label>
                <input type="text" placeholder="Misal: 6 Kg" className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
            <button disabled={loading} type="submit" className={cn("px-4 py-2 text-sm font-bold text-white bg-primary hover:opacity-90 rounded-lg shadow-sm flex items-center gap-2", loading && "opacity-70 cursor-not-allowed")}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {loading ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
