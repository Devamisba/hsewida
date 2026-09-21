import { useState, useEffect } from "react";
import { X, Save, ShieldAlert, AlertCircle, Clock, Calendar, CheckCircle2 } from "lucide-react";
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
  
  // Fields
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [tipeItem, setTipeItem] = useState<"CONSUMABLE" | "KONDISI">("CONSUMABLE");
  
  // Specifications
  const [specType, setSpecType] = useState("Dry Chemical Powder");
  const [specCapacity, setSpecCapacity] = useState("6 Kg");

  // Consumable fields
  const [expiredAt, setExpiredAt] = useState("");
  const [thresholdWarning, setThresholdWarning] = useState(30);

  // Condition fields
  const [intervalHari, setIntervalHari] = useState(30);

  useEffect(() => {
    if (isOpen) {
      setError("");
      // Default tipe based on tab
      const isConsumableTab = activeTab === "apar" || activeTab === "p3k";
      setTipeItem(isConsumableTab ? "CONSUMABLE" : "KONDISI");
      
      // Default expired date: 1 year from now
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      setExpiredAt(d.toISOString().slice(0, 10));
      
      // Default specs based on tab
      if (activeTab === "apar") {
        setSpecType("Dry Chemical Powder");
        setSpecCapacity("6 Kg");
      } else if (activeTab === "hydrant") {
        setSpecType("Pillar Hydrant");
        setSpecCapacity("Indoor / Box");
      } else if (activeTab === "p3k") {
        setSpecType("Kotak P3K Dinding Tipe A");
        setSpecCapacity("25 Personel");
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const getCategoryKey = (tab: string) => {
    switch (tab) {
      case "apar": return "apar";
      case "hydrant": return "hydrant";
      case "emergency": return "emergency_door";
      case "p3k": return "p3k";
      case "mirror": return "safety_mirror";
      case "assembly": return "assembly_point";
      default: return tab || "apar";
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
        specifications = { box_type: specType || "Kotak P3K Standar", checklist: "Lengkap" };
      } else if (activeTab === "mirror") {
        specifications = { diameter: "80 cm", surface: "Convex", view: "Clear" };
      } else if (activeTab === "assembly") {
        specifications = { capacity: specCapacity || "100 Personel", signage: "Visible Reflective" };
      }

      const payload: any = {
        code: code.trim(),
        name: name.trim() || undefined,
        category,
        location: location.trim(),
        specifications,
        status: "Good",
        tipe_item: tipeItem,
      };

      if (tipeItem === "CONSUMABLE") {
        payload.expired_at = expiredAt;
        payload.threshold_warning_hari = Number(thresholdWarning);
      } else {
        payload.interval_pemeriksaan_hari = Number(intervalHari);
      }

      const res = await api.createFacility(payload);

      if (res.success) {
        setCode("");
        setName("");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Tambah {getTitle()}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Daftarkan fasilitas K3 baru dengan sistem branching & QR tracking</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-xs font-semibold">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
          
          {/* Tipe Item Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Karakteristik & Tipe Pemantauan <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipeItem("CONSUMABLE")}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all flex flex-col gap-1",
                  tipeItem === "CONSUMABLE"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900">Consumable</span>
                  <Clock size={16} className={tipeItem === "CONSUMABLE" ? "text-primary" : "text-gray-400"} />
                </div>
                <p className="text-xs text-gray-500">Masa berlaku / Expired date (Media APAR, P3K)</p>
              </button>

              <button
                type="button"
                onClick={() => setTipeItem("KONDISI")}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all flex flex-col gap-1",
                  tipeItem === "KONDISI"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900">Kondisi Fisik</span>
                  <CheckCircle2 size={16} className={tipeItem === "KONDISI" ? "text-primary" : "text-gray-400"} />
                </div>
                <p className="text-xs text-gray-500">Non-consumable / Kondisi fisik (Hydrant, Pintu, Rambu)</p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">ID / Kode Alat <span className="text-red-500">*</span></label>
              <input 
                required 
                type="text" 
                placeholder="Contoh: AP-005, HY-003..." 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nama Item Deskriptif</label>
              <input 
                type="text" 
                placeholder="Contoh: APAR CO2 6kg - Lobby Lt.1" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Lokasi Penempatan Spesifik <span className="text-red-500">*</span></label>
            <input 
              required 
              type="text" 
              placeholder="Contoh: Area Produksi Gedung B Lt. 2 Koridor Timur" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
            />
          </div>

          {/* Specifications based on category */}
          {activeTab === 'apar' && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Jenis Media</label>
                <select 
                  value={specType}
                  onChange={(e) => setSpecType(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Dry Chemical Powder">Dry Chemical Powder</option>
                  <option value="Clean Agent / CO2">Clean Agent / CO2</option>
                  <option value="Foam AFFF">Foam AFFF</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kapasitas</label>
                <input 
                  type="text" 
                  placeholder="Misal: 6 Kg" 
                  value={specCapacity}
                  onChange={(e) => setSpecCapacity(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 outline-none" 
                />
              </div>
            </div>
          )}

          {activeTab === 'assembly' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kapasitas Titik Kumpul</label>
              <input 
                type="text" 
                placeholder="Misal: 200 Personel" 
                value={specCapacity}
                onChange={(e) => setSpecCapacity(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
              />
            </div>
          )}

          {/* Branch specific parameters */}
          {tipeItem === "CONSUMABLE" ? (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <Calendar size={15} /> Parameter Kadaluarsa (Consumable)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Expired / Kadaluarsa <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="date" 
                    value={expiredAt}
                    onChange={(e) => setExpiredAt(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Peringatan Awal (H- Hari)</label>
                  <select
                    value={thresholdWarning}
                    onChange={(e) => setThresholdWarning(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value={14}>H-14 Hari (2 Minggu)</option>
                    <option value={30}>H-30 Hari (1 Bulan Standar)</option>
                    <option value={60}>H-60 Hari (2 Bulan)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                <Clock size={15} /> Parameter Inspeksi Berkala (Kondisi Fisik)
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Interval Siklus Inspeksi <span className="text-red-500">*</span></label>
                <select
                  value={intervalHari}
                  onChange={(e) => setIntervalHari(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value={14}>Setiap 14 Hari (Dua Mingguan)</option>
                  <option value={30}>Setiap 30 Hari (Bulanan Standar)</option>
                  <option value={60}>Setiap 60 Hari (Dua Bulanan)</option>
                  <option value={90}>Setiap 90 Hari (Triwulan)</option>
                </select>
              </div>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
            <button disabled={loading} type="submit" className={cn("px-4 py-2 text-sm font-bold text-white bg-primary hover:opacity-90 rounded-lg shadow-sm flex items-center gap-2", loading && "opacity-70 cursor-not-allowed")}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {loading ? "Menyimpan..." : "Simpan Fasilitas"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
