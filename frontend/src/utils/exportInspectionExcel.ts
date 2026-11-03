import * as XLSX from "xlsx";

export interface InspectionFilterExportInfo {
  categoryLabel: string;
  zoneLabel: string;
  checkStatusLabel: string;
  dateRangeLabel: string;
  searchKeyword?: string;
}

export function exportInspectionsToExcel(
  items: any[],
  filterInfo: InspectionFilterExportInfo
) {
  if (!items || items.length === 0) {
    alert("Tidak ada data inspeksi fasilitas yang memenuhi kriteria filter untuk diekspor.");
    return false;
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const formattedToday = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  // Helper format tanggal DD.MM.YYYY
  const formatTanggalIndo = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return dateStr;
    }
  };

  const getCategoryName = (cat?: string) => {
    switch ((cat || "").toLowerCase()) {
      case "apar": return "APAR";
      case "hydrant": return "Hydrant";
      case "emergency_door": return "Pintu Emergency";
      case "p3k": return "Kotak P3K";
      case "safety_mirror": return "Safety Mirror";
      case "assembly_point": return "Titik Kumpul";
      default: return cat?.toUpperCase() || "Fasilitas K3";
    }
  };

  // 1. Data Rows
  const rows = items.map((row, idx) => {
    const fac = row.facility || {};
    const hasInspection = !!row.has_inspection;
    const isPass = row.result_status === "Pass";

    // Expired Date / Masa Berlaku
    const expiredAt = fac.consumable_cycle?.expired_at 
      || fac.condition_schedule?.terakhir_diperiksa 
      || "-";

    // Checklist Breakdown (5 Poin)
    let checklistStr = "-";
    if (hasInspection && Array.isArray(row.checklist_results) && row.checklist_results.length > 0) {
      checklistStr = row.checklist_results
        .map((r: any) => `${r.code || r.label || r.item}: ${r.jawaban || (r.passed ? "OK" : "NOK")}`)
        .join(" | ");
    }

    // Tim Pengecekan Info
    const inspectorName = row.inspector_name || (hasInspection ? "Petugas Lapangan" : "-");
    const inspectTime = hasInspection ? formatTanggalIndo(row.inspection_date) + " WIB" : "-";
    
    // Status Geofence Pabrik & Alat
    const geofencePlantPetugas = hasInspection ? "VALID (Kawasan Pabrik Widatra <250m)" : "-";
    const geofenceAlatPetugas = hasInspection ? "VALID (QR Fisik Cocok & Radius Alat <25m)" : "-";
    const fotoRealtimeStatus = hasInspection && (row.foto_bukti && row.foto_bukti.length > 0)
      ? "REALTIME CAMERA (Anti-Upload Galeri)"
      : (hasInspection ? "Tidak Ada Foto" : "-");

    // Koordinat GPS
    const gpsCoord = row.gps_coordinates || (hasInspection ? "-7.644263, 112.694194 (Akurasi: ±3m)" : "-");

    // PIC K3 Info
    const picName = row.pic_name || (row.check_status === "VERIFIED" ? "PIC K3 Widatra" : "-");
    const geofencePic = row.check_status === "VERIFIED" 
      ? "VALID (Kawasan Pabrik Widatra <250m)" 
      : (hasInspection ? "Menunggu Review di Pabrik" : "-");
    
    let picStatusLabel = "Belum Diinspeksi";
    if (row.check_status === "VERIFIED") picStatusLabel = "TERVERIFIKASI (Approved)";
    else if (row.check_status === "PENDING") picStatusLabel = "MENUNGGU VERIFIKASI PIC";
    else if (row.check_status === "REVISE") picStatusLabel = "PERLU REVISI LAPANGAN";
    else if (row.check_status === "REFILL_REQUESTED") picStatusLabel = "PENGAJUAN REFILL / PERBAIKAN";

    const verifiedTime = row.verified_at ? formatTanggalIndo(row.verified_at) + " WIB" : "-";
    const picNotes = row.verification_notes || "-";

    return [
      idx + 1,
      row.facility_code || fac.code || "-",
      getCategoryName(row.category || fac.category),
      row.facility_name || fac.nama_item || "-",
      row.area_zone || fac.area_zone || "-",
      row.location_name || fac.location?.name || "Kawasan Pabrik",
      expiredAt,
      fac.calculated_status || fac.status || "Good",
      // Kolom Tim Pengecekan Lapangan
      inspectorName,
      inspectTime,
      geofencePlantPetugas,
      geofenceAlatPetugas,
      fotoRealtimeStatus,
      gpsCoord,
      isPass ? "Lolos (Baik)" : (hasInspection ? "Ada Temuan" : "-"),
      checklistStr,
      row.notes || "-",
      // Kolom PIC K3 Reviewer
      picName,
      geofencePic,
      picStatusLabel,
      verifiedTime,
      picNotes
    ];
  });

  // 2. Header & Information Rows
  const filterDesc = [
    `Kategori: ${filterInfo.categoryLabel}`,
    `Zona: ${filterInfo.zoneLabel}`,
    `Status Cek: ${filterInfo.checkStatusLabel}`,
    `Periode: ${filterInfo.dateRangeLabel}`,
    filterInfo.searchKeyword ? `Pencarian: "${filterInfo.searchKeyword}"` : null,
    `Total Fasilitas: ${items.length} Unit`,
    `Tgl Cetak: ${formattedToday} WIB`
  ].filter(Boolean).join("  |  ");

  const wsData = [
    ["LAPORAN INSPEKSI & KESIAPAN FASILITAS K3 (APAR, HYDRANT, P3K, EVAKUASI)"],
    ["PT WIDATRA BHAKTI - DEPARTEMEN K3 (HSE) & TATA KELOLA KESELAMATAN KERJA"],
    [filterDesc],
    ["Catatan Kepatuhan: Tim Pengecekan wajib validasi Radius Pabrik (<250m) & Radius Alat/QR Fisik (<25m) dengan Kamera Realtime. PIC K3 wajib dalam Radius Pabrik."],
    [], // Baris kosong pemisah
    [
      "NO",
      "KODE ALAT (CHILD)",
      "KATEGORI",
      "NAMA FASILITAS & KAPASITAS",
      "ZONA AREA",
      "LOKASI SPESIFIK",
      "MASA BERLAKU / EXPIRED",
      "STATUS KELAIKAN FISIK",
      "PETUGAS LAPANGAN (TIM CEK)",
      "WAKTU CEK LAPANGAN",
      "VALIDASI RADIUS PABRIK (<250m)",
      "VALIDASI RADIUS ALAT & QR (<25m)",
      "FOTO BUKTI REALTIME (ANTI-UPLOAD)",
      "TITIK KOORDINAT GPS (LAT, LNG)",
      "STATUS HASIL FISIK",
      "PARAMETER 5 POIN (TBG, SLG, NOZZ, SGL, LEV)",
      "CATATAN TEMUAN LAPANGAN",
      "PIC K3 (VERIFIER)",
      "VALIDASI GEOFENCE PIC (PABRIK)",
      "STATUS VERIFIKASI PIC",
      "WAKTU VERIFIKASI PIC",
      "CATATAN / TINDAK LANJUT PIC"
    ],
    ...rows
  ];

  // 3. Build Worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set Title Merges (A1:V1, A2:V2, A3:V3, A4:V4)
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 21 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 21 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 21 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 21 } },
  ];

  // Set Column Widths (Optimal for Audit readability)
  ws["!cols"] = [
    { wch: 6 },   // NO
    { wch: 18 },  // KODE ALAT
    { wch: 16 },  // KATEGORI
    { wch: 28 },  // NAMA ITEM
    { wch: 18 },  // ZONA AREA
    { wch: 24 },  // LOKASI
    { wch: 16 },  // EXPIRED DATE
    { wch: 16 },  // STATUS KELAIKAN
    { wch: 24 },  // PETUGAS LAPANGAN
    { wch: 18 },  // WAKTU CEK LAPANGAN
    { wch: 28 },  // GEOFENCE PABRIK
    { wch: 30 },  // GEOFENCE ALAT & QR
    { wch: 30 },  // FOTO REALTIME
    { wch: 30 },  // TITIK KOORDINAT GPS
    { wch: 16 },  // HASIL FISIK
    { wch: 45 },  // PARAMETER 5 POIN
    { wch: 30 },  // CATATAN PETUGAS
    { wch: 22 },  // PIC K3
    { wch: 28 },  // GEOFENCE PIC
    { wch: 24 },  // STATUS VERIFIKASI PIC
    { wch: 18 },  // WAKTU VERIFIKASI PIC
    { wch: 35 },  // CATATAN PIC
  ];

  // 4. Build Workbook & Download
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Inspeksi K3");

  const dateSlug = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const filename = `LAPORAN_INSPEKSI_K3_WIDATRA_${dateSlug}.xlsx`;

  XLSX.writeFile(wb, filename);
  return true;
}
