import { useState, useEffect, useRef } from "react";
import { 
  X, 
  Save, 
  Edit3, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Navigation, 
  Crosshair, 
  Calendar,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SafetyFacility, api } from "@/services/api";

interface EditFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: SafetyFacility | null;
  onSuccess?: (updated: SafetyFacility) => void;
  onDeleteRequest?: (facility: SafetyFacility) => void;
}

export function EditFacilityModal({
  isOpen,
  onClose,
  facility,
  onSuccess,
  onDeleteRequest,
}: EditFacilityModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [hasSaved, setHasSaved] = useState(false);
  const prevFacilityIdRef = useRef<number | string | null>(null);
  const prevIsOpenRef = useRef<boolean>(false);

  // Form Fields
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("apar");
  const [locationName, setLocationName] = useState("");
  const [areaZone, setAreaZone] = useState("UMUM");
  const [tipeItem, setTipeItem] = useState<"CONSUMABLE" | "KONDISI">("CONSUMABLE");

  // GPS Coordinates
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [isCapturingGps, setIsCapturingGps] = useState(false);

  // Consumable specific
  const [expiredAt, setExpiredAt] = useState("");
  const [thresholdWarning, setThresholdWarning] = useState(30);
  const [mediaPemadam, setMediaPemadam] = useState("Dry Chemical Powder");
  const [kapasitasKg, setKapasitasKg] = useState("6");

  // Condition specific
  const [intervalHari, setIntervalHari] = useState(30);

  // Status Aktif
  const [statusAktif, setStatusAktif] = useState(true);

  // Locations list for autocomplete / select
  const [availableLocations, setAvailableLocations] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.getLocations().then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setAvailableLocations(res.data);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && facility) {
      const isNewOpen = !prevIsOpenRef.current && isOpen;
      const isDifferentFacility = prevFacilityIdRef.current !== facility.id;

      if (isNewOpen || isDifferentFacility) {
        setError("");
        setSuccessMsg("");
        setHasSaved(false);
        setCode(facility.code || "");
        setName(facility.nama_item || facility.name || "");
        setCategory(facility.category || "apar");
        setLocationName(facility.location?.name || "");
        setAreaZone(facility.area_zone || "UMUM");
        setTipeItem((facility.tipe_item as any) || "CONSUMABLE");
        setStatusAktif(facility.status_aktif !== false);

        const lat = facility.latitude ?? facility.specifications?.latitude;
        const lng = facility.longitude ?? facility.specifications?.longitude;
        setLatitude(lat !== undefined && lat !== null ? String(lat) : "");
        setLongitude(lng !== undefined && lng !== null ? String(lng) : "");

        // Consumable
        const cycle = facility.consumable_cycle || (facility as any).consumableCycle;
        if (cycle?.expired_at) {
          setExpiredAt(cycle.expired_at.slice(0, 10));
        } else {
          const d = new Date();
          d.setFullYear(d.getFullYear() + 1);
          setExpiredAt(d.toISOString().slice(0, 10));
        }
        setThresholdWarning(cycle?.threshold_warning_hari || 30);

        // Specs
        const specs = facility.specifications || {};
        setMediaPemadam(specs.media_pemadam || specs.type || "Dry Chemical Powder");
        setKapasitasKg(String(specs.kapasitas_kg || specs.capacity?.replace(/[^0-9.]/g, "") || "6"));

        // Condition
        const sched = facility.condition_schedule || (facility as any).conditionSchedule;
        setIntervalHari(sched?.interval_pemeriksaan_hari || 30);
      }

      prevIsOpenRef.current = isOpen;
      prevFacilityIdRef.current = facility.id;
    } else {
      prevIsOpenRef.current = isOpen;
      if (!isOpen) {
        prevFacilityIdRef.current = null;
        setError("");
        setSuccessMsg("");
        setHasSaved(false);
      }
    }
  }, [isOpen, facility]);

  if (!isOpen || !facility) return null;

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung geolokasi GPS.");
      return;
    }
    setIsCapturingGps(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsCapturingGps(false);
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setSuccessMsg(`GPS berhasil ditangkap (Akurasi: ±${Math.round(pos.coords.accuracy)}m)`);
        setTimeout(() => setSuccessMsg(""), 3500);
      },
      (err) => {
        setIsCapturingGps(false);
        setError("Gagal membaca GPS: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const latNum = latitude ? parseFloat(latitude) : undefined;
      const lngNum = longitude ? parseFloat(longitude) : undefined;

      if (latNum !== undefined && (isNaN(latNum) || latNum < -90 || latNum > 90)) {
        setError("Latitude harus berupa angka valid antara -90 dan 90.");
        setLoading(false);
        return;
      }
      if (lngNum !== undefined && (isNaN(lngNum) || lngNum < -180 || lngNum > 180)) {
        setError("Longitude harus berupa angka valid antara -180 dan 180.");
        setLoading(false);
        return;
      }

      // Prepare specifications
      const currentSpecs = facility.specifications || {};
      const updatedSpecs: Record<string, any> = { ...currentSpecs };

      if (category === "apar") {
        updatedSpecs.media_pemadam = mediaPemadam;
        updatedSpecs.kapasitas_kg = parseFloat(kapasitasKg) || 6;
        updatedSpecs.type = mediaPemadam;
        updatedSpecs.capacity = `${kapasitasKg} Kg`;
      } else if (category === "hydrant") {
        updatedSpecs.type = mediaPemadam || "Pillar Hydrant";
      }

      if (latNum !== undefined) updatedSpecs.latitude = latNum;
      if (lngNum !== undefined) updatedSpecs.longitude = lngNum;
      if (areaZone) updatedSpecs.area_zone = areaZone;

      const payload: any = {
        code: code.trim(),
        nama_item: name.trim() || undefined,
        category,
        tipe_item: tipeItem,
        location: locationName.trim(),
        area_zone: areaZone,
        latitude: latNum,
        longitude: lngNum,
        specifications: updatedSpecs,
        status_aktif: statusAktif,
      };

      if (tipeItem === "CONSUMABLE") {
        payload.expired_at = expiredAt || null;
        payload.threshold_warning_hari = Number(thresholdWarning);
      } else {
        payload.interval_pemeriksaan_hari = Number(intervalHari);
      }

      const res = await api.updateFacility(facility.id, payload);

      if (res?.success) {
        setSuccessMsg("Perubahan data fasilitas berhasil disimpan!");
        setHasSaved(true);
        onSuccess?.(res.data);
        // keep successMsg visible
      } else {
        setError(res?.message || "Gagal memperbarui data fasilitas.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden my-6 border border-slate-100 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
              <Edit3 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Edit Data Fasilitas K3</h2>
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {facility.code}
                </span>
                {hasSaved && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    Tersimpan
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Ubah spesifikasi, masa berlaku, lokasi, dan koordinat GPS aset</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg("")}
              className="text-emerald-600 hover:text-emerald-900 p-1 rounded-md hover:bg-emerald-100 transition cursor-pointer"
              title="Tutup pesan"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Section: Identitas Alat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Kode / ID Alat <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                value={code} 
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Contoh: A-01"
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Kategori Alat <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none bg-white"
              >
                <option value="apar">APAR (Alat Pemadam Api Ringan)</option>
                <option value="hydrant">Hydrant (Pillar / Box)</option>
                <option value="p3k">Kotak P3K & Medis</option>
                <option value="emergency_door">Pintu & Tangga Darurat</option>
                <option value="safety_mirror">Safety Mirror (Kaca Cembung)</option>
                <option value="assembly_point">Titik Kumpul (Assembly Point)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Nama Lengkap Fasilitas / Label Unit
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: APAR A-01 - Parkir Sepeda Motor 1"
              className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none bg-white"
            />
          </div>

          {/* Section: Lokasi & Zona Kawasan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Lokasi Fisik Pabrik <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                required
                list="location-options-edit"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Pilih atau ketik lokasi..."
                className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none bg-white"
              />
              <datalist id="location-options-edit">
                {availableLocations.map((loc) => (
                  <option key={loc.id} value={loc.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Zona Kawasan Spasial
              </label>
              <select
                value={areaZone}
                onChange={(e) => setAreaZone(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none bg-white"
              >
                <option value="UMUM">UMUM</option>
                <option value="FACTORY 1">FACTORY 1</option>
                <option value="FACTORY 2 & WORKSHOP">FACTORY 2 & WORKSHOP</option>
                <option value="WARE HOUSE">WARE HOUSE</option>
                <option value="LAB QC">LAB QC</option>
              </select>
            </div>
          </div>

          {/* Section: Tipe Karakteristik (Branching) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Karakteristik & Tipe Pemantauan K3
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTipeItem("CONSUMABLE")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer",
                  tipeItem === "CONSUMABLE"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900">Consumable</span>
                  <Clock size={15} className={tipeItem === "CONSUMABLE" ? "text-primary" : "text-gray-400"} />
                </div>
                <p className="text-[11px] text-gray-500">Masa kadaluarsa media (APAR, Obat P3K)</p>
              </button>

              <button
                type="button"
                onClick={() => setTipeItem("KONDISI")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer",
                  tipeItem === "KONDISI"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900">Kondisi Fisik</span>
                  <CheckCircle2 size={15} className={tipeItem === "KONDISI" ? "text-primary" : "text-gray-400"} />
                </div>
                <p className="text-[11px] text-gray-500">Fisik & fungsi berkala (Hydrant, Pintu, Rambu)</p>
              </button>
            </div>
          </div>

          {/* Dynamic Section: Consumable Fields */}
          {tipeItem === "CONSUMABLE" ? (
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Calendar size={14} className="text-amber-600" />
                <span>Pengaturan Masa Berlaku Media Pemadam / Obat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-amber-950 mb-1">
                    Tanggal Kadaluarsa (Expired Date) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date"
                    required
                    value={expiredAt}
                    onChange={(e) => setExpiredAt(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-amber-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-950 mb-1">
                    Peringatan Kuning (H-X Hari)
                  </label>
                  <input 
                    type="number"
                    min={1}
                    max={180}
                    value={thresholdWarning}
                    onChange={(e) => setThresholdWarning(Number(e.target.value) || 30)}
                    className="w-full px-3 py-1.5 text-xs font-bold border border-amber-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {category === "apar" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/80">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 mb-1">
                      Media Pemadam
                    </label>
                    <select
                      value={mediaPemadam}
                      onChange={(e) => setMediaPemadam(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg bg-white outline-none"
                    >
                      <option value="Dry Chemical Powder">Dry Chemical Powder</option>
                      <option value="CO2 (Carbon Dioxide)">CO2 (Carbon Dioxide)</option>
                      <option value="Foam AFFF">Foam AFFF</option>
                      <option value="Clean Agent / Halon Free">Clean Agent / Halon Free</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 mb-1">
                      Kapasitas Tabung (Kg)
                    </label>
                    <input 
                      type="number"
                      step="0.5"
                      min={1}
                      max={100}
                      value={kapasitasKg}
                      onChange={(e) => setKapasitasKg(e.target.value)}
                      placeholder="6"
                      className="w-full px-2.5 py-1.5 text-xs font-bold border border-amber-300 rounded-lg bg-white outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-sky-900 font-bold text-xs">
                <Clock size={14} className="text-sky-600" />
                <span>Pengaturan Interval Jadwal Inspeksi Rutin</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-sky-950 mb-1">
                  Interval Siklus Cek (Hari)
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min={1}
                    max={365}
                    value={intervalHari}
                    onChange={(e) => setIntervalHari(Number(e.target.value) || 30)}
                    className="w-32 px-3 py-1.5 text-xs font-bold border border-sky-300 rounded-lg bg-white outline-none"
                  />
                  <span className="text-xs text-sky-800 font-medium">Hari sekali (Default 30 hari)</span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Koordinat GPS Spasial */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation size={15} className="text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Koordinat GPS Unit (Geofence Lapangan)</span>
              </div>
              <button
                type="button"
                onClick={handleCaptureGps}
                disabled={isCapturingGps}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer active:scale-95 shadow-2xs"
              >
                <Crosshair size={12} className="text-blue-600" />
                <span>{isCapturingGps ? "Membaca..." : "Ambil GPS Saya"}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Latitude</label>
                <input 
                  type="text" 
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-7.644263"
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Longitude</label>
                <input 
                  type="text" 
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="112.694194"
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Status Operasional Unit */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Status Operasional Unit</span>
              <span className="text-[11px] text-slate-500">Unit nonaktif tidak akan muncul di antrean inspeksi lapangan</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={statusAktif} 
                onChange={(e) => setStatusAktif(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
            {onDeleteRequest ? (
              <button
                type="button"
                onClick={() => {
        
                  onClose();
                  onDeleteRequest(facility);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Hapus atau nonaktifkan fasilitas ini"
              >
                <Trash2 size={14} />
                <span>Hapus Unit</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              {hasSaved && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Tersimpan
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer",
                  hasSaved
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                    : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                )}
              >
                {hasSaved ? "Tutup" : "Batal"}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-on-primary rounded-xl text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
              >
                <Save size={15} />
                <span>{loading ? "Menyimpan..." : "Simpan Perubahan"}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
