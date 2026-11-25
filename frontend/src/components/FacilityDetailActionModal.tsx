import { useState, useEffect, useMemo } from "react";
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
  Trash2,
  ChevronDown,
  ChevronLeft,
  History,
  Inbox
} from "lucide-react";
import { SafetyFacility, api } from "@/services/api";
import { cn, parseLocalDate } from "@/lib/utils";
import { QRCodeSVG } from "./QRCodeSVG";
import { getFacilityCoordinates } from "@/utils/facilityCoordinates";

const MONTHS_LIST = [
  { index: 0, short: "Jan", name: "Januari" },
  { index: 1, short: "Feb", name: "Februari" },
  { index: 2, short: "Mar", name: "Maret" },
  { index: 3, short: "Apr", name: "April" },
  { index: 4, short: "Mei", name: "Mei" },
  { index: 5, short: "Jun", name: "Juni" },
  { index: 6, short: "Jul", name: "Juli" },
  { index: 7, short: "Agu", name: "Agustus" },
  { index: 8, short: "Sep", name: "September" },
  { index: 9, short: "Okt", name: "Oktober" },
  { index: 10, short: "Nov", name: "November" },
  { index: 11, short: "Des", name: "Desember" },
];

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

  // Filter Kalender Tahunan & Pilihan Bulan
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(() => currentYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Daftar tahun yang tersedia (fleksibel & luas: minimal 2020 s/d currentYear + 2, plus seluruh tahun riwayat di DB)
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    const minDefault = Math.min(2020, currentYear - 6);
    const maxDefault = currentYear + 2;
    for (let y = minDefault; y <= maxDefault; y++) {
      yearSet.add(y);
    }

    if (Array.isArray(inspections)) {
      inspections.forEach((insp: any) => {
        const d = parseLocalDate(insp.created_at || insp.inspection_date);
        if (d && !isNaN(d.getFullYear())) {
          yearSet.add(d.getFullYear());
        }
      });
    }

    yearSet.add(selectedYear);

    return Array.from(yearSet).sort((a, b) => b - a);
  }, [inspections, currentYear, selectedYear]);

  // Pemetaan inspeksi per bulan (0 - 11) untuk tahun yang dipilih
  const yearInspectionsByMonth = useMemo(() => {
    const map: Record<number, any[]> = {};
    for (let i = 0; i < 12; i++) {
      map[i] = [];
    }

    if (Array.isArray(inspections)) {
      inspections.forEach((insp: any) => {
        const d = parseLocalDate(insp.created_at || insp.inspection_date);
        if (d && !isNaN(d.getFullYear()) && d.getFullYear() === selectedYear) {
          const m = d.getMonth();
          map[m].push(insp);
        }
      });
    }

    return map;
  }, [inspections, selectedYear]);

  // Jumlah bulan yang sudah diinspeksi
  const inspectedMonthsCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 12; i++) {
      if (yearInspectionsByMonth[i]?.length > 0) {
        count++;
      }
    }
    return count;
  }, [yearInspectionsByMonth]);

  // Helper status warna & label untuk setiap kotak bulan (sesuai standar kartu kendali)
  const getMonthStatus = (monthInspections: any[]) => {
    if (!monthInspections || monthInspections.length === 0) {
      return {
        type: "EMPTY" as const,
        label: "Belum Diperiksa",
        shortLabel: "-",
        cellBg: "bg-slate-50/70 border-slate-200 text-slate-400 hover:bg-slate-100/70",
        dotColor: "bg-slate-300",
        textColor: "text-slate-400",
      };
    }

    const latestInsp = monthInspections[0];
    const results = Array.isArray(latestInsp.checklist_results) ? latestInsp.checklist_results : [];
    const hasDamage = latestInsp.overall_condition === "DAMAGED" ||
      results.some((r: any) =>
        r.passed === false ||
        [
          "Rusak",
          "Karat / Rusak",
          "Putus / Hilang",
          "Expired",
          "Berantakan",
          "Kurang",
          "Terhalang",
          "Kotor",
          "Mati",
          "Pudar",
          "Buram",
          "Goyang",
          "Retak",
          "Macet",
          "Terkunci",
        ].includes(r.jawaban)
      );

    const isVerified = latestInsp.inspection_stage === "PIC_VERIFIED" || latestInsp.verification_status === "VERIFIED";

    if (hasDamage) {
      return {
        type: "FAIL" as const,
        label: "Rusak / Perlu Atensi",
        shortLabel: "Rusak",
        cellBg: "bg-rose-50/60 border-rose-200 text-rose-800 hover:bg-rose-100/60",
        dotColor: "bg-rose-500",
        textColor: "text-rose-700",
      };
    }

    if (!isVerified) {
      return {
        type: "PENDING" as const,
        label: "Menunggu Verifikasi PIC",
        shortLabel: "Verif PIC",
        cellBg: "bg-amber-50/60 border-amber-200 text-amber-800 hover:bg-amber-100/60",
        dotColor: "bg-amber-500",
        textColor: "text-amber-700",
      };
    }

    return {
      type: "PASS" as const,
      label: "Aman / Baik",
      shortLabel: "Aman",
      cellBg: "bg-emerald-50/60 border-emerald-200 text-emerald-800 hover:bg-emerald-100/60",
      dotColor: "bg-emerald-500",
      textColor: "text-emerald-700",
    };
  };

  useEffect(() => {
    if (!isOpen || !facility) {
      setInspections([]);
      setActivePhoto(null);
      setSelectedMonthIndex(null);
      setIsFilterOpen(false);
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
      const d = parseLocalDate(dateStr);
      if (!d) return dateStr;
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
      const d = parseLocalDate(dateStr);
      if (!d) return dateStr;
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
                  {facility.qr_code_id || (isApar ? `QR-APAR-${facility.code}` : `QR-${facility.code}`)}
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

                <Link
                    to={`/scan/apar/${facility.code}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-purple-300 hover:bg-purple-100/60 text-purple-900 rounded-lg text-xs font-semibold transition cursor-pointer"
                    title="Buka formulir pengecekan lapangan"
                  >
                    <ExternalLink size={13} />
                    <span>Buka Pengecekan</span>
                  </Link>
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
              {/* 1. Form K3 Lapangan (Scan / Kamera Realtime & Verifikasi PIC - Untuk Seluruh Fasilitas) */}
              <Link
                to={`/scan/apar/${facility.code}`}
                onClick={onClose}
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

              {/* 2. Checklist Inspeksi K3 (Modal Checklist Desktop & CAPA - Untuk Seluruh Fasilitas Termasuk APAR) */}
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
                        {facility.category === 'p3k' ? 'Catat Refill / Restock P3K' : 'Catat Refill Media'}
                      </div>
                      <p className="text-[11px] text-emerald-700 truncate">
                        {facility.category === 'p3k' ? 'Isi ulang obat & perpanjangan masa kadaluarsa' : 'Pengisian ulang & perpanjangan masa'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-emerald-400 group-hover:translate-x-0.5 transition" />
                </button>
              )}
            </div>
          </div>

          {/* SECTION 3: RIWAYAT MONITORING & VERIFIKASI (KALENDER 12 BULAN & FILTER PERIODE) */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            {/* Header & Total Count */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <History size={14} className="text-slate-500" />
                  <span>Riwayat Monitoring & Verifikasi Lapangan</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Kalender kartu kendali 12 bulan dan rincian verifikasi fisik K3
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {inspections.length} Riwayat
              </span>
            </div>

            {/* Filter Periode Interaktif & Ringkasan Kepatuhan */}
            <div className="relative">
              <div className="flex items-center justify-between flex-wrap gap-2 py-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Stepper Mundur 1 Tahun Langsung */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedYear((y) => y - 1);
                      setSelectedMonthIndex(null);
                    }}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 shadow-2xs transition cursor-pointer"
                    title="Mundur 1 Tahun"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFilterOpen((prev) => !prev)}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer shadow-xs",
                      selectedYear !== currentYear
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <Calendar size={13} className={selectedYear !== currentYear ? "text-amber-400" : "text-slate-500"} />
                    <span>
                      Tahun: <strong>{selectedYear}</strong>
                      {selectedMonthIndex !== null ? ` • ${MONTHS_LIST[selectedMonthIndex].name}` : ""}
                    </span>
                    <ChevronDown size={13} className={cn("transition-transform duration-200", isFilterOpen ? "rotate-180" : "")} />
                  </button>

                  {/* Stepper Maju 1 Tahun Langsung */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedYear((y) => y + 1);
                      setSelectedMonthIndex(null);
                    }}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 shadow-2xs transition cursor-pointer"
                    title="Maju 1 Tahun"
                  >
                    <ChevronRight size={14} />
                  </button>

                  {selectedMonthIndex !== null && (
                    <button
                      type="button"
                      onClick={() => setSelectedMonthIndex(null)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer ml-1"
                    >
                      Lihat 1 Tahun Full
                    </button>
                  )}
                </div>

                <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                  <strong className="text-slate-800 font-bold">{inspectedMonthsCount}</strong> / 12 Bulan Terinspeksi
                </span>
              </div>

              {/* POPUP DROPDOWN FILTER (PILIH TAHUN AUDIT) */}
              {isFilterOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-20"
                    onClick={() => setIsFilterOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1.5 z-30 w-full sm:w-[380px] bg-white rounded-xl shadow-xl border border-slate-200 p-4 space-y-3.5 animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                        <Calendar size={13} className="text-slate-600" />
                        <span>Pilih Tahun Kalender</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Pilih Tahun Fleksibel (Stepper + Dropdown Select + Quick Chips) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          Tahun Audit / Inspeksi:
                        </label>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Aktif: <strong className="text-slate-900 text-xs font-bold">{selectedYear}</strong>
                        </span>
                      </div>

                      {/* Stepper Panah & Dropdown Select Bebas */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedYear((y) => y - 1);
                            setSelectedMonthIndex(null);
                          }}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center justify-center shrink-0 border border-slate-200"
                          title="Tahun Sebelumnya"
                        >
                          <ChevronLeft size={15} />
                        </button>

                        <select
                          value={selectedYear}
                          onChange={(e) => {
                            setSelectedYear(Number(e.target.value));
                            setSelectedMonthIndex(null);
                          }}
                          className="flex-1 py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                        >
                          {availableYears.map((yr) => (
                            <option key={yr} value={yr}>
                              Tahun {yr} {yr === currentYear ? "(Tahun Berjalan)" : ""}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedYear((y) => y + 1);
                            setSelectedMonthIndex(null);
                          }}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center justify-center shrink-0 border border-slate-200"
                          title="Tahun Berikutnya"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>

                      {/* Quick Chips Tahun (Scrollable Horizontal) */}
                      <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-thin">
                        {availableYears.map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => {
                              setSelectedYear(yr);
                              setSelectedMonthIndex(null);
                            }}
                            className={cn(
                              "px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer shrink-0 border",
                              selectedYear === yr
                                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                            )}
                          >
                            {yr}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Footer Tombol Tutup & Reset */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedYear(currentYear);
                          setSelectedMonthIndex(null);
                          setIsFilterOpen(false);
                        }}
                        className="text-slate-500 hover:text-rose-600 underline cursor-pointer text-[11px]"
                      >
                        Reset ke Tahun Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="px-3.5 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition cursor-pointer text-[11px]"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </>
              )}
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
              <div className="space-y-3.5">
                {/* Matriks Kalender 12 Bulan (Januari s/d Desember) */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {MONTHS_LIST.map((m) => {
                    const monthInspections = yearInspectionsByMonth[m.index] || [];
                    const status = getMonthStatus(monthInspections);
                    const isSelected = selectedMonthIndex === m.index;

                    let inspDateLabel = "-";
                    if (monthInspections.length > 0) {
                      const d = parseLocalDate(monthInspections[0].created_at || monthInspections[0].inspection_date);
                      if (d) {
                        inspDateLabel = `${d.getDate()} ${m.short}`;
                      }
                    }

                    return (
                      <button
                        key={m.index}
                        type="button"
                        onClick={() => setSelectedMonthIndex(m.index)}
                        className={cn(
                          "relative p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[70px]",
                          status.cellBg,
                          isSelected
                            ? "ring-2 ring-slate-900 shadow-sm bg-white"
                            : "hover:shadow-xs"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            {m.short}
                          </span>
                          <span className={cn("w-2 h-2 rounded-full shrink-0", status.dotColor)} />
                        </div>

                        <div className="mt-1">
                          <div className="text-[10px] font-semibold truncate leading-tight">
                            {inspDateLabel !== "-" ? inspDateLabel : <span className="text-slate-400 font-normal">Belum</span>}
                          </div>
                          <div className={cn("text-[9px] font-bold mt-0.5 truncate", status.textColor)}>
                            {status.shortLabel}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-slate-900 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legenda Status Kalender */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 text-[10px] text-slate-600">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>Aman / Baik</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span>Kerusakan</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>Menunggu PIC</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                      <span>Belum Diperiksa</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 italic">
                    *Klik kotak bulan untuk melihat detail
                  </span>
                </div>

                {/* Panel Detail Pemeriksaan Bulan Terpilih */}
                {selectedMonthIndex !== null ? (() => {
                  const selectedMonth = MONTHS_LIST[selectedMonthIndex];
                  const inspectionsInMonth = yearInspectionsByMonth[selectedMonthIndex] || [];

                  if (inspectionsInMonth.length === 0) {
                    return (
                      <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-1.5">
                        <Inbox size={24} className="mx-auto text-slate-300 mb-0.5" />
                        <div className="text-xs font-bold text-slate-700">
                          Belum Ada Pemeriksaan di Bulan {selectedMonth.name} {selectedYear}
                        </div>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          Fasilitas ini belum memiliki catatan checklist inspeksi pada bulan ini.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-0.5">
                        <span>Detail Pemeriksaan: {selectedMonth.name} {selectedYear}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {inspectionsInMonth.length} Inspeksi
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedMonthIndex(null)}
                            className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                          >
                            Tutup Detail
                          </button>
                        </div>
                      </div>

                      {inspectionsInMonth.map((insp: any, idx: number) => {
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
                              <div className="p-2 bg-slate-50/80 rounded border border-slate-100">
                                <span className="text-slate-400 block text-[10px]">Petugas Pemeriksa:</span>
                                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                                  <User size={12} className="text-slate-500" />
                                  {inspector}
                                </span>
                              </div>

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

                            {/* Baris 3: Parameter Fisik APAR */}
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

                            {/* Baris 4: Catatan Petugas & PIC */}
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
                  );
                })() : (
                  /* Ketika mode 1 tahun full (selectedMonthIndex === null) */
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center space-y-1">
                    <p className="text-xs text-slate-600 font-medium">
                      Menampilkan kartu kendali 1 tahun penuh (Januari – Desember {selectedYear}).
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Klik salah satu kotak bulan di atas untuk membuka detail rincian pemeriksaan fisik & foto bukti.
                    </p>
                  </div>
                )}
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
