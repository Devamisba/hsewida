import { useRef } from "react";
import { X, Printer, ShieldCheck, MapPin, QrCode, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "./QRCodeSVG";

interface FacilityQrStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: any;
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

export function FacilityQrStickerModal({ isOpen, onClose, facility }: FacilityQrStickerModalProps) {
  const stickerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !facility) return null;

  const handlePrint = () => {
    window.print();
  };

  const isConsumable = facility.tipe_item === "CONSUMABLE";
  
  const rawExpDate = facility.consumable_cycle?.expired_at || 
                     facility.consumableCycle?.expired_at || 
                     facility.expired_at;
  const expDateFormatted = formatStickerDate(rawExpDate);

  const rawLastRefill = facility.consumable_cycle?.last_refilled_at || 
                        facility.consumableCycle?.last_refilled_at;
  const lastRefillFormatted = formatStickerDate(rawLastRefill);

  const rawLastInspection = facility.condition_schedule?.terakhir_diperiksa_at || 
                            facility.conditionSchedule?.terakhir_diperiksa_at || 
                            facility.last_inspected_at;
  const lastInspectionFormatted = formatStickerDate(rawLastInspection);

  const intervalDays = facility.condition_schedule?.interval_pemeriksaan_hari || 
                       facility.conditionSchedule?.interval_pemeriksaan_hari || 30;

  const locationName = typeof facility.location === "object" 
    ? facility.location?.name 
    : (facility.location || facility.lokasi || "-");

  const displayName = facility.nama_item || facility.name || facility.code;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
        
        {/* Header Modal (Screen only) */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <QrCode size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Format Label Stiker QR Fisik</h3>
              <p className="text-[10px] text-slate-500">Standar label kesiapan alat K3 PT Widatra Bhakti</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Printer size={13} />
              Cetak Stiker
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sticker Container - Compact and fits comfortably */}
        <div className="p-3 sm:p-4 flex justify-center bg-slate-100/70 print:bg-white print:p-0 overflow-y-auto">
          <div 
            ref={stickerRef}
            className="w-full max-w-[305px] bg-white border-2 border-slate-900 rounded-xl p-3.5 shadow-sm print:shadow-none print:border-2 print:border-black print:rounded-none print:w-[290px] print:max-w-none text-slate-900 font-sans space-y-2.5"
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

            {/* QR Code Center - Crisp & Compact size (105px) */}
            <div className="flex flex-col items-center justify-center py-0.5">
              <div className="p-1.5 border border-slate-200 rounded-lg bg-white shadow-xs">
                <QRCodeSVG value={facility.qr_code_id || facility.code} size={105} />
              </div>
              <span className="font-mono text-xs font-black tracking-widest text-slate-900 mt-1">
                {facility.qr_code_id || `QR-${facility.code}`}
              </span>
            </div>

            {/* Detail Info Box */}
            <div className="border border-slate-300 rounded-lg p-2 text-xs space-y-1.5 bg-slate-50/70 print:bg-white">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 print:text-black shrink-0">Nama Unit:</span>
                <span className="text-[11px] font-bold text-right text-slate-900 leading-tight">{displayName}</span>
              </div>

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
                  {facility.category} • {facility.tipe_item}
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
              Scan QR via HSE Portal untuk mencatat checklist inspeksi berkala di lapangan.
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between bg-slate-50 print:hidden text-xs">
          <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
            <AlertCircle size={12} className="text-blue-500 shrink-0" />
            Rekomendasi: Kertas stiker vinil tahan air (Waterproof).
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
