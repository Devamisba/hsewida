import { useState } from "react";
import { X, Save, ShieldAlert, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

interface AddInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSuccess?: () => void;
}

export function AddInspectionModal({ isOpen, onClose, activeTab, onSuccess }: AddInspectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [specType, setSpecType] = useState("Powder");
  const [specCapacity, setSpecCapacity] = useState("6 Kg");

  if (!isOpen) return null;

  const getCategoryKey = (tab: string) => {
    switch (tab) {
      case "apar": return "apar";
      case "hydrant": return "hydrant";
      case "emergency": return "emergency_door";
      case "p3k": return "p3k";
      case "mirror": return "safety_mirror";
      case "assembly": return "assembly_point";
      default: return "apar";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const category = getCategoryKey(activeTab);
      let specifications: Record<string, any> = {};

      if (activeTab === "apar") {
        specifications = { type: specType, capacity: specCapacity, pressure: "Normal" };
      } else if (activeTab === "hydrant") {
        specifications = { type: specType || "Pillar Hydrant", pressure_bar: 7.0, equipment: "Lengkap" };
      } else if (activeTab === "emergency") {
        specifications = { mechanism: "Push Panic Bar", exit_sign: "Lit", pathway: "Clear" };
      } else if (activeTab === "p3k") {
        specifications = { box_type: "Kotak P3K Standar", checklist: "Lengkap" };
      } else if (activeTab === "mirror") {
        specifications = { diameter: "80 cm", surface: "Convex", view: "Clear" };
      } else if (activeTab === "assembly") {
        specifications = { capacity: specCapacity || "100 Personel", signage: "Visible Reflective" };
      }

      const res = await api.createFacility({
        code,
        category,
        location,
        specifications,
        status: "Good",
      });

      if (res.success) {
        setCode("");
        setLocation("");
        onSuccess?.();
        onClose();
      } else {
        setError(res.message || "Gagal menambahkan fasilitas.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghubungkan ke server.");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case "apar": return "Data APAR Baru";
      case "hydrant": return "Data Pilar Hydrant Baru";
      case "emergency": return "Data Pintu Darurat Baru";
      case "p3k": return "Data Kotak P3K Baru";
      case "mirror": return "Data Safety Mirror Baru";
      case "assembly": return "Data Titik Kumpul Baru";
      default: return "Data Fasilitas Baru";
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
              <p className="text-xs text-gray-500 mt-0.5">Daftarkan fasilitas baru ke sistem real</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-error-container/20 border border-error-container text-error rounded-lg flex items-center gap-2 text-xs font-semibold">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">ID / Kode Alat <span className="text-error">*</span></label>
            <input 
              required 
              type="text" 
              placeholder="Contoh: AP-004, HY-003, ED-003..." 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lokasi Penempatan <span className="text-error">*</span></label>
            <input 
              required 
              type="text" 
              placeholder="Contoh: Area Pabrik 1, Gudang Utama..." 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
            />
          </div>

          {activeTab === 'apar' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis</label>
                <select 
                  value={specType}
                  onChange={(e) => setSpecType(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Dry Chemical Powder">Powder</option>
                  <option value="Clean Agent / CO2">CO2</option>
                  <option value="Foam AFFF">Foam</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kapasitas</label>
                <input 
                  type="text" 
                  placeholder="Misal: 6 Kg" 
                  value={specCapacity}
                  onChange={(e) => setSpecCapacity(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                />
              </div>
            </div>
          )}

          {activeTab === 'assembly' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kapasitas Area</label>
              <input 
                type="text" 
                placeholder="Misal: 200 Personel" 
                value={specCapacity}
                onChange={(e) => setSpecCapacity(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
              />
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
