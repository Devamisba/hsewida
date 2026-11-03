import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { 
  Navigation, 
  SlidersHorizontal, 
  RefreshCw, 
  QrCode, 
  Flame, 
  Droplet, 
  DoorOpen, 
  Cross, 
  Crosshair, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Building2
} from "lucide-react";
import { FacilityGeofenceMap, FacilityCheckpoint } from "@/components/FacilityGeofenceMap";
import { FacilityDetailActionModal } from "@/components/FacilityDetailActionModal";
import { QrScanFieldModal } from "@/components/QrScanFieldModal";
import { 
  PLANT_CENTER, 
  getFacilityCoordinates, 
  syncGeofenceFromSettingsMap, 
  DEFAULT_PLANT_CENTER 
} from "@/utils/facilityCoordinates";
import { api, SafetyFacility } from "@/services/api";

export default function GisGeofencePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("focus");

  const [facilities, setFacilities] = useState<SafetyFacility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFacility, setSelectedFacility] = useState<SafetyFacility | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [scannerModalOpen, setScannerModalOpen] = useState<boolean>(false);
  const [plantSettingsModalOpen, setPlantSettingsModalOpen] = useState<boolean>(false);

  // Plant Geofence Master Settings State
  const [plantName, setPlantName] = useState<string>(PLANT_CENTER.name);
  const [plantLat, setPlantLat] = useState<string>(String(PLANT_CENTER.lat));
  const [plantLng, setPlantLng] = useState<string>(String(PLANT_CENTER.lng));
  const [plantRadius, setPlantRadius] = useState<number>(PLANT_CENTER.radiusMeters);
  const [childRadius, setChildRadius] = useState<number>(PLANT_CENTER.childRadiusMeters);
  const [isSavingPlantSettings, setIsSavingPlantSettings] = useState<boolean>(false);
  const [plantSettingMsg, setPlantSettingMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load facilities and master settings
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [facRes, setRes] = await Promise.all([
        api.getFacilities(),
        api.getSettings(),
      ]);

      if (setRes?.success && setRes.data?.map) {
        syncGeofenceFromSettingsMap(setRes.data.map);
        const map = setRes.data.map;
        if (map.geofence_plant_name) setPlantName(String(map.geofence_plant_name));
        if (map.geofence_plant_lat) setPlantLat(String(map.geofence_plant_lat));
        if (map.geofence_plant_lng) setPlantLng(String(map.geofence_plant_lng));
        if (map.geofence_plant_radius_meters) setPlantRadius(Number(map.geofence_plant_radius_meters));
        if (map.geofence_child_radius_meters) setChildRadius(Number(map.geofence_child_radius_meters));
      }

      if (facRes?.success && Array.isArray(facRes.data)) {
        setFacilities(facRes.data);
      } else {
        setFacilities([]);
      }
    } catch (err) {
      console.error("Failed to load GIS data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map checkpoints
  const checkpoints: FacilityCheckpoint[] = useMemo(() => {
    return facilities.map((f: any) => {
      const coords = getFacilityCoordinates(f);
      const locName = typeof f.location === "object" ? f.location?.name : (f.location || f.area_zone || "-");
      return {
        id: f.id,
        name: `${f.code} - ${f.name || f.nama_item || "Unit"}`,
        category: f.category || "apar",
        latitude: coords.lat,
        longitude: coords.lng,
        status: f.status || f.calculated_status || "NORMAL",
        location_name: locName,
        zone: f.area_zone || "-",
        last_inspected: f.last_inspected_at || "-",
        qr_code: f.code,
        rawData: f,
      };
    });
  }, [facilities]);

  // Auto-open detail if focus query param is given
  useEffect(() => {
    if (focusId && facilities.length > 0) {
      const target = facilities.find(f => String(f.id) === String(focusId));
      if (target) {
        setSelectedFacility(target);
      }
    }
  }, [focusId, facilities]);

  // Save Plant Master Settings
  const handleSavePlantSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPlantSettings(true);
    setPlantSettingMsg(null);
    try {
      const payload = [
        { key: "geofence_plant_name", value: plantName.trim() },
        { key: "geofence_plant_lat", value: plantLat.trim() },
        { key: "geofence_plant_lng", value: plantLng.trim() },
        { key: "geofence_plant_radius_meters", value: Number(plantRadius) },
        { key: "geofence_child_radius_meters", value: Number(childRadius) },
      ];

      const res = await api.updateSettings(payload);
      if (res?.success) {
        if (res.data?.map) {
          syncGeofenceFromSettingsMap(res.data.map);
        }
        setPlantSettingMsg({ type: "success", text: "Titik koordinat dan radius pagar pabrik berhasil disimpan ke master." });
        setTimeout(() => {
          setPlantSettingsModalOpen(false);
          setPlantSettingMsg(null);
        }, 1200);
      } else {
        setPlantSettingMsg({ type: "error", text: res?.message || "Gagal menyimpan pengaturan pabrik." });
      }
    } catch (err: any) {
      setPlantSettingMsg({ type: "error", text: err.message || "Terjadi kesalahan sistem saat menyimpan." });
    } finally {
      setIsSavingPlantSettings(false);
    }
  };

  // Facility Count Stats
  const stats = useMemo(() => {
    const total = facilities.length;
    const apar = facilities.filter(f => f.category === 'apar').length;
    const hydrant = facilities.filter(f => f.category === 'hydrant').length;
    const emergency = facilities.filter(f => f.category === 'emergency_door').length;
    const p3k = facilities.filter(f => f.category === 'p3k').length;
    return { total, apar, hydrant, emergency, p3k };
  }, [facilities]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden relative font-sans">
      <Header title="Peta GIS & Geofence Spasial K3" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Top Bar: Action Buttons & Statistics Banner */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Navigation size={20} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base md:text-lg font-bold text-slate-900">
                      Sistem Informasi Geografis (GIS) Fasilitas K3
                    </h2>
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Realtime Spasial
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pemantauan sebaran unit proteksi kebakaran, jalur evakuasi, dan radius mikro alat PT Widatra Bhakti.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <button
                type="button"
                onClick={() => setScannerModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                title="Scan QR Code Alat di Lapangan"
              >
                <QrCode size={15} />
                <span>Scan QR Lapangan</span>
              </button>

              <button
                type="button"
                onClick={() => setPlantSettingsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                title="Atur Titik Pusat & Radius Pagar Pabrik di Master"
              >
                <SlidersHorizontal size={14} />
                <span>Atur Titik Pabrik (Master)</span>
              </button>

              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer active:scale-95"
                title="Muat Ulang Titik Fasilitas"
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-emerald-600" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block" />
                <span className="text-xs font-semibold text-slate-600">Total Unit</span>
              </div>
              <span className="text-base font-bold text-slate-900">{stats.total}</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={14} className="text-rose-600" />
                <span className="text-xs font-semibold text-rose-900">APAR</span>
              </div>
              <span className="text-base font-bold text-rose-700">{stats.apar}</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet size={14} className="text-blue-600" />
                <span className="text-xs font-semibold text-blue-900">Hydrant</span>
              </div>
              <span className="text-base font-bold text-blue-700">{stats.hydrant}</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DoorOpen size={14} className="text-teal-600" />
                <span className="text-xs font-semibold text-teal-900">Pintu Evakuasi</span>
              </div>
              <span className="text-base font-bold text-teal-700">{stats.emergency}</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2">
                <Cross size={14} className="text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-900">P3K</span>
              </div>
              <span className="text-base font-bold text-emerald-700">{stats.p3k}</span>
            </div>
          </div>

          {/* Interactive Vanilla Leaflet Map Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 sm:p-3 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
                <p className="text-sm font-semibold">Memuat peta spasial & seluruh koordinat fasilitas...</p>
              </div>
            ) : (
              <FacilityGeofenceMap
                centerLat={Number(plantLat)}
                centerLng={Number(plantLng)}
                radius={plantRadius}
                childRadius={childRadius}
                locationName={plantName}
                checkpoints={checkpoints}
                selectedCheckpointId={focusId}
                onCheckpointSelect={(cp) => {
                  if (cp.rawData) {
                    setSelectedFacility(cp.rawData);
                    setDetailModalOpen(true);
                  }
                }}
                height="680px"
                showControls={true}
              />
            )}
          </div>

        </div>
      </main>

      {/* 1. Modal Detail & Kelola Fasilitas */}
      <FacilityDetailActionModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        facility={selectedFacility}
        onInspect={(f) => {
          if (!f.category || f.category === "apar") {
            navigate(`/scan/apar/${f.code}`);
          }
        }}
        onShowSticker={() => {}}
        onRefill={() => {}}
        onFacilityUpdated={(updated) => {
          setFacilities(prev => prev.map(item => item.id === updated.id ? updated : item));
          setSelectedFacility(updated);
        }}
      />

      {/* 2. Modal Scan QR Lapangan */}
      <QrScanFieldModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        onScanSuccess={(fac) => {
          setSelectedFacility(fac);
          setDetailModalOpen(true);
        }}
      />

      {/* 3. Modal Atur Titik Pabrik (Master Geofence) */}
      {plantSettingsModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Atur Titik Pusat Pabrik (Master)</h3>
                  <p className="text-xs text-slate-500">Konfigurasi koordinat geofence induk pabrik PT Widatra Bhakti</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlantSettingsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlantSettings} className="p-5 space-y-4">
              {plantSettingMsg && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  plantSettingMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                }`}>
                  {plantSettingMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{plantSettingMsg.text}</span>
                </div>
              )}

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setPlantLat(pos.coords.latitude.toFixed(6));
                          setPlantLng(pos.coords.longitude.toFixed(6));
                        },
                        (err) => alert("Gagal membaca GPS: " + err.message),
                        { enableHighAccuracy: true }
                      );
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
                >
                  <Crosshair size={13} /> Gunakan GPS Saya
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPlantName(DEFAULT_PLANT_CENTER.name);
                    setPlantLat(String(DEFAULT_PLANT_CENTER.lat));
                    setPlantLng(String(DEFAULT_PLANT_CENTER.lng));
                    setPlantRadius(DEFAULT_PLANT_CENTER.radiusMeters);
                    setChildRadius(DEFAULT_PLANT_CENTER.childRadiusMeters);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  <RefreshCw size={13} /> Reset Pabrik Asli
                </button>

                <button
                  type="button"
                  onClick={() => setPlantRadius(50000)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition"
                >
                  Uji Coba 50 km
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Kawasan</label>
                <input
                  type="text"
                  required
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Latitude</label>
                  <input
                    type="text"
                    required
                    value={plantLat}
                    onChange={(e) => setPlantLat(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Longitude</label>
                  <input
                    type="text"
                    required
                    value={plantLng}
                    onChange={(e) => setPlantLng(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Radius Pagar Pabrik (m)</label>
                  <input
                    type="number"
                    min={10}
                    max={100000}
                    required
                    value={plantRadius}
                    onChange={(e) => setPlantRadius(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Radius Mikro Alat (m)</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={childRadius}
                    onChange={(e) => setChildRadius(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPlantSettingsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingPlantSettings}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm flex items-center gap-1.5 transition disabled:opacity-70 cursor-pointer"
                >
                  <Save size={14} />
                  <span>{isSavingPlantSettings ? "Menyimpan..." : "Simpan ke Master"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
