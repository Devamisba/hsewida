import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Navigation,
  Building2,
  AlertTriangle,
  Info
} from "lucide-react";
import { calculateHaversineDistance, PLANT_CENTER } from "@/utils/facilityCoordinates";

// =========================================================================
// 1. FIX BUNDLER MARKER ICON UNTUK VITE & WEBPACK
// =========================================================================
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// =========================================================================
// 2. INTERFACE DEFINITIONS
// =========================================================================
export interface FacilityCheckpoint {
  id: string | number;
  name: string;
  category?: string; // "apar" | "hydrant" | "emergency_door" | "p3k" | "safety_mirror" | "assembly_point"
  latitude: number;
  longitude: number;
  status?: string; // "Good" | "Needs Attention" | "Critical" | "NORMAL" | "EXPIRED"
  location_name?: string;
  zone?: string;
  last_inspected?: string;
  qr_code?: string;
  info?: string;
  rawData?: any;
}

export interface GeofenceStatus {
  isInside: boolean;
  distanceMeters: number;
  accuracyMeters?: number;
  userLocation: { lat: number; lng: number } | null;
  error?: string | null;
}

export interface FacilityGeofenceMapProps {
  centerLat?: number;
  centerLng?: number;
  radius?: number; // Geofence Induk (Pabrik)
  childRadius?: number; // Geofence Child (Alat)
  locationName?: string;
  checkpoints?: FacilityCheckpoint[];
  selectedCheckpointId?: string | number | null;
  onCheckpointSelect?: (checkpoint: FacilityCheckpoint) => void;
  onStatusChange?: (status: GeofenceStatus) => void;
  height?: string;
  showControls?: boolean;
}

// =========================================================================
// 3. CUSTOM SVG MARKER GENERATOR
// =========================================================================
function createCategoryDivIcon(category: string, isAttention: boolean): L.DivIcon {
  let bg = "#10b981"; // emerald
  let symbol = "🛡️";

  switch ((category || "").toLowerCase()) {
    case "apar":
      bg = isAttention ? "#ef4444" : "#e11d48"; // Rose / Red
      symbol = "🧯";
      break;
    case "hydrant":
      bg = "#0284c7"; // Sky blue
      symbol = "💧";
      break;
    case "emergency_door":
      bg = "#059669"; // Green exit
      symbol = "🚪";
      break;
    case "p3k":
      bg = "#dc2626"; // Red cross
      symbol = "➕";
      break;
    case "assembly_point":
      bg = "#d97706"; // Amber
      symbol = "🚩";
      break;
    case "safety_mirror":
      bg = "#7c3aed"; // Purple
      symbol = "👁️";
      break;
    default:
      bg = "#475569";
      symbol = "📍";
      break;
  }

  const pulseRing = isAttention
    ? `<span class="absolute -inset-1 rounded-full bg-rose-500/40 animate-ping"></span>`
    : "";

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group">
      ${pulseRing}
      <div style="background-color: ${bg};" class="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs transform transition-transform group-hover:scale-115">
        <span class="text-white text-[13px] leading-none">${symbol}</span>
      </div>
      <div style="border-top-color: ${bg};" class="absolute -bottom-1 w-0 h-0 border-x-4 border-x-transparent border-t-4"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-facility-pin",
    iconSize: [32, 36],
    iconAnchor: [16, 36],
    popupAnchor: [0, -36],
  });
}

