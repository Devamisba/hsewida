import * as XLSX from "xlsx";

export interface FilterExportInfo {
  periodLabel: string;
  statusLabel: string;
  customDateRange?: string;
  searchKeyword?: string;
}

export function exportWorkPermitsToExcel(
  permits: any[],
  filterInfo: FilterExportInfo
) {
  if (!permits || permits.length === 0) {
    alert("Tidak ada data ijin kerja yang memenuhi kriteria filter untuk diekspor.");
    return false;
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const formattedToday = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  // Helper format tanggal DD.MM.YYYY
  const formatTanggalPapan = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // 1. Data Rows
  const rows = permits.map((p, idx) => {
    // Tanggal Ijin Kerja
    const tglIjin = formatTanggalPapan(p.mulaiKerja || p.createdAt || p.start_date);

    // Kontraktor & PIC (2 baris persis seperti di papan tulis)
    const company = (p.namaKontraktor || p.kontraktor || "PT Vendor").trim();
    const pic = (p.penanggungJawab || p.pic_name || "").trim();
    const phone = (p.noHpPJ || p.pic_phone || "").trim();

    let contractorCell = company;
    if (pic && pic !== "-") {
      contractorCell += `\n${pic}`;
      if (phone && phone !== "-") {
        contractorCell += ` (${phone})`;
      }
    }

    // Pekerjaan
    let pekerjaan = p.jenisPekerjaan || p.job_title || "-";
    if (p.requestType === "Perpanjangan") {
      pekerjaan += ` [Perpanjangan Ke-${p.extensionPhase || 1}]`;
    }

    // Lokasi
    const lokasi = p.lokasi || p.location?.name || "-";

    // No. Ijin & Status
    const noIjin = p.id || p.permit_number || "-";
    const status = p.status || "-";

    return [
      idx + 1,
      tglIjin,
      contractorCell,
      pekerjaan,
      lokasi,
      noIjin,
      status
    ];
  });

  // 2. Header & Information Rows
  const filterDesc = [
    `Periode: ${filterInfo.periodLabel}${filterInfo.customDateRange ? ` (${filterInfo.customDateRange})` : ""}`,
    `Status: ${filterInfo.statusLabel}`,
    filterInfo.searchKeyword ? `Pencarian: "${filterInfo.searchKeyword}"` : null,
    `Total Data: ${permits.length} Ijin Kerja`,
    `Tgl Cetak: ${formattedToday} WIB`
  ].filter(Boolean).join("  |  ");

  const wsData = [
    ["WORK PERMIT MONITORING"],
    ["PT WIDATRA BHAKTI - DEPARTEMEN K3 (HSE)"],
    [filterDesc],
    [], // Blank spacing row
    [
      "NO",
      "Tgl. Ijin Kerja",
      "Kontraktor External / Internal",
      "Pekerjaan",
      "Lokasi Kerja",
      "No. Ijin SIKA",
      "Status"
    ],
    ...rows
  ];

  // 3. Build Worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set Title Merge (A1:G1, A2:G2, A3:G3)
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
  ];

  // Set Column Widths (Auto-fit to content)
  ws["!cols"] = [
    { wch: 6 },   // NO
    { wch: 16 },  // Tgl. Ijin Kerja
    { wch: 38 },  // Kontraktor External / Internal
    { wch: 32 },  // Pekerjaan
    { wch: 24 },  // Lokasi Kerja
    { wch: 18 },  // No. Ijin SIKA
    { wch: 20 },  // Status
  ];

  // 4. Build Workbook & Download
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Work Permit Monitoring");

  const dateSlug = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const filename = `WORK_PERMIT_MONITORING_${dateSlug}.xlsx`;

  XLSX.writeFile(wb, filename);
  return true;
}
