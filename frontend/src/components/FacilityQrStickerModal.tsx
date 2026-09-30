import { useState } from "react";
import { X, Printer, ShieldCheck, MapPin, QrCode, AlertCircle, Layers } from "lucide-react";
import { QRCodeSVG } from "./QRCodeSVG";

interface FacilityQrStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility?: any;
  allFacilities?: any[];
}

const formatStickerDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const clean = String(dateStr).slice(0, 10);
  const parts = clean.split("-");
  if (parts.length === 3) {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${parseInt(parts[2], 10)} ${months[mIdx] || parts[1]} ${parts[0]}`;
  }
  return clean;
};

export function FacilityQrStickerModal({ isOpen, onClose, facility, allFacilities }: FacilityQrStickerModalProps) {
  const [printMode, setPrintMode] = useState<"single" | "bulk">("single");
  const [bulkZone, setBulkZone] = useState<string>("ALL");

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Determine list of items to render
  let itemsToPrint: any[] = [];
  if (printMode === "bulk" && allFacilities && allFacilities.length > 0) {
    itemsToPrint = allFacilities.filter((item) => {
      if (bulkZone === "ALL") return true;
      return item.area_zone === bulkZone;
    });
  } else if (facility) {
    itemsToPrint = [facility];
  }

  const renderSingleSticker = (item: any) => {
    const isConsumable = item.tipe_item === "CONSUMABLE";
    
    const rawExpDate = item.consumable_cycle?.expired_at || 
                       item.consumableCycle?.expired_at || 
                       item.expired_at;
    const expDateFormatted = formatStickerDate(rawExpDate);

    const rawLastRefill = item.consumable_cycle?.last_refilled_at || 
                          item.consumableCycle?.last_refilled_at;
    const lastRefillFormatted = formatStickerDate(rawLastRefill);

    const rawLastInspection = item.condition_schedule?.terakhir_diperiksa_at || 
                              item.conditionSchedule?.terakhir_diperiksa_at || 
                              item.last_inspected_at;
    const lastInspectionFormatted = formatStickerDate(rawLastInspection);

    const intervalDays = item.condition_schedule?.interval_pemeriksaan_hari || 
                         item.conditionSchedule?.interval_pemeriksaan_hari || 30;

    const locationName = typeof item.location === "object" 
      ? item.location?.name 
      : (item.location || item.lokasi || "-");

    const displayName = item.nama_item || item.name || item.code;

    // Direct scan URL for phone cameras
    const qrPayload = typeof window !== "undefined" 
      ? `${window.location.origin}/scan/apar/${item.code}` 
      : (item.qr_code_id || item.code);

    return (
      <div 
        key={item.id || item.code}
        className="w-full max-w-[305px] bg-white border-2 border-slate-900 rounded-xl p-3.5 shadow-sm print:shadow-none print:border-2 print:border-black print:rounded-none print:w-[290px] print:max-w-none text-slate-900 font-sans space-y-2.5 break-inside-avoid mb-4 print:mb-6"
      >
        {/* Kop Pabrik */}
        <div className="border-b-2 border-slate-900 pb-1.5 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck size={16} className="text-blue-700 print:text-black" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">PT WIDATRA BHAKTI</span>
          </div>
          <p className="text-[8.5px] font-extrabold uppercase tracking-tight text-slate-600 print:text-black mt-0.5">
            KARTU IDENTIFIKASI & KESIAPAN ALAT K3
          </p>
        </div>

        {/* QR Code Center */}
        <div className="flex flex-col items-center justify-center py-0.5">
          <div className="p-1.5 border border-slate-200 rounded-lg bg-white shadow-xs">
            <QRCodeSVG value={qrPayload} size={105} />
          </div>
          <span className="font-mono text-xs font-black tracking-widest text-slate-900 mt-1">
            {item.qr_code_id || `QR-${item.code}`}
          </span>
        </div>

        {/* Detail Info Box */}
        <div className="border border-slate-300 rounded-lg p-2 text-xs space-y-1.5 bg-slate-50/70 print:bg-white">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 print:text-black shrink-0">Nama Unit:</span>
            <span className="text-[11px] font-bold text-right text-slate-900 leading-tight">{displayName}</span>
          </div>

          {item.area_zone && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 print:text-black shrink-0">Zona Area:</span>
              <span className="text-[10px] font-black uppercase text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 print:border-black print:text-black">
                {item.area_zone}
              </span>
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 print:text-black shrink-0">Lokasi:</span>
            <span className="text-[11px] font-semibold text-right text-slate-800 flex items-center gap-1">
              <MapPin size={10} className="shrink-0 text-slate-500 print:text-black" />
              {locationName}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 print:text-black shrink-0">Kategori:</span>
            <span className="text-[10px] font-bold uppercase text-slate-900 bg-slate-200/70 px-1.5 py-0.5 rounded">
              {item.category} • {item.tipe_item}
            </span>
          </div>

          {/* Consumable Info */}
          {isConsumable ? (
            <>
              <div className="border-t border-slate-200 pt-1 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 print:text-black">Refill Terakhir:</span>
                <span className="text-[11px] font-mono font-medium text-slate-700">{lastRefillFormatted}</span>
              </div>
              <div className="flex items-center justify-between bg-amber-50 print:bg-transparent px-2 py-1 rounded border border-amber-200 print:border-black">
                <span className="text-[10px] uppercase font-black text-amber-900 print:text-black">Batas Kadaluarsa:</span>
                <span className="text-xs font-mono font-black text-red-700 print:text-black">{expDateFormatted}</span>
              </div>
            </>
          ) : (
            /* Kondisi Info */
            <>
              <div className="border-t border-slate-200 pt-1 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 print:text-black">Interval Cek:</span>
                <span className="text-[11px] font-bold text-slate-800">Rutin Tiap {intervalDays} Hari</span>
              </div>
              <div className="flex items-center justify-between bg-blue-50 print:bg-transparent px-2 py-1 rounded border border-blue-200 print:border-black">
                <span className="text-[10px] uppercase font-bold text-blue-900 print:text-black">Cek Terakhir:</span>
                <span className="text-[11px] font-mono font-bold text-slate-900 print:text-black">{lastInspectionFormatted}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer Instruction */}
        <div className="text-center pt-0.5 border-t border-slate-200 text-[8.5px] text-slate-500 print:text-black leading-tight">
          Scan QR via HP untuk membuka Formulir Inspeksi Petugas & Verifikasi PIC HSE.
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
        
        {/* Header Modal (Screen only) */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <QrCode size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Format Label Stiker QR K3 APAR</h3>
              <p className="text-[10px] text-slate-500">Standar label fisik PT Widatra Bhakti • Siap Cetak</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Printer size={13} />
              Cetak {itemsToPrint.length} Stiker
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Mode Selector & Bulk Zone Filter (Screen only) */}
        {allFacilities && allFacilities.length > 0 && (
          <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 print:hidden text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Mode Cetak:</span>
              <button
                type="button"
                onClick={() => setPrintMode("single")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  printMode === "single" ? "bg-white text-blue-700 shadow-xs border border-slate-200" : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                1 Unit ({facility?.code || "Pilihan"})
              </button>
              <button
                type="button"
                onClick={() => setPrintMode("bulk")}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  printMode === "bulk" ? "bg-white text-blue-700 shadow-xs border border-slate-200" : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Layers size={13} />
                Cetak Massal Zona ({allFacilities.length} Unit)
              </button>
            </div>

            {printMode === "bulk" && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Pilih Zona:</span>
                {["ALL", "UMUM", "FACTORY 1", "FACTORY 2 & WORKSHOP", "WARE HOUSE"].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setBulkZone(z)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      bulkZone === z ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    {z === "ALL" ? "Semua" : z}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sticker Container */}
        <div className="p-4 sm:p-6 flex flex-wrap justify-center gap-4 bg-slate-100/60 print:bg-white print:p-0 overflow-y-auto">
          {itemsToPrint.map((item) => renderSingleSticker(item))}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-2.5 border-t border-slate-100 flex items-center justify-between bg-slate-50 print:hidden text-xs">
          <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
            <AlertCircle size={12} className="text-blue-500 shrink-0" />
            Format stiker otomatis menyesuaikan halaman cetak (A4 / kertas stiker vinil waterproof).
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
