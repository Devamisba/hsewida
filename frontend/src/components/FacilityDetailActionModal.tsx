import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  X, 
  ExternalLink, 
  ClipboardCheck, 
  QrCode, 
  RefreshCw, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  ChevronRight, 
  Camera,
  Printer
} from "lucide-react";
import { SafetyFacility, api } from "@/services/api";
import { QRCodeSVG } from "./QRCodeSVG";

interface FacilityDetailActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: SafetyFacility | null;
  onInspect: (f: SafetyFacility) => void;
  onShowSticker: (f: SafetyFacility) => void;
  onRefill: (f: SafetyFacility) => void;
}

export function FacilityDetailActionModal({
  isOpen,
  onClose,
  facility,
  onInspect,
  onShowSticker,
  onRefill
}: FacilityDetailActionModalProps) {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !facility) {
      setInspections([]);
      setActivePhoto(null);
      return;
    }

    // Set initial preloaded inspections
    if (facility.inspections && Array.isArray(facility.inspections)) {
      setInspections(facility.inspections);
    }

    // Fetch full live inspection history from API
    setLoadingHistory(true);
    api.getFacilityInspections(facility.id)
      .then((res) => {
        if (res.success && res.data?.inspections) {
          setInspections(res.data.inspections);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch full inspection history:", err.message);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [isOpen, facility]);

  if (!isOpen || !facility) return null;

  const isConsumable = facility.tipe_item === "CONSUMABLE";
  const cycle = facility.consumable_cycle;
  const expiredDate = cycle?.expired_at;
  const daysUntilExp = facility.days_until_expired;
  const isApar = facility.category === "apar";

  const getMediaText = () => {
    if (facility.specifications?.media_pemadam) {
      const kg = facility.specifications?.kapasitas_kg ? ` (${facility.specifications.kapasitas_kg} Kg)` : "";
      return `${facility.specifications.media_pemadam}${kg}`;
    }
    return isConsumable ? "Media Pemadam APAR" : "Fasilitas Mekanis";
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }) + " WIB";
    } catch {
      return dateStr;
    }
  };

  const qrPayload = typeof window !== "undefined"
    ? `${window.location.origin}/scan/apar/${facility.code}`
    : (facility.qr_code_id || facility.code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded">
                {facility.code}
              </span>
              {facility.area_zone && (
                <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-300 px-2 py-0.5 rounded">
                  Zona: {facility.area_zone}
                </span>
              )}
              <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-300 px-2 py-0.5 rounded uppercase">
                {facility.category}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {facility.nama_item || facility.name || facility.code}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin size={12} className="text-slate-400" />
              <span>{facility.location?.name || "Area Pabrik PT Widatra Bhakti"}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 p-1.5 rounded-lg transition"
            title="Tutup Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-slate-800">
          
          {/* SECTION 1: RINGKASAN SPESIFIKASI UNIT */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Media / Tipe</span>
              <span className="font-semibold text-slate-900">{getMediaText()}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Masa Berlaku</span>
              <span className="font-semibold text-slate-900">
                {expiredDate ? formatDate(expiredDate) : "Kondisi Fisik"}
              </span>
              {daysUntilExp !== null && daysUntilExp !== undefined && (
                <span className="text-[10px] text-slate-500 block">
                  {daysUntilExp > 0 ? `${daysUntilExp} hari lagi` : "Kadaluarsa"}
                </span>
              )}
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Cek Terakhir</span>
              <span className="font-semibold text-slate-900">
                {formatDate(facility.last_inspected_at)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Status K3</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                {facility.calculated_status || facility.status || "AMAN"}
              </span>
            </div>
          </div>

          {/* SECTION: QR CODE & CETAK STIKER LAPANGAN */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-purple-50/60 border border-purple-200 rounded-xl">
            <div className="bg-white p-2 rounded-xl border border-purple-200 shadow-2xs shrink-0 flex flex-col items-center">
              <QRCodeSVG value={qrPayload} size={90} />
              <span className="text-[10px] font-mono font-bold text-slate-800 mt-1">
                {facility.code}
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-900">QR Code Identifikasi & Scan Lapangan</span>
                <span className="text-[10px] font-mono font-bold text-purple-700 bg-white border border-purple-200 px-1.5 py-0.5 rounded">
                  {facility.qr_code_id || `QR-APAR-${facility.code}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Stiker barcode fisik resmi PT Widatra Bhakti untuk dipindai kamera HP petugas K3 & verifikasi PIC di lapangan.
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onShowSticker(facility);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                  title="Cetak Stiker Label QR Fisik"
                >
                  <Printer size={14} />
                  <span>Cetak Stiker QR</span>
                </button>

                {isApar && (
                  <Link
                    to={`/scan/apar/${facility.code}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-purple-300 hover:bg-purple-100/60 text-purple-900 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    <span>Buka Pengecekan</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: BUNDEL AKSI FASILITAS */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Aksi Fasilitas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* 1. Form K3 (Dual-Tier Web / Scan Link) */}
              {isApar && (
                <Link
                  to={`/scan/apar/${facility.code}`}
                  target="_blank"
                  className="flex items-center justify-between p-3 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 hover:border-rose-300 transition text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <ExternalLink size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-rose-900 flex items-center gap-1">
                        Form K3 Lapangan
                      </div>
                      <p className="text-[11px] text-rose-700 truncate">
                        Pengecekan Petugas & Verifikasi PIC
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-rose-400 group-hover:translate-x-0.5 transition" />
                </Link>
              )}

              {/* 2. Checklist Inspeksi K3 */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onInspect(facility);
                }}
                className="flex items-center justify-between p-3 rounded-lg border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 hover:border-sky-300 transition text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <ClipboardCheck size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-sky-900">
                      Checklist Inspeksi
                    </div>
                    <p className="text-[11px] text-sky-700 truncate">
                      Input form checklist berkala
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-sky-400 group-hover:translate-x-0.5 transition" />
              </button>

              {/* 3. Cetak Label QR Stiker */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onShowSticker(facility);
                }}
                className="flex items-center justify-between p-3 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 hover:border-purple-300 transition text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <QrCode size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-purple-900">
                      Cetak Label Stiker QR
                    </div>
                    <p className="text-[11px] text-purple-700 truncate">
                      Cetak QR barcode fisik tabung
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-purple-400 group-hover:translate-x-0.5 transition" />
              </button>

              {/* 4. Refill Media Tabung */}
              {isConsumable && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRefill(facility);
                  }}
                  className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-300 transition text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <RefreshCw size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-emerald-900">
                        Catat Refill Media
                      </div>
                      <p className="text-[11px] text-emerald-700 truncate">
                        Pengisian ulang & perpanjangan masa
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-emerald-400 group-hover:translate-x-0.5 transition" />
                </button>
              )}
            </div>
          </div>

          {/* SECTION 3: RIWAYAT MONITORING & VERIFIKASI */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Riwayat Monitoring & Verifikasi Lapangan
                </h3>
                <p className="text-[11px] text-slate-500">
                  Catatan inspeksi fisik, nama petugas pemeriksa, dan verifikasi PIC K3
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {inspections.length} Riwayat
              </span>
            </div>

            {loadingHistory && inspections.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Memuat riwayat monitoring...
              </div>
            ) : inspections.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                Belum ada riwayat monitoring fisik tercatat untuk tabung ini.
                <p className="text-[11px] text-slate-400 mt-1">
                  Gunakan tombol <strong>Form K3</strong> atau <strong>Checklist Inspeksi</strong> untuk mencatat audit pertama.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {inspections.map((insp, idx) => {
                  const inspector = insp.inspector_name || insp.inspector?.name || "Petugas Lapangan";
                  const pic = insp.pic_name || null;
                  const isVerified = insp.inspection_stage === "PIC_VERIFIED" || insp.verification_status === "VERIFIED";
                  const results = Array.isArray(insp.checklist_results) ? insp.checklist_results : [];
                  const photos = Array.isArray(insp.foto_bukti) ? insp.foto_bukti : [];

                  return (
                    <div 
                      key={insp.id || idx}
                      className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs space-y-2 hover:border-slate-300 transition"
                    >
                      {/* Baris 1: Tanggal & Status Badge */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{formatDateTime(insp.created_at || insp.inspection_date)}</span>
                        </div>

                        {/* Status Verifikasi Badge */}
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} />
                            Terverifikasi PIC
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock size={12} />
                            Menunggu Verifikasi PIC
                          </span>
                        )}
                      </div>

                      {/* Baris 2: Pemeriksa Lapangan & Verifikator PIC */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        
                        {/* Petugas Pemeriksa */}
                        <div className="p-2 bg-slate-50/80 rounded border border-slate-100">
                          <span className="text-slate-400 block text-[10px]">Petugas Pemeriksa:</span>
                          <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                            <User size={12} className="text-slate-500" />
                            {inspector}
                          </span>
                        </div>

                        {/* Verifikator PIC */}
                        <div className={`p-2 rounded border ${isVerified ? "bg-emerald-50/40 border-emerald-100" : "bg-amber-50/40 border-amber-100"}`}>
                          <span className="text-slate-400 block text-[10px]">Diverifikasi Oleh:</span>
                          <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                            <ShieldCheck size={12} className={isVerified ? "text-emerald-600" : "text-amber-600"} />
                            {pic || "Belum Diverifikasi"}
                          </span>
                          {insp.verified_at && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {formatDateTime(insp.verified_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Baris 3: 5 Parameter Fisik APAR (Jika Ada) */}
                      {results.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                            Parameter Fisik:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {results.map((r: any, rIdx: number) => {
                              const isPass = r.passed !== false && r.jawaban !== "Rusak" && r.jawaban !== "Karat / Rusak";
                              return (
                                <span
                                  key={rIdx}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    isPass 
                                      ? "bg-slate-50 text-slate-700 border-slate-200" 
                                      : "bg-red-50 text-red-700 border-red-200"
                                  }`}
                                  title={`${r.label || r.code || r.item}: ${r.jawaban || (isPass ? "Baik" : "Rusak")}`}
                                >
                                  {r.code || r.label || r.item}: {r.jawaban || (isPass ? "OK" : "NOK")}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Baris 4: Catatan Temuan & Catatan PIC */}
                      {insp.notes && (
                        <div className="text-[11px] text-slate-600 pt-1">
                          <span className="font-semibold text-slate-700">Catatan Petugas: </span>
                          <span className="italic">"{insp.notes}"</span>
                        </div>
                      )}

                      {insp.verification_notes && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50/50 p-1.5 rounded border border-emerald-100">
                          <span className="font-semibold">Catatan Verifikasi PIC: </span>
                          <span>"{insp.verification_notes}"</span>
                        </div>
                      )}

                      {/* Baris 5: Foto Dokumentasi */}
                      {photos.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                            Foto Dokumentasi:
                          </span>
                          <div className="flex items-center gap-2">
                            {photos.map((photo: string, pIdx: number) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setActivePhoto(photo)}
                                className="relative w-12 h-12 rounded border border-slate-200 overflow-hidden hover:opacity-90 transition group cursor-pointer shrink-0"
                              >
                                <img src={photo} alt={`Bukti ${pIdx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent flex items-center justify-center">
                                  <Camera size={12} className="text-white drop-shadow" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>PT Widatra Bhakti — Manajemen Fasilitas K3</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* FULL PREVIEW PHOTO MODAL */}
      {activePhoto && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-lg max-h-[85vh] bg-black rounded-lg overflow-hidden border border-slate-700">
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1 rounded-full"
            >
              <X size={16} />
            </button>
            <img src={activePhoto} alt="Bukti Pemeriksaan" className="max-w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
