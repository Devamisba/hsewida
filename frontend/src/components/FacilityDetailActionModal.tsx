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
  Printer,
  Navigation,
  Crosshair,
  Save,
  AlertCircle,
  Edit3,
  Trash2
} from "lucide-react";
import { SafetyFacility, api } from "@/services/api";
import { QRCodeSVG } from "./QRCodeSVG";
import { getFacilityCoordinates } from "@/utils/facilityCoordinates";

interface FacilityDetailActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: SafetyFacility | null;
  onInspect: (f: SafetyFacility) => void;
  onShowSticker: (f: SafetyFacility) => void;
  onRefill: (f: SafetyFacility) => void;
  onFacilityUpdated?: (updated: SafetyFacility) => void;
  onEdit?: (f: SafetyFacility) => void;
  onDelete?: (f: SafetyFacility) => void;
}

export function FacilityDetailActionModal({
  isOpen,
  onClose,
  facility,
  onInspect,
  onShowSticker,
  onRefill,
  onFacilityUpdated,
  onEdit,
  onDelete
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

  // Coordinate editing state
  const [editLat, setEditLat] = useState<string>("");
  const [editLng, setEditLng] = useState<string>("");
  const [editZone, setEditZone] = useState<string>("UMUM");
  const [isSavingCoords, setIsSavingCoords] = useState<boolean>(false);
  const [coordSuccessMsg, setCoordSuccessMsg] = useState<string>("");
  const [coordErrorMsg, setCoordErrorMsg] = useState<string>("");
  const [isCapturingGps, setIsCapturingGps] = useState<boolean>(false);

  useEffect(() => {
    if (facility && isOpen) {
      const coords = getFacilityCoordinates(facility);
      setEditLat(String(facility.latitude || facility.specifications?.latitude || coords.lat));
      setEditLng(String(facility.longitude || facility.specifications?.longitude || coords.lng));
      setEditZone(facility.area_zone || "FACTORY 1");
      setCoordSuccessMsg("");
      setCoordErrorMsg("");
    }
  }, [facility, isOpen]);

  const handleCaptureCurrentGps = () => {
    if (!navigator.geolocation) {
      setCoordErrorMsg("Browser tidak mendukung geolokasi GPS.");
      return;
    }
    setIsCapturingGps(true);
    setCoordErrorMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsCapturingGps(false);
        setEditLat(pos.coords.latitude.toFixed(6));
        setEditLng(pos.coords.longitude.toFixed(6));
        setCoordSuccessMsg(`GPS terdeteksi (Akurasi: ±${Math.round(pos.coords.accuracy)}m)`);
        setTimeout(() => setCoordSuccessMsg(""), 4000);
      },
      (err) => {
        setIsCapturingGps(false);
        setCoordErrorMsg("Gagal membaca GPS: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSaveCoordinates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facility) return;
    const latNum = parseFloat(editLat);
    const lngNum = parseFloat(editLng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      setCoordErrorMsg("Latitude dan Longitude harus berupa angka valid.");
      return;
    }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      setCoordErrorMsg("Koordinat GPS di luar rentang geografis.");
      return;
    }

    setIsSavingCoords(true);
    setCoordSuccessMsg("");
    setCoordErrorMsg("");
    try {
      const res = await api.updateFacilityCoordinates(facility.id, {
        latitude: latNum,
        longitude: lngNum,
        area_zone: editZone,
      });
      if (res?.success) {
        setCoordSuccessMsg("Titik koordinat GPS berhasil disimpan.");
        if (facility) {
          facility.latitude = latNum;
          facility.longitude = lngNum;
          facility.area_zone = editZone;
          if (facility.specifications) {
            facility.specifications.latitude = latNum;
            facility.specifications.longitude = lngNum;
            facility.specifications.area_zone = editZone;
          }
        }
        if (onFacilityUpdated && res.data) {
          onFacilityUpdated(res.data);
        }
        setTimeout(() => setCoordSuccessMsg(""), 4000);
      } else {
        setCoordErrorMsg(res?.message || "Gagal menyimpan koordinat.");
      }
    } catch (err: any) {
      setCoordErrorMsg(err.message || "Terjadi kesalahan saat menyimpan koordinat.");
    } finally {
      setIsSavingCoords(false);
    }
  };

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

          <div className="flex items-center gap-1.5 shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(facility);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Edit data fasilitas ini"
              >
                <Edit3 size={13} className="text-primary" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(facility);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Hapus / Nonaktifkan unit"
              >
                <Trash2 size={13} className="text-rose-600" />
                <span className="hidden sm:inline">Hapus</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 p-1.5 rounded-lg transition"
              title="Tutup Modal"
            >
              <X size={18} />
            </button>
          </div>
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

          {/* MASTER TITIK KOORDINAT SPASIAL ALAT */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Navigation size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Master Titik Koordinat GPS Alat
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                      Geofence Child &lt;25m
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Posisi koordinat presisi unit fisik untuk penandaan peta spasial dan validasi scan petugas di lapangan.
                  </p>
                </div>
              </div>

              {/* Action: Lihat di Peta GIS */}
              <Link
                to={`/gis-map?focus=${facility.id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition shrink-0 shadow-2xs"
                title="Buka Peta GIS dan arahkan kamera ke unit ini"
              >
                <MapPin size={13} className="text-emerald-600" />
                <span>Lihat di Peta GIS</span>
              </Link>
            </div>

            {/* Form Edit Koordinat */}
            <form onSubmit={handleSaveCoordinates} className="space-y-2.5 pt-1 border-t border-slate-200/70">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Latitude
                  </label>
                  <input
                    type="text"
                    required
                    value={editLat}
                    onChange={(e) => setEditLat(e.target.value)}
                    placeholder="-7.644263"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Longitude
                  </label>
                  <input
                    type="text"
                    required
                    value={editLng}
                    onChange={(e) => setEditLng(e.target.value)}
                    placeholder="112.694194"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Zona Kawasan
                  </label>
                  <select
                    value={editZone}
                    onChange={(e) => setEditZone(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    <option value="UMUM">UMUM</option>
                    <option value="FACTORY 1">FACTORY 1</option>
                    <option value="FACTORY 2 & WORKSHOP">FACTORY 2 & WORKSHOP</option>
                    <option value="WARE HOUSE">WARE HOUSE</option>
                    <option value="LAB QC">LAB QC</option>
                  </select>
                </div>
              </div>

              {coordSuccessMsg && (
                <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>{coordSuccessMsg}</span>
                </div>
              )}

              {coordErrorMsg && (
                <div className="text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-1 rounded-md flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-rose-600 shrink-0" />
                  <span>{coordErrorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCaptureCurrentGps}
                  disabled={isCapturingGps}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                  title="Ambil titik koordinat dari posisi GPS perangkat Anda saat ini di depan alat"
                >
                  <Crosshair size={13} className="text-blue-600" />
                  <span>{isCapturingGps ? "Membaca GPS..." : "Ambil GPS Saya Saat Ini"}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingCoords}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                >
                  <Save size={13} />
                  <span>{isSavingCoords ? "Menyimpan..." : "Simpan Titik Koordinat"}</span>
                </button>
              </div>
            </form>
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

              {/* 2. Checklist Inspeksi K3 (Khusus untuk fasilitas selain APAR, karena APAR sudah menggunakan Form K3 Lapangan) */}
              {!isApar && (
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
              )}

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
                  Gunakan tombol aksi di atas untuk mencatat audit/pemeriksaan pertama.
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
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(facility);
                }}
                className="text-rose-600 hover:text-rose-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Hapus Unit</span>
              </button>
            )}
            <span className="hidden md:inline">PT Widatra Bhakti — Manajemen Fasilitas K3</span>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(facility);
                }}
                className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Edit3 size={13} />
                <span>Edit Data Pokok</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
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