function createUserPulsingDivIcon(): L.DivIcon {
  const html = `
    <div class="relative flex items-center justify-center">
      <span class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></span>
      <span class="absolute w-6 h-6 rounded-full bg-blue-500/50"></span>
      <span class="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-md"></span>
    </div>
  `;

  return L.divIcon({
    html,
    className: "user-gps-pulse-pin",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// =========================================================================
// 4. MAIN COMPONENT
// =========================================================================
export function FacilityGeofenceMap({
  centerLat = PLANT_CENTER.lat,
  centerLng = PLANT_CENTER.lng,
  radius = PLANT_CENTER.radiusMeters,
  childRadius = PLANT_CENTER.childRadiusMeters,
  locationName = PLANT_CENTER.name,
  checkpoints = [],
  selectedCheckpointId,
  onCheckpointSelect,
  onStatusChange,
  height = "520px",
  showControls = true,
}: FacilityGeofenceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geofenceCircleRef = useRef<L.Circle | null>(null);
  const checkpointsLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Component State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [isInside, setIsInside] = useState<boolean>(true);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSearching, setGpsSearching] = useState<boolean>(true);
  const [activeFilterCategory, setActiveFilterCategory] = useState<string>("ALL");
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);

  // Focus on selected checkpoint if provided
  useEffect(() => {
    if (!selectedCheckpointId || !mapInstanceRef.current || !checkpoints.length) return;
    const target = checkpoints.find((c) => String(c.id) === String(selectedCheckpointId));
    if (target) {
      mapInstanceRef.current.flyTo([target.latitude, target.longitude], 19, { animate: true });
    }
  }, [selectedCheckpointId, checkpoints]);

  // -----------------------------------------------------------------------
  // INITIALIZE MAP (Vanilla Leaflet on Mount)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // 1. Buat instance Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 17,
      zoomControl: false,
    });

    // 2. Set Tile Layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | HSE PT Widatra Bhakti',
    }).addTo(map);

    // Zoom control diposisikan di kanan bawah
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // 3. Buat Geofence Circle Induk (Pabrik)
    const circle = L.circle([centerLat, centerLng], {
      radius: radius,
      color: "#10b981", // Default emerald
      fillColor: "#10b981",
      fillOpacity: 0.12,
      weight: 2,
      dashArray: "6, 6",
    }).addTo(map);

    circle.bindTooltip(
      `<b>${locationName}</b><br/>Radius Pagar Geofence: ${radius}m`,
      { permanent: false, direction: "top" }
    );

    geofenceCircleRef.current = circle;

    // 4. LayerGroup untuk Checkpoints Fasilitas K3
    const checkpointsLayer = L.layerGroup().addTo(map);
    checkpointsLayerRef.current = checkpointsLayer;

    mapInstanceRef.current = map;

    // Fix map sizing on render
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    // CLEANUP SIKLUS HIDUP PADA UNMOUNT
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [centerLat, centerLng, radius, locationName]);

  // -----------------------------------------------------------------------
  // REAL-TIME GPS TRACKING (navigator.geolocation.watchPosition)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Browser ini tidak mendukung Geolocation API.");
      setGpsSearching(false);
      return;
    }

    setGpsSearching(true);
    setGpsError(null);

    const onLocationSuccess = (position: GeolocationPosition) => {
      const uLat = position.coords.latitude;
      const uLng = position.coords.longitude;
      const uAcc = position.coords.accuracy;

      setUserLocation({ lat: uLat, lng: uLng });
      setAccuracy(Math.round(uAcc));
      setGpsSearching(false);
      setGpsError(null);

      // Hitung jarak ke pusat kawasan pabrik via Haversine
      const dist = calculateHaversineDistance(uLat, uLng, centerLat, centerLng);
      setDistanceMeters(dist);

      const inside = dist <= radius;
      setIsInside(inside);

      // Beritahu parent component via callback
      if (onStatusChange) {
        onStatusChange({
          isInside: inside,
          distanceMeters: dist,
          accuracyMeters: uAcc,
          userLocation: { lat: uLat, lng: uLng },
        });
      }

      // Update warna lingkaran geofence pabrik (Induk)
      if (geofenceCircleRef.current) {
        if (inside) {
          geofenceCircleRef.current.setStyle({
            color: "#10b981", // Hijau jika di dalam pabrik
            fillColor: "#10b981",
          });
        } else {
          geofenceCircleRef.current.setStyle({
            color: "#ef4444", // Merah jika di luar pabrik
            fillColor: "#ef4444",
          });
        }
      }

      // Render atau update Marker Posisi Pengguna (Pulse Radar)
      const map = mapInstanceRef.current;
      if (map) {
        if (!userMarkerRef.current) {
          const uMarker = L.marker([uLat, uLng], {
            icon: createUserPulsingDivIcon(),
            zIndexOffset: 1000,
          }).addTo(map);

          uMarker.bindPopup(`
            <div class="p-2 text-xs font-sans">
              <div class="font-bold text-slate-800 flex items-center gap-1">
                <span>📍 Posisi Anda (Petugas K3)</span>
              </div>
              <div class="text-[11px] text-slate-500 mt-1">
                Akurasi GPS: ±${Math.round(uAcc)} meter<br/>
                Jarak ke Pusat Pabrik: <b>${dist} meter</b>
              </div>
            </div>
          `);

          userMarkerRef.current = uMarker;
        } else {
          userMarkerRef.current.setLatLng([uLat, uLng]);
        }
      }
    };

    const onLocationError = (error: GeolocationPositionError) => {
      setGpsSearching(false);
      let errMsg = "Terjadi kendala saat membaca GPS.";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errMsg = "Izin GPS ditolak oleh browser/pengguna.";
          break;
        case error.POSITION_UNAVAILABLE:
          errMsg = "Sinyal GPS perangkat tidak terdeteksi.";
          break;
        case error.TIMEOUT:
          errMsg = "Pencarian sinyal GPS melebihi batas waktu (timeout).";
          break;
      }
      setGpsError(errMsg);

      if (onStatusChange) {
        onStatusChange({
          isInside: false,
          distanceMeters: 0,
          userLocation: null,
          error: errMsg,
        });
      }
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    };

    // Jalankan continuous tracking GPS
    const watchId = navigator.geolocation.watchPosition(
      onLocationSuccess,
      onLocationError,
      options
    );
    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [centerLat, centerLng, radius, onStatusChange]);

  // -----------------------------------------------------------------------
  // RENDER CHECKPOINTS (L.layerGroup)
  // -----------------------------------------------------------------------
  useEffect(() => {
    const layer = checkpointsLayerRef.current;
    const map = mapInstanceRef.current;
    if (!layer || !map) return;

    // Bersihkan seluruh layer checkpoints tanpa destroy map instance
    layer.clearLayers();

    // Filter checkpoints sesuai tab aktif jika ada
    const filtered = checkpoints.filter((cp) => {
      if (activeFilterCategory === "ALL") return true;
      return (cp.category || "").toLowerCase() === activeFilterCategory.toLowerCase();
    });

    filtered.forEach((cp) => {
      const isAttention = cp.status === "Needs Attention" || cp.status === "Critical" || cp.status === "EXPIRED";
      const icon = createCategoryDivIcon(cp.category || "apar", isAttention);

      const marker = L.marker([cp.latitude, cp.longitude], { icon });

      // Hitung jarak dari user ke unit ini
      let distFromUserStr = "-";
      let isNearChild = false;
      if (userLocation) {
        const d = calculateHaversineDistance(userLocation.lat, userLocation.lng, cp.latitude, cp.longitude);
        distFromUserStr = `${d} meter`;
        isNearChild = d <= childRadius;
      }

      // Micro-Radius Circle di sekitar alat (Child Geofence Radius)
      const childCircle = L.circle([cp.latitude, cp.longitude], {
        radius: childRadius,
        color: isNearChild ? "#10b981" : "#3b82f6",
        fillColor: isNearChild ? "#10b981" : "#3b82f6",
        fillOpacity: 0.08,
        weight: 1,
        dashArray: "3, 3",
      });

      // Custom HTML Popup Card
      const popupHtml = `
        <div class="p-2.5 font-sans min-w-[210px] text-slate-800">
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span class="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              ${cp.name || cp.id}
            </span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isAttention
                ? "bg-rose-100 text-rose-700 border border-rose-200"
                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
            }">
              ${cp.status || "NORMAL"}
            </span>
          </div>

          <div class="mt-2 space-y-1 text-xs">
            <div class="text-[11px] text-slate-600 flex items-center gap-1">
              <span>📍 <b>Lokasi:</b> ${cp.location_name || "Area Pabrik"}</span>
            </div>
            ${cp.zone ? `<div class="text-[11px] text-slate-500">🏢 <b>Zona:</b> ${cp.zone}</div>` : ""}
            <div class="text-[11px] text-slate-500">
              🕒 <b>Terakhir Cek:</b> ${cp.last_inspected || "Belum ada"}
            </div>
            <div class="text-[11px] text-slate-700 pt-1 border-t border-slate-100 font-semibold flex justify-between">
              <span>Jarak ke Posisi Anda:</span>
              <span class="${isNearChild ? "text-emerald-600" : "text-slate-600"}">${distFromUserStr}</span>
            </div>
            ${
              isNearChild
                ? `<div class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-center">🎯 Anda berada di jangkauan alat (&lt;${childRadius}m)</div>`
                : `<div class="text-[10px] text-slate-400 text-center">Dekati alat untuk melakukan scan fisik</div>`
            }
          </div>

          <div class="mt-2.5 pt-1.5 border-t border-slate-100">
            <button 
              id="btn-inspect-${cp.id}" 
              class="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
            >
              Lihat Detail Fasilitas
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260 });

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-inspect-${cp.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onCheckpointSelect) {
              onCheckpointSelect(cp);
            }
          };
        }
      });

      marker.on("click", () => {
        if (onCheckpointSelect) {
          onCheckpointSelect(cp);
        }
      });

      // Masukkan ke layer
      layer.addLayer(childCircle);
      layer.addLayer(marker);
    });
  }, [checkpoints, activeFilterCategory, userLocation, childRadius, onCheckpointSelect]);

  // -----------------------------------------------------------------------
  // FOCUS ACTIONS (flyTo)
  // -----------------------------------------------------------------------
  const handleFlyToUser = useCallback(() => {
    if (!mapInstanceRef.current || !userLocation) {
      alert("Lokasi GPS Anda belum terdeteksi.");
      return;
    }
    mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 18, {
      duration: 1.2,
    });
  }, [userLocation]);

  const handleFlyToPlantCenter = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([centerLat, centerLng], 17, {
      duration: 1.2,
    });
  }, [centerLat, centerLng]);

  return (
    <div className="relative isolate z-0 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 font-sans">
      
      {/* =================================================================== */}
      {/* TOP FLOATING STATUS BADGE OVERLAY                                  */}
      {/* =================================================================== */}
      <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        
        {/* Status Card GPS & Geofence Pabrik */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-md border border-slate-200 text-xs flex items-center gap-3">
          
          {/* Status Indicator Dot */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {isInside ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </>
              )}
            </span>

            <div>
              <div className="font-bold flex items-center gap-1.5 text-slate-900">
                <span>{isInside ? "DI DALAM KAWASAN PABRIK" : "DI LUAR KAWASAN PABRIK"}</span>
                <span className="text-[10px] font-normal text-slate-500">
                  (Jarak: <b>{distanceMeters}m</b>)
                </span>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-2">
                <span>Radius Pagar: <b>{radius}m</b></span>
                <span>•</span>
                {accuracy ? (
                  <span>Akurasi GPS: <b>±{accuracy}m</b></span>
                ) : gpsSearching ? (
                  <span className="text-amber-600 animate-pulse">Mencari sinyal GPS...</span>
                ) : (
                  <span className="text-slate-400">GPS Standar</span>
                )}
              </div>
            </div>
          </div>

          {gpsError && (
            <div className="hidden lg:flex items-center gap-1 text-[11px] text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1 rounded">
              <AlertTriangle size={12} />
              <span>{gpsError}</span>
            </div>
          )}

        </div>

        {/* Category Filter Pills (Over map) */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200 text-xs flex items-center gap-1 flex-wrap">
          {[
            { id: "ALL", label: `Semua (${checkpoints.length})` },
            { id: "apar", label: "APAR" },
            { id: "hydrant", label: "Hydrant" },
            { id: "emergency_door", label: "Pintu Evakuasi" },
            { id: "p3k", label: "P3K" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveFilterCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                activeFilterCategory === cat.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* =================================================================== */}
      {/* FLOATING ACTION BUTTONS (Right Side)                              */}
      {/* =================================================================== */}
      {showControls && (
        <div className="absolute bottom-6 right-3 z-20 flex flex-col gap-2">
          
          {/* Tombol Pusatkan ke Lokasi Saya */}
          <button
            type="button"
            onClick={handleFlyToUser}
            className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-800 shadow-md border border-slate-200 flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Pusatkan Peta ke Posisi Saya (GPS)"
          >
            <Navigation size={18} className="text-blue-600" />
          </button>

          {/* Tombol Pusatkan ke Kawasan Pabrik */}
          <button
            type="button"
            onClick={handleFlyToPlantCenter}
            className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-800 shadow-md border border-slate-200 flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Pusatkan Peta ke Pusat Kawasan Pabrik PT Widatra Bhakti"
          >
            <Building2 size={18} className="text-emerald-700" />
          </button>

          {/* Tombol Toggle Legend */}
          <button
            type="button"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-800 shadow-md border border-slate-200 flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Petunjuk Legenda Marker K3"
          >
            <Info size={18} className="text-slate-600" />
          </button>

        </div>
      )}

      {/* =================================================================== */}
      {/* FLOATING LEGEND MODAL OVERLAY                                      */}
      {/* =================================================================== */}
      {isLegendOpen && (
        <div className="absolute bottom-6 left-3 z-30 bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-slate-200 text-xs max-w-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between font-bold text-slate-900 pb-1 border-b border-slate-100">
            <span>Legenda Peta Fasilitas K3</span>
            <button onClick={() => setIsLegendOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px]">●</span>
              <span>Posisi Anda (Live GPS Pulse Tracker)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-500 border border-dashed border-emerald-600"></span>
              <span>Geofence Pabrik (Induk: Radius {radius}m)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-400 border border-dashed border-blue-600"></span>
              <span>Geofence Mikro Alat (Child: Radius {childRadius}m)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🧯</span>
              <span>APAR (Merah: Aman, Berkedip: Butuh Cek/Expired)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💧</span>
              <span>Hydrant Pabrik</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🚪</span>
              <span>Pintu Darurat & Jalur Evakuasi</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🚩</span>
              <span>Assembly Point (Titik Kumpul Darurat)</span>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* LEAFLET MAP DOM CONTAINER                                          */}
      {/* =================================================================== */}
      <div 
        ref={mapContainerRef} 
        style={{ height }} 
        className="w-full z-0" 
      />

    </div>
  );
}
