/**
 * Konfigurasi Pemetaan Standar K3: Type of Work Permit -> Required PPE / APD
 * Berdasarkan standar keselamatan industri PT Widatra Bhakti & K3 Nasional.
 */

// Baseline APD yang selalu wajib di area pabrik untuk semua jenis pekerjaan
export const BASELINE_PPE_TAGS = [
  "safety helmet",
  "helm keselamatan",
  "safety shoes",
  "sepatu safety",
];

// Matriks kebutuhan APD per jenis izin kerja (menggunakan tag kata kunci untuk pencocokan toleran)
export const PERMIT_TYPE_PPE_RULES: Record<string, string[]> = {
  // 1. Hot Work / Pekerjaan Panas (Welding, Cutting, Grinding, Api Terbuka)
  "hot work": [
    "safety helmet",
    "helm keselamatan",
    "safety shoes",
    "sepatu safety",
    "face shield",
    "safety glasses",
    "gloves",
    "fire extinguisher",
    "respiratory protection",
  ],
  "ijin kerja panas": [
    "safety helmet",
    "helm keselamatan",
    "safety shoes",
    "sepatu safety",
    "face shield",
    "safety glasses",
    "gloves",
    "fire extinguisher",
    "respiratory protection",
  ],

  // 2. Work at Height / Pekerjaan Ketinggian (> 1.8 meter)
  "work at height": [
    "safety helmet",
    "helm keselamatan",
    "safety shoes",
    "sepatu safety",
    "body harness",
    "full body harness",
    "lifeline",
    "safety net",
    "safety line",
    "barricade",
  ],
  "ijin kerja ketinggian": [
    "safety helmet",
    "helm keselamatan",
    "safety shoes",
    "sepatu safety",
    "body harness",
    "full body harness",
    "lifeline",
    "safety net",
    "safety line",
    "barricade",
  ],

  // 3. Confined Space / Ruang Terbatas (Silo, Tangki, Manhole)
  "confined space": [
    "safety helmet",
    "helm keselamatan",
    "safety shoes",
    "sepatu safety",
    "body harness",
    "full body harness",
    "breathing apparatus",
    "respiratory protection",
    "lifeline",
    "gloves",
    "barricade",
    "sign",
  ],

  // 4. High Voltage Electricity / Listrik Tegangan Tinggi
  "high voltage electricity": [
    "safety helmet",
    "helm keselamatan",
    "safety shoes",
    "sepatu safety",
    "gloves",
    "face shield",
    "safety glasses",
    "barricade",
    "sign",
  ],

  // 5. Excavation / Penggalian & LOTO
  "excavation (loto)": [
    "safety helmet",
    "helm keselamatan",
    "safety shoes",
    "sepatu safety",
    "gloves",
    "safety glasses",
    "barricade",
    "sign",
  ],

  // 6. Heavy Lifting / Pengangkatan Beban Berat (Crane / Rigging)
  "heavy lifting": [
    "safety helmet",
    "helm keselamatan",
    "safety shoes",
    "sepatu safety",
    "gloves",
    "safety glasses",
    "barricade",
    "sign",
  ],

  // 7. Others / Pekerjaan Umum Lainnya
  "others": [
    "safety helmet",
    "helm keselamatan",
    "safety shoes",
    "sepatu safety",
  ],
};

/**
 * Mencari nama APD aktual dari database master list yang cocok dengan tag
 */
export function matchPpeName(tag: string, availablePpes: string[]): string | undefined {
  const cleanTag = tag.toLowerCase().trim();
  return availablePpes.find((p) => p.toLowerCase().trim() === cleanTag);
}

/**
 * Mengambil daftar APD yang direkomendasikan untuk satu atau sekumpulan permit type.
 * Memprioritaskan relasi default_ppes dari database (permitTypeObjects),
 * dengan fallback ke PERMIT_TYPE_PPE_RULES jika belum dikonfigurasi.
 */
export function getRecommendedPpeForPermits(
  permitTypes: string[],
  availablePpes: string[],
  permitTypeObjects?: any[]
): string[] {
  if (!permitTypes || permitTypes.length === 0) {
    return [];
  }

  const recommendedTags = new Set<string>();

  // Tambahkan baseline PPE untuk setiap permit aktif
  BASELINE_PPE_TAGS.forEach((tag) => recommendedTags.add(tag));

  // Ambil tag APD dari setiap permit yang dipilih
  permitTypes.forEach((pt) => {
    const key = pt.toLowerCase().trim();
    
    // Cek apakah ada objek permit dari database dengan relasi default_ppes
    const dbPermit = permitTypeObjects?.find(
      (item: any) => item.name?.toLowerCase().trim() === key
    );

    if (dbPermit && Array.isArray(dbPermit.default_ppes) && dbPermit.default_ppes.length > 0) {
      dbPermit.default_ppes.forEach((p: any) => {
        if (p.name) recommendedTags.add(p.name.toLowerCase().trim());
      });
    } else {
      const rules = PERMIT_TYPE_PPE_RULES[key];
      if (rules) {
        rules.forEach((tag) => recommendedTags.add(tag));
      }
    }
  });

  // Cocokkan tag dengan daftar APD yang benar-benar ada di master data database
  const matchedPpes = new Set<string>();
  recommendedTags.forEach((tag) => {
    const found = matchPpeName(tag, availablePpes);
    if (found) {
      matchedPpes.add(found);
    }
  });

  return Array.from(matchedPpes);
}

/**
 * Menghitung daftar APD baru saat permit types berubah, dengan menjaga pilihan manual pengguna.
 */
export function calculateUpdatedPpeSelection(
  oldPermits: string[],
  newPermits: string[],
  currentSelectedPpe: string[],
  availablePpes: string[],
  permitTypeObjects?: any[]
): string[] {
  const oldRecommended = getRecommendedPpeForPermits(oldPermits, availablePpes, permitTypeObjects);
  const newRecommended = getRecommendedPpeForPermits(newPermits, availablePpes, permitTypeObjects);

  // APD yang dicentang secara manual oleh user di luar rekomendasi sistem sebelumnya
  const manualSelections = (currentSelectedPpe || []).filter(
    (item) => !oldRecommended.includes(item)
  );

  // Hasil baru = Rekomendasi baru digabung dengan pilihan manual user
  const resultSet = new Set<string>([...newRecommended, ...manualSelections]);

  return Array.from(resultSet);
}
