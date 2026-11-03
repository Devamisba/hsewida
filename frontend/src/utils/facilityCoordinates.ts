/**
 * Facility Coordinates Helper & Spatial Calculations
 * PT Widatra Bhakti - Pandaan, Pasuruan
 */

export interface PlantGeofenceConfig {
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  childRadiusMeters: number;
}

export const DEFAULT_PLANT_CENTER: PlantGeofenceConfig = {
  lat: -7.644263,
  lng: 112.694194,
  name: "PT Widatra Bhakti — Kawasan Pabrik (Pandaan)",
  radiusMeters: 500, // Geofence Induk melingkupi kawasan pabrik Pandaan
  childRadiusMeters: 25, // Geofence Child (Alat)
};

const STORAGE_KEY = "k3_geofence_master_config_v2";

export function getStoredPlantGeofence(): PlantGeofenceConfig {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      const lat = Number(parsed.lat ?? DEFAULT_PLANT_CENTER.lat);
      const lng = Number(parsed.lng ?? DEFAULT_PLANT_CENTER.lng);

      // Auto-invalidation jika masih menyimpan koordinat dummy lama di Gunung Gangsir (-7.6045, 112.7292)
      if (lat > -7.62 || lng > 112.71) {
        localStorage.removeItem(STORAGE_KEY);
        return DEFAULT_PLANT_CENTER;
      }

      return {
        lat,
        lng,
        name: parsed.name || DEFAULT_PLANT_CENTER.name,
        radiusMeters: Number(parsed.radiusMeters ?? DEFAULT_PLANT_CENTER.radiusMeters),
        childRadiusMeters: Number(parsed.childRadiusMeters ?? DEFAULT_PLANT_CENTER.childRadiusMeters),
      };
    }
  } catch (_) {}
  return DEFAULT_PLANT_CENTER;
}

export function saveStoredPlantGeofence(config: Partial<PlantGeofenceConfig>): PlantGeofenceConfig {
  const current = getStoredPlantGeofence();
  const updated: PlantGeofenceConfig = {
    ...current,
    ...config,
  };
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (_) {}
  Object.assign(PLANT_CENTER, updated);
  return updated;
}

export function syncGeofenceFromSettingsMap(map: Record<string, any>): PlantGeofenceConfig {
  if (!map) return PLANT_CENTER;
  const updated: Partial<PlantGeofenceConfig> = {};
  if (map.geofence_plant_lat !== undefined && map.geofence_plant_lat !== "") {
    const l = Number(map.geofence_plant_lat);
    // Abaikan jika database masih menyimpan koordinat lama Gunung Gangsir
    if (l <= -7.62) updated.lat = l;
  }
  if (map.geofence_plant_lng !== undefined && map.geofence_plant_lng !== "") {
    const g = Number(map.geofence_plant_lng);
    if (g <= 112.71) updated.lng = g;
  }
  if (map.geofence_plant_name !== undefined && map.geofence_plant_name !== "") {
    updated.name = String(map.geofence_plant_name);
  }
  if (map.geofence_plant_radius_meters !== undefined && Number(map.geofence_plant_radius_meters) > 0) {
    updated.radiusMeters = Number(map.geofence_plant_radius_meters);
  }
  if (map.geofence_child_radius_meters !== undefined && Number(map.geofence_child_radius_meters) > 0) {
    updated.childRadiusMeters = Number(map.geofence_child_radius_meters);
  }
  return saveStoredPlantGeofence(updated);
}

export const PLANT_CENTER: PlantGeofenceConfig = {
  ...getStoredPlantGeofence(),
};

// Zona Koordinat Basis Riil di Kawasan Pabrik Pandaan (Pasuruan)
export const ZONE_CENTERS: Record<string, { lat: number; lng: number; label: string }> = {
  "UMUM": {
    lat: -7.645014,
    lng: 112.693794,
    label: "Area Umum (Pos Satpam, Parkir, Kantor Depan Pandaan)"
  },
  "FACTORY 1": {
    lat: -7.645118,
    lng: 112.693859,
    label: "Factory 1 (Produksi & Filling Solution Pandaan)"
  },
  "FACTORY 2 & WORKSHOP": {
    lat: -7.643320,
    lng: 112.694915,
    label: "Factory 2 & Workshop (Teknik & Utilitas Pandaan)"
  },
  "WARE HOUSE": {
    lat: -7.643562,
    lng: 112.694169,
    label: "Warehouse (Gudang Bahan Baku, Jadi & Transit Pandaan)"
  },
  "LAB QC": {
    lat: -7.643660,
    lng: 112.694814,
    label: "Laboratorium QC & Ruang Stabilitas Pandaan"
  }
};

/**
 * Rumus Haversine: Menghitung jarak presisi dua titik koordinat dalam satuan meter
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radius bumi dalam meter
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Deterministic hash-based micro offset
 * Menghasilkan koordinat stabil di dalam zonanya agar marker tidak bertumpuk di 1 titik
 */
function getDeterministicOffset(seedStr: string): { dLat: number; dLng: number } {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  
  // Normalisasi ke spread sekitar ±0.00035 derajat (~35 meter dari pusat zona)
  const angle = Math.abs(hash % 360) * (Math.PI / 180);
  const distance = ((Math.abs(hash >> 3) % 100) / 100) * 0.00028 + 0.00005;

  return {
    dLat: Math.sin(angle) * distance,
    dLng: Math.cos(angle) * distance,
  };
}

/**
 * Memetakan fasilitas K3 ke koordinat spasial
 */
export function getFacilityCoordinates(facility: any): { lat: number; lng: number } {
  // Jika database sudah memiliki koordinat eksplisit
  if (facility?.latitude && facility?.longitude) {
    return {
      lat: Number(facility.latitude),
      lng: Number(facility.longitude),
    };
  }

  // Jika spesifikasi memiliki koordinat
  const specs = facility?.specifications || {};
  if (specs.latitude && specs.longitude) {
    return {
      lat: Number(specs.latitude),
      lng: Number(specs.longitude),
    };
  }

  // Tentukan pusat zona
  const zoneKey = (facility?.area_zone || "").toUpperCase().trim();
  const baseZone = ZONE_CENTERS[zoneKey] || ZONE_CENTERS["FACTORY 1"];

  // Berikan offset mikro berbasis kode unit (misal A-01, A-02) agar terpisah rapi
  const seed = `${facility?.code || facility?.id || "unit"}_${zoneKey}`;
  const offset = getDeterministicOffset(seed);

  return {
    lat: Number((baseZone.lat + offset.dLat).toFixed(6)),
    lng: Number((baseZone.lng + offset.dLng).toFixed(6)),
  };
}
