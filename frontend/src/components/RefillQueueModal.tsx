import { useState, useEffect } from "react";
import { 
  X, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  Printer, 
  Search,
  Filter
} from "lucide-react";
import { api, SafetyFacility } from "@/services/api";

interface RefillQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFacilityForRefill?: (facility: SafetyFacility) => void;
}

export function RefillQueueModal({ isOpen, onClose, onSelectFacilityForRefill }: RefillQueueModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    total_refill_needed: number;
    breakdown: Record<string, number>;
    list: SafetyFacility[];
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("ALL");

  const fetchRefillData = async () => {
    setLoading(true);
    try {
      const res = await api.getRefillSummary();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat rekap antrean refill:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRefillData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredList = (data?.list || []).filter((item) => {
    if (selectedZone !== "ALL" && item.area_zone !== selectedZone) {
      return false;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const locName = typeof item.location === "object" ? item.location?.name : item.location;
    return (
      item.code.toLowerCase().includes(term) ||
      (locName && String(locName).toLowerCase().includes(term)) ||
      (item.specifications?.type && item.specifications.type.toLowerCase().includes(term)) ||
      (item.specifications?.capacity && item.specifications.capacity.toLowerCase().includes(term))
    );
  });

  const handlePrintList = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden">
        
        {/* Header (Screen only) */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Daftar Antrean Pengisian Ulang (Refill) APAR</span>
                <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {data?.total_refill_needed || 0} Unit
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Monitoring tabung APAR kadaluarsa / siap kirim ke vendor rekanan PT Widatra Bhakti
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintList}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Printer size={14} /> Cetak Daftar
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-600">Memuat data 27 antrean refill tabung...</p>
            </div>
          ) : (
            <>
              {/* Media Breakdown Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
                {Object.entries(data?.breakdown || {}).map(([key, count]) => (
                  <div key={key} className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase text-amber-800 tracking-wide block">
                        {key}
                      </span>
                      <span className="text-xs text-amber-600 font-semibold mt-0.5 block">
                        Siap Refill Media
                      </span>
                    </div>
                    <div className="text-2xl font-black text-amber-900 bg-white px-3 py-1 rounded-xl shadow-xs border border-amber-200">
                      {count}
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters & Search Toolbar (Screen only) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
                <div className="relative flex-1 max-w-sm">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari kode unit / lokasi antrean..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                    <Filter size={12} /> Zona:
                  </span>
                  {["ALL", "UMUM", "FACTORY 1", "FACTORY 2 & WORKSHOP", "WARE HOUSE"].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setSelectedZone(z)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                        selectedZone === z 
                          ? "bg-amber-600 text-white shadow-sm" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {z === "ALL" ? "Semua Zona" : z}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table of Refill Queue */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-extrabold text-slate-700">Kode & Tag</th>
                      <th className="px-4 py-3 font-extrabold text-slate-700">Zona & Lokasi</th>
                      <th className="px-4 py-3 font-extrabold text-slate-700">Spesifikasi Media</th>
                      <th className="px-4 py-3 font-extrabold text-slate-700">Batas Kadaluarsa</th>
                      <th className="px-4 py-3 font-extrabold text-slate-700 text-right print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-medium">
                          Tidak ada tabung dalam antrean yang sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((item) => {
                        const locName = typeof item.location === "object" ? item.location?.name : item.location;
                        const specs = item.specifications || {};
                        const expDate = item.consumable_cycle?.expired_at || "-";

                        return (
                          <tr key={item.id} className="hover:bg-amber-50/40 transition">
                            <td className="px-4 py-3">
                              <span className="font-extrabold text-slate-900 block text-xs">{item.code}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Tag: {specs.tag_number || item.code}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase mb-0.5">
                                {item.area_zone || "ZONA"}
                              </span>
                              <div className="text-slate-800 font-medium truncate max-w-[220px]">
                                {locName || "-"}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-800 block">
                                {specs.type || "Dry Chemical Powder"}
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                Kapasitas: <strong>{specs.capacity || "3 Kg"}</strong>
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                                <Clock size={12} /> {expDate}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right print:hidden">
                              {onSelectFacilityForRefill && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectFacilityForRefill(item);
                                    onClose();
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Catat Refill</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>PT Widatra Bhakti • Standar Refill Pengisian Ulang APAR</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-2xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
