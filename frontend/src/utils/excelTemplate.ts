import ExcelJS from "exceljs";

/**
 * Utility untuk men-generate file Template Excel Fasilitas K3 PT Widatra Bhakti
 * dengan desain profesional, corporate color palette, header banner, zebra striping,
 * auto cell formatting, dan Excel Dropdown Validation (Kategori, Tipe, Zona).
 */
export async function generateFacilityExcelTemplate(): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "PT Widatra Bhakti - Tim K3 / HSE";
  wb.lastModifiedBy = "PT Widatra Bhakti - Tim K3 / HSE";
  wb.created = new Date();
  wb.modified = new Date();

  // =========================================================================
  // SHEET 1: DATA_FASILITAS_K3
  // =========================================================================
  const wsData = wb.addWorksheet("DATA_FASILITAS_K3", {
    views: [
      {
        showGridLines: true,
        state: "frozen",
        xSplit: 0,
        ySplit: 4, // Freeze row 1-4 sehingga header tetap terlihat saat scroll
      },
    ],
    properties: {
      tabColor: { argb: "FF107C41" }, // Excel Green
    },
  });

  // Lebar kolom yang proporsional & rapi
  wsData.columns = [
    { key: "code", width: 18 },       // A: Kode Fasilitas *
    { key: "category", width: 24 },   // B: Kategori Alat *
    { key: "name", width: 38 },       // C: Nama Item / Deskripsi *
    { key: "type", width: 18 },       // D: Tipe Item *
    { key: "location", width: 34 },   // E: Lokasi Gedung / Ruangan
    { key: "zone", width: 26 },       // F: Zona Area
    { key: "expired", width: 24 },    // G: Tanggal Expired (YYYY-MM-DD)
    { key: "media", width: 24 },      // H: Jenis Media / Bahan
    { key: "capacity", width: 20 },   // I: Kapasitas / Berat
    { key: "brand", width: 20 },      // J: Merk / Brand
    { key: "interval", width: 20 },   // K: Interval Cek (Hari)
  ];

  // -------------------------------------------------------------------------
  // ROW 1: CORPORATE TITLE BANNER
  // -------------------------------------------------------------------------
  wsData.mergeCells("A1:K1");
  const titleCell = wsData.getCell("A1");
  titleCell.value = "PT WIDATRA BHAKTI — FORMULIR IMPORT MASTER DATA FASILITAS & ALAT K3";
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" }, // Deep Navy Blue
  };
  titleCell.font = {
    name: "Calibri",
    size: 13,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  titleCell.alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  wsData.getRow(1).height = 36;

  // -------------------------------------------------------------------------
  // ROW 2: SUBTITLE / QUICK GUIDE
  // -------------------------------------------------------------------------
  wsData.mergeCells("A2:K2");
  const subtitleCell = wsData.getCell("A2");
  subtitleCell.value = "Petunjuk: Kolom bertanda (*) WAJIB diisi. Pilihan Kategori, Tipe, dan Zona dapat dipilih via Dropdown Excel. Format tgl: YYYY-MM-DD. Buka sheet 'PETUNJUK_PENGISIAN' untuk panduan lengkap.";
  subtitleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF0FDF4" }, // Emerald 50
  };
  subtitleCell.font = {
    name: "Calibri",
    size: 9.5,
    italic: true,
    color: { argb: "FF166534" }, // Emerald 800
  };
  subtitleCell.alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  subtitleCell.border = {
    bottom: { style: "thin", color: { argb: "FF86EFAC" } },
  };
  wsData.getRow(2).height = 24;

  // -------------------------------------------------------------------------
  // ROW 3: BLANK SEPARATOR
  // -------------------------------------------------------------------------
  wsData.getRow(3).height = 8;

  // -------------------------------------------------------------------------
  // ROW 4: TABLE HEADERS
  // -------------------------------------------------------------------------
  const headers = [
    "Kode Fasilitas *",
    "Kategori Alat *",
    "Nama Item / Deskripsi *",
    "Tipe Item *",
    "Lokasi Gedung / Ruangan",
    "Zona Area",
    "Tanggal Expired (YYYY-MM-DD)",
    "Jenis Media / Bahan",
    "Kapasitas / Berat",
    "Merk / Brand",
    "Interval Cek (Hari)",
  ];

  const headerRow = wsData.getRow(4);
  headerRow.height = 32;

  headers.forEach((h, idx) => {
    const colNumber = idx + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = h;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" }, // Solid Navy
    };
    cell.font = {
      name: "Calibri",
      size: 10,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF3B82F6" } },
      bottom: { style: "medium", color: { argb: "FF0F172A" } },
      left: { style: "thin", color: { argb: "FF3B82F6" } },
      right: { style: "thin", color: { argb: "FF3B82F6" } },
    };
  });

  // -------------------------------------------------------------------------
  // ROWS 5-11: HIGH-QUALITY SAMPLE DATA
  // -------------------------------------------------------------------------
  const sampleData = [
    [
      "APAR-001",
      "apar",
      "APAR Powder 6kg Ruang Server",
      "CONSUMABLE",
      "Gedung Kantor Lt 2",
      "UMUM",
      "2027-11-15",
      "POWDER",
      "6 KG",
      "YAMATO",
      30,
    ],
    [
      "APAR-002",
      "apar",
      "APAR CO2 5kg Panel Listrik Utama",
      "CONSUMABLE",
      "Gardu Listrik Factory 1",
      "FACTORY 1",
      "2027-08-20",
      "CO2",
      "5 KG",
      "CHUBB",
      30,
    ],
    [
      "HYD-01",
      "hydrant",
      "Hydrant Pillar Depan Pos 1",
      "KONDISI",
      "Halaman Depan Pos Satpam",
      "UMUM",
      "",
      "AIR TEKANAN TINGGI",
      "-",
      "APPON",
      30,
    ],
    [
      "P3K-01",
      "p3k",
      "Kotak P3K Tipe A Ruang Produksi",
      "CONSUMABLE",
      "Area Produksi Sterile",
      "FACTORY 1",
      "2027-05-10",
      "OBAT STANDAR TIPE A",
      "1 KOTAK",
      "ONEMED",
      30,
    ],
    [
      "EMG-01",
      "emergency_door",
      "Pintu Darurat Koridor Barat",
      "KONDISI",
      "Koridor Pabrik 2",
      "FACTORY 2 & WORKSHOP",
      "",
      "FIRE RATED STEEL",
      "-",
      "BOSTINCO",
      30,
    ],
    [
      "MIR-01",
      "safety_mirror",
      "Cermin Tikungan Loading Dock",
      "KONDISI",
      "Loading Dock Gudang Bahan Baku",
      "WARE HOUSE",
      "",
      "CONVEX ACRYLIC 80CM",
      "-",
      "KRISBOW",
      30,
    ],
    [
      "AP-01",
      "assembly_point",
      "Titik Kumpul Lapangan Parkir",
      "KONDISI",
      "Lapangan Parkir Karyawan Depan",
      "UMUM",
      "",
      "RAMBU SIGNAGE HIJAU",
      "-",
      "STANDAR K3",
      30,
    ],
  ];

  sampleData.forEach((rowVals, rIdx) => {
    const rowNumber = 5 + rIdx;
    const row = wsData.getRow(rowNumber);
    row.height = 22;

    const isEven = rIdx % 2 === 0;
    const rowBgColor = isEven ? "FFFFFFFF" : "FFF8FAFC"; // Clean zebra striping

    rowVals.forEach((val, cIdx) => {
      const colNumber = cIdx + 1;
      const cell = row.getCell(colNumber);
      cell.value = val;

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowBgColor },
      };

      cell.font = {
        name: "Calibri",
        size: 10,
        color: { argb: "FF1E293B" }, // Slate 800
      };

      // Alignment khusus per jenis data
      // Kolom C (Nama Item) dan Kolom E (Lokasi): Rata Kiri
      // Sisanya: Rata Tengah
      if (colNumber === 3 || colNumber === 5) {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }

      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  // -------------------------------------------------------------------------
  // EXCEL DATA VALIDATIONS (DROPDOWNS PADA KOLOM B, D, F)
  // -------------------------------------------------------------------------
  for (let r = 5; r <= 100; r++) {
    // Dropdown Kategori (Kolom B)
    wsData.getCell(`B${r}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"apar,hydrant,p3k,emergency_door,safety_mirror,assembly_point"'],
      showErrorMessage: true,
      errorTitle: "Kategori Tidak Valid",
      error: "Pilih salah satu dari: apar, hydrant, p3k, emergency_door, safety_mirror, assembly_point",
    };

    // Dropdown Tipe Item (Kolom D)
    wsData.getCell(`D${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"CONSUMABLE,KONDISI"'],
      showErrorMessage: true,
      errorTitle: "Tipe Item Tidak Valid",
      error: "Pilih CONSUMABLE (memiliki masa kadaluarsa) atau KONDISI (inspeksi fisik berkala)",
    };

    // Dropdown Zona Area (Kolom F)
    wsData.getCell(`F${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"UMUM,FACTORY 1,FACTORY 2 & WORKSHOP,WARE HOUSE"'],
      showErrorMessage: true,
      errorTitle: "Zona Tidak Valid",
      error: "Pilih salah satu: UMUM, FACTORY 1, FACTORY 2 & WORKSHOP, WARE HOUSE",
    };
  }

  // =========================================================================
  // SHEET 2: PETUNJUK_PENGISIAN
  // =========================================================================
  const wsGuide = wb.addWorksheet("PETUNJUK_PENGISIAN", {
    views: [{ showGridLines: true }],
    properties: {
      tabColor: { argb: "FFD97706" }, // Amber tab
    },
  });

  wsGuide.columns = [
    { width: 6 },  // A: No
    { width: 26 }, // B: Nama Kolom / Kategori
    { width: 16 }, // C: Status
    { width: 34 }, // D: Format / Pilihan Valid
    { width: 28 }, // E: Contoh Nilai
    { width: 44 }, // F: Penjelasan & Keterangan
  ];

  // Header Title
  wsGuide.mergeCells("A1:F1");
  const gTitle = wsGuide.getCell("A1");
  gTitle.value = "PANDUAN LENGKAP & KETENTUAN IMPORT FASILITAS K3 — PT WIDATRA BHAKTI";
  gTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" }, // Slate 900
  };
  gTitle.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
  gTitle.alignment = { vertical: "middle", horizontal: "center" };
  wsGuide.getRow(1).height = 34;

  wsGuide.mergeCells("A2:F2");
  const gSubtitle = wsGuide.getCell("A2");
  gSubtitle.value = "Sistem Manajemen K3 & Lingkungan PT Widatra Bhakti — Standard Operating Procedure (SOP) Master Data";
  gSubtitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F5F9" },
  };
  gSubtitle.font = { name: "Calibri", size: 9.5, italic: true, color: { argb: "FF475569" } };
  gSubtitle.alignment = { vertical: "middle", horizontal: "center" };
  wsGuide.getRow(2).height = 22;

  wsGuide.getRow(3).height = 10;

  // Section 1 Header: Kolom Master Data
  wsGuide.mergeCells("A4:F4");
  const sec1 = wsGuide.getCell("A4");
  sec1.value = "1. KETENTUAN FORMAT SETIAP KOLOM (SHEET: DATA_FASILITAS_K3)";
  sec1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
  sec1.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
  sec1.alignment = { vertical: "middle", horizontal: "left" };
  wsGuide.getRow(4).height = 26;

  // Header Table Petunjuk
  const guideHeaders = ["No", "Nama Kolom", "Status", "Format / Nilai Valid", "Contoh Pengisian", "Keterangan & Catatan"];
  const ghRow = wsGuide.getRow(5);
  ghRow.height = 24;
  guideHeaders.forEach((gh, idx) => {
    const cell = ghRow.getCell(idx + 1);
    cell.value = gh;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } }; // Emerald 700
    cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF065F46" } },
      bottom: { style: "thin", color: { argb: "FF065F46" } },
      left: { style: "thin", color: { argb: "FF065F46" } },
      right: { style: "thin", color: { argb: "FF065F46" } },
    };
  });

  const guideRows = [
    [1, "Kode Fasilitas *", "WAJIB", "Teks unik (alfanumerik)", "APAR-001, HYD-01", "Identitas unik alat. Jika kode sudah ada, data lama otomatis diupdate."],
    [2, "Kategori Alat *", "WAJIB", "apar, hydrant, p3k, emergency_door, safety_mirror, assembly_point", "apar", "Wajib memilih dari dropdown. Huruf kecil semua tanpa spasi."],
    [3, "Nama Item / Deskripsi *", "WAJIB", "Teks bebas deskriptif", "APAR Powder 6kg Ruang Server", "Nama alat beserta ruangan atau fungsi spesifiknya."],
    [4, "Tipe Item *", "OPSIONAL", "CONSUMABLE atau KONDISI", "CONSUMABLE", "CONSUMABLE = punya masa berlaku. KONDISI = inspeksi berkala."],
    [5, "Lokasi Gedung / Ruangan", "OPSIONAL", "Teks bebas nama area", "Gedung Kantor Lt 2", "Lokasi penempatan fisik alat secara detail."],
    [6, "Zona Area", "OPSIONAL", "UMUM, FACTORY 1, FACTORY 2 & WORKSHOP, WARE HOUSE", "FACTORY 1", "Pilih 1 dari 4 zona area pabrik PT Widatra Bhakti."],
    [7, "Tanggal Expired", "OPSIONAL", "YYYY-MM-DD (Tahun-Bulan-Hari)", "2027-12-31", "Wajib diisi untuk tipe CONSUMABLE (tabung APAR & kotak P3K)."],
    [8, "Jenis Media / Bahan", "OPSIONAL", "Teks (POWDER, CO2, FOAM, AIR)", "POWDER", "Spesifikasi isi media pemadam atau bahan material."],
    [9, "Kapasitas / Berat", "OPSIONAL", "Teks (6 KG, 5 KG, 1 KOTAK)", "6 KG", "Kapasitas daya tampung alat."],
    [10, "Merk / Brand", "OPSIONAL", "Teks nama produsen / merk", "YAMATO, CHUBB, ONEMED", "Merk resmi tabung atau fasilitas."],
    [11, "Interval Cek (Hari)", "OPSIONAL", "Angka bulat (hari)", "30", "Siklus inspeksi berkala. Default otomatis: 30 hari."],
  ];

  guideRows.forEach((gr, idx) => {
    const rowNum = 6 + idx;
    const r = wsGuide.getRow(rowNum);
    r.height = 20;
    const isWajib = gr[2] === "WAJIB";
    const bg = idx % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";

    gr.forEach((val, cIdx) => {
      const cell = r.getCell(cIdx + 1);
      cell.value = val;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.font = { name: "Calibri", size: 9, color: { argb: "FF1E293B" } };

      if (cIdx === 0 || cIdx === 2) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }

      if (cIdx === 2 && isWajib) {
        cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: "FFDC2626" } }; // Red
      }

      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  // Section 2: Panduan Kategori
  const sec2RowIdx = 18;
  wsGuide.getRow(sec2RowIdx - 1).height = 10;
  wsGuide.mergeCells(`A${sec2RowIdx}:F${sec2RowIdx}`);
  const sec2 = wsGuide.getCell(`A${sec2RowIdx}`);
  sec2.value = "2. DAFTAR 6 KATEGORI FASILITAS K3 YANG DIDUKUNG SISTEM";
  sec2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
  sec2.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
  wsGuide.getRow(sec2RowIdx).height = 26;

  const catRows = [
    ["apar", "Alat Pemadam Api Ringan (Tabung Gas/Powder)", "CONSUMABLE", "Wajib isi Tanggal Expired untuk tracking refill."],
    ["hydrant", "Hydrant Pillar, Hydrant Box, Nozzle & Selang", "KONDISI", "Inspeksi fisik bulanan: tekanan bar, selang, valve."],
    ["p3k", "Kotak Obat P3K (Tipe A, B, C)", "CONSUMABLE", "Wajib cek masa kadaluarsa obat & kelengkapan isi."],
    ["emergency_door", "Pintu Darurat Kebakaran & Jalur Evakuasi", "KONDISI", "Inspeksi fisik: panic bar, penutup otomatis, clearance."],
    ["safety_mirror", "Cermin Tikungan Keselamatan (Blindspot)", "KONDISI", "Inspeksi fisik: kejernihan cermin, sudut pandang, korosi bracket."],
    ["assembly_point", "Titik Kumpul Evakuasi Luar Ruangan", "KONDISI", "Inspeksi fisik: papan rambu, bebas rintangan, pencahayaan."],
  ];

  catRows.forEach((cr, idx) => {
    const rowNum = sec2RowIdx + 1 + idx;
    const r = wsGuide.getRow(rowNum);
    r.height = 20;
    const bg = idx % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";

    wsGuide.mergeCells(`B${rowNum}:C${rowNum}`);
    wsGuide.mergeCells(`E${rowNum}:F${rowNum}`);

    r.getCell(1).value = `•`;
    r.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };

    const cCat = r.getCell(2);
    cCat.value = cr[0];
    cCat.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF1E3A8A" } };
    cCat.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };

    const cDesc = r.getCell(4);
    cDesc.value = cr[1];
    cDesc.font = { name: "Calibri", size: 9, color: { argb: "FF334155" } };
    cDesc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };

    const cTip = r.getCell(5);
    cTip.value = `${cr[2]} — ${cr[3]}`;
    cTip.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF047857" } };
    cTip.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
  });

  // Export buffer & return as Blob
  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Trigger download file Template_Monitoring_Fasilitas_K3_Widatra.xlsx di browser
 */
export async function downloadFacilityExcelTemplate(filename = "Template_Monitoring_Fasilitas_K3_Widatra.xlsx"): Promise<void> {
  const blob = await generateFacilityExcelTemplate();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
