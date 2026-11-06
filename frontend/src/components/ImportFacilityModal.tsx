import { useState, useRef, ChangeEvent, DragEvent } from "react";
import * as XLSX from "xlsx";
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Database,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { downloadFacilityExcelTemplate } from "@/utils/excelTemplate";

interface ImportFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedFacilityRow {
  rowIndex: number;
  code: string;
  category: string;
  nama_item: string;
  tipe_item: "CONSUMABLE" | "KONDISI";
  location_name: string;
  area_zone: string;
  expired_at?: string;
  media_tipe?: string;
  kapasitas_berat?: string;
  merk?: string;
  interval_pemeriksaan_hari?: number;
  latitude?: number;
  longitude?: number;
  isValid: boolean;
  validationError?: string;
}

export function ImportFacilityModal({ isOpen, onClose, onSuccess }: ImportFacilityModalProps) {
  const [step, setStep] = useState<"UPLOAD" | "PREVIEW" | "SUCCESS">("UPLOAD");
  const [fileName, setFileName] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<ParsedFacilityRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    updated: number;
    total: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep("UPLOAD");
    setFileName("");
    setParsedRows([]);
    setErrorMessage(null);
    setImportResult(null);
    setLoading(false);
    setSubmitting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // 1. Generate & Download Template Universal .xlsx dengan Desain Profesional
  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await downloadFacilityExcelTemplate();
    } catch (err: any) {
      console.error("Gagal men-generate template Excel:", err);
      setErrorMessage(err.message || "Gagal mengunduh template Excel fasilitas K3");
    } finally {
      setLoading(false);
    }
  };

  // 2. Parse Excel File
  const parseExcel = async (file: File) => {
    setLoading(true);
    setErrorMessage(null);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const firstSheetName = wb.SheetNames[0];
      const ws = wb.Sheets[firstSheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (rows.length < 2) {
        throw new Error("File Excel kosong atau tidak memiliki baris data.");
      }

      // Deteksi dinamis posisi baris header (mencakup baris 0 s/d 9)
      // Mendukung file template ber-banner corporate (header di baris 4) maupun tabel polos (baris 0/1)
      let headerRowIdx = -1;
      let headerRow: string[] = [];

      for (let r = 0; r < Math.min(10, rows.length); r++) {
        const candidate = (rows[r] || []).map((h: any) => String(h || "").trim().toLowerCase());
        const hasCode = candidate.some((h: string) => ["kode", "code", "no unit", "no_unit"].some(alias => h.includes(alias)));
        const hasCatOrName = candidate.some((h: string) => ["kategori", "category", "nama", "name", "deskripsi"].some(alias => h.includes(alias)));
        if (hasCode && hasCatOrName) {
          headerRowIdx = r;
          headerRow = candidate;
          break;
        }
      }

      // Fallback: cari baris yang minimal mengandung kolom kode
      if (headerRowIdx === -1) {
        for (let r = 0; r < Math.min(10, rows.length); r++) {
          const candidate = (rows[r] || []).map((h: any) => String(h || "").trim().toLowerCase());
          if (candidate.some((h: string) => ["kode", "code", "no unit", "no_unit"].some(alias => h.includes(alias)))) {
            headerRowIdx = r;
            headerRow = candidate;
            break;
          }
        }
      }

      if (headerRowIdx === -1) {
        throw new Error("Kolom 'Kode Fasilitas' tidak ditemukan pada baris header file Excel.");
      }
      
      const findColIdx = (aliases: string[]) => {
        return headerRow.findIndex((h: string) => aliases.some(alias => h.includes(alias)));
      };

      const codeIdx = findColIdx(["kode", "code", "no unit", "no_unit"]);
      const catIdx = findColIdx(["kategori", "category", "jenis alat", "jenis fasilitas"]);
      const nameIdx = findColIdx(["nama item", "nama fasilitas", "nama", "name", "deskripsi"]);
      const tipeIdx = findColIdx(["tipe item", "tipe", "type"]);
      const locIdx = findColIdx(["lokasi", "location", "gedung", "ruangan"]);
      const zoneIdx = findColIdx(["zona", "zone", "area"]);
      const expIdx = findColIdx(["expired", "kadaluarsa", "tgl exp", "refill", "masa berlaku"]);
      const mediaIdx = findColIdx(["media", "jenis media", "bahan"]);
      const capIdx = findColIdx(["kapasitas", "berat", "size"]);
      const merkIdx = findColIdx(["merk", "brand"]);
      const intIdx = findColIdx(["interval", "siklus", "jadwal"]);

      const parsed: ParsedFacilityRow[] = [];

      for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || row.every(c => c === null || c === undefined || String(c).trim() === "")) {
          continue; // skip blank rows
        }

        const rawCode = String(row[codeIdx] || "").trim();
        const rawCategory = catIdx !== -1 ? String(row[catIdx] || "").trim().toLowerCase() : "apar";
        const rawName = nameIdx !== -1 ? String(row[nameIdx] || "").trim() : "";
        const rawTipe = tipeIdx !== -1 ? String(row[tipeIdx] || "").trim().toUpperCase() : "";
        const rawLoc = locIdx !== -1 ? String(row[locIdx] || "").trim() : "Area Pabrik PT Widatra";
        const rawZone = zoneIdx !== -1 ? String(row[zoneIdx] || "").trim().toUpperCase() : "UMUM";
        const rawMedia = mediaIdx !== -1 ? String(row[mediaIdx] || "").trim() : "";
        const rawCap = capIdx !== -1 ? String(row[capIdx] || "").trim() : "";
        const rawMerk = merkIdx !== -1 ? String(row[merkIdx] || "").trim() : "";
        const rawInt = intIdx !== -1 ? parseInt(String(row[intIdx] || "30"), 10) : 30;

        // Normalize Category
        let normCategory = "apar";
        if (rawCategory.includes("hydrant") || rawCategory.includes("hidran")) normCategory = "hydrant";
        else if (rawCategory.includes("p3k") || rawCategory.includes("kotak")) normCategory = "p3k";
        else if (rawCategory.includes("pintu") || rawCategory.includes("darurat") || rawCategory.includes("emergency_door")) normCategory = "emergency_door";
        else if (rawCategory.includes("cermin") || rawCategory.includes("mirror") || rawCategory.includes("safety_mirror")) normCategory = "safety_mirror";
        else if (rawCategory.includes("titik") || rawCategory.includes("kumpul") || rawCategory.includes("assembly")) normCategory = "assembly_point";

        // Normalize Tipe Item
        let normTipe: "CONSUMABLE" | "KONDISI" = (normCategory === "apar" || normCategory === "p3k") ? "CONSUMABLE" : "KONDISI";
        if (rawTipe === "CONSUMABLE" || rawTipe === "KONDISI") {
          normTipe = rawTipe;
        }

        // Normalize Zone
        let normZone = "UMUM";
        if (rawZone.includes("FACTORY 1") || rawZone === "F1") normZone = "FACTORY 1";
        else if (rawZone.includes("FACTORY 2") || rawZone.includes("WORKSHOP") || rawZone === "F2") normZone = "FACTORY 2 & WORKSHOP";
        else if (rawZone.includes("WARE") || rawZone.includes("GUDANG")) normZone = "WARE HOUSE";

        // Normalize Expired Date
        let expDateStr: string | undefined = undefined;
        if (expIdx !== -1 && row[expIdx]) {
          const val = row[expIdx];
          if (val instanceof Date) {
            expDateStr = val.toISOString().split("T")[0];
          } else if (typeof val === "string") {
            const trimmed = val.trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
              expDateStr = trimmed;
            } else {
              const d = new Date(trimmed);
              if (!isNaN(d.getTime())) {
                expDateStr = d.toISOString().split("T")[0];
              }
            }
          } else if (typeof val === "number") {
            // Excel serial number
            const d = new Date(Math.round((val - 25569) * 86400 * 1000));
            if (!isNaN(d.getTime())) {
              expDateStr = d.toISOString().split("T")[0];
            }
          }
        }

        // Validation
        let isValid = true;
        let validationError: string | undefined = undefined;

        if (!rawCode) {
          isValid = false;
          validationError = "Kode fasilitas tidak boleh kosong";
        } else if (normTipe === "CONSUMABLE" && !expDateStr) {
          // If consumable without expired date, default to 1 year ahead with note
          const oneYear = new Date();
          oneYear.setFullYear(oneYear.getFullYear() + 1);
          expDateStr = oneYear.toISOString().split("T")[0];
        }

        parsed.push({
          rowIndex: i + 1,
          code: rawCode,
          category: normCategory,
          nama_item: rawName || `${normCategory.toUpperCase()} - ${rawCode}`,
          tipe_item: normTipe,
          location_name: rawLoc,
          area_zone: normZone,
          expired_at: expDateStr,
          media_tipe: rawMedia,
          kapasitas_berat: rawCap,
          merk: rawMerk,
          interval_pemeriksaan_hari: isNaN(rawInt) ? 30 : rawInt,
          isValid,
          validationError
        });
      }

      if (parsed.length === 0) {
        throw new Error("Tidak ada data fasilitas valid yang dapat dibaca dari file ini.");
      }

      setParsedRows(parsed);
      setStep("PREVIEW");
    } catch (err: any) {
      console.error("Excel parse error:", err);
      setErrorMessage(err.message || "Gagal memproses file Excel. Pastikan format file sesuai.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseExcel(e.target.files[0]);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseExcel(e.dataTransfer.files[0]);
    }
  };

  // 3. Submit Batch to Backend
  const handleSubmitImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMessage("Tidak ada data yang valid untuk diimport.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = validRows.map(r => ({
        code: r.code,
        category: r.category,
        nama_item: r.nama_item,
        tipe_item: r.tipe_item,
        location_name: r.location_name,
        area_zone: r.area_zone,
        expired_at: r.expired_at,
        interval_pemeriksaan_hari: r.interval_pemeriksaan_hari,
        specifications: {
          media_tipe: r.media_tipe,
          kapasitas_berat: r.kapasitas_berat,
          merk: r.merk,
        }
      }));

      const res = await api.importFacilities(payload);
      if (res?.success) {
        setImportResult({
          imported: res.data?.imported_count || 0,
          updated: res.data?.updated_count || 0,
          total: res.data?.total_processed || validRows.length,
          errors: res.data?.errors || []
        });
        setStep("SUCCESS");
        onSuccess();
      } else {
        throw new Error(res?.message || "Gagal mengimport data fasilitas.");
      }
    } catch (err: any) {
      console.error("Import submit error:", err);
      setErrorMessage(err?.response?.data?.message || err?.message || "Terjadi kesalahan saat mengimport ke database.");
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-linear-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Import Data Monitoring Fasilitas K3</h2>
              <p className="text-xs text-slate-300">
                Bulk upload universal untuk seluruh fasilitas (APAR, Hydrant, P3K, Emergency Door, Mirror, Assembly)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === "UPLOAD" && (
            <div className="space-y-5">
              {/* Template Download Card */}
              <div className="p-4 rounded-xl bg-linear-to-br from-emerald-50/70 to-teal-50/50 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
                    <Download size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">Belum memiliki format file?</h3>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Gunakan template resmi universal dengan contoh data semua 6 jenis fasilitas keselamatan K3.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Download size={14} />
                  <span>Download Template Excel</span>
                </button>
              </div>

              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-3",
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/60 scale-[0.99]"
                    : "border-slate-300 hover:border-emerald-400 bg-slate-50/60 hover:bg-slate-50"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-emerald-600">
                  {loading ? (
                    <RefreshCw size={26} className="animate-spin text-emerald-600" />
                  ) : (
                    <Upload size={26} />
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {loading ? "Membaca & Memvalidasi File Excel..." : "Klik atau seret file Excel ke area ini"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Mendukung format file <strong className="text-slate-700">.xlsx</strong>, <strong className="text-slate-700">.xls</strong>, atau <strong className="text-slate-700">.csv</strong>
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 shadow-2xs">
                  Universal: APAR, Hydrant, P3K, Emergency Door, Mirror, Assembly
                </span>
              </div>

              {/* Feature Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Auto-Sync Kode & Lokasi</span>
                    Data dengan kode lama otomatis diperbarui, data baru ditambahkan.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Auto-Generate QR Code</span>
                    Sistem otomatis menerbitkan ID QR unik yang langsung siap dicetak sticker.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Siklus Consumable vs Kondisi</span>
                    Pemisahan otomatis expiry APAR/P3K vs interval pengecekan fisik.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATION */}
          {step === "PREVIEW" && (
            <div className="space-y-4">
              {/* Summary Stats Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">File:</span>
                  <span className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {fileName}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="px-2.5 py-1 rounded-full font-bold bg-slate-200 text-slate-800">
                    Total: {parsedRows.length} Baris
                  </span>
                  <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Valid: {validCount}
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full font-bold bg-red-100 text-red-800 border border-red-300">
                      Error: {invalidCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10 backdrop-blur-xs">
                      <tr>
                        <th className="px-3 py-2.5 w-12 text-center">No</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5">Kode Alat</th>
                        <th className="px-3 py-2.5">Kategori</th>
                        <th className="px-3 py-2.5">Nama Fasilitas</th>
                        <th className="px-3 py-2.5">Lokasi & Zona</th>
                        <th className="px-3 py-2.5">Expired / Interval</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row) => (
                        <tr 
                          key={row.rowIndex}
                          className={cn(
                            "hover:bg-slate-50/80 transition-colors",
                            !row.isValid && "bg-red-50/50"
                          )}
                        >
                          <td className="px-3 py-2.5 text-center text-slate-500 font-mono">
                            {row.rowIndex}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 size={12} /> Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200" title={row.validationError}>
                                <AlertTriangle size={12} /> Error
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-bold font-mono text-slate-900">
                            {row.code}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-block px-2 py-0.5 rounded-md font-bold text-[10px] uppercase bg-slate-100 text-slate-700">
                              {row.category}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-800">
                            {row.nama_item}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="text-slate-800 font-medium">{row.location_name}</div>
                            <span className="text-[10px] text-slate-500 font-bold">{row.area_zone}</span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-700">
                            {row.tipe_item === "CONSUMABLE" ? (
                              <span className="text-emerald-700 font-medium">Exp: {row.expired_at}</span>
                            ) : (
                              <span className="text-blue-700 font-medium">Setiap {row.interval_pemeriksaan_hari} hr</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === "SUCCESS" && importResult && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs border-2 border-emerald-200">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Import Fasilitas K3 Berhasil!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  Data fasilitas keselamatan telah berhasil disinkronisasi ke dalam database operasional HSE.
                </p>
              </div>

              <div className="inline-flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Fasilitas Baru</span>
                  <span className="text-base font-black text-emerald-600">+{importResult.imported}</span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <span className="text-slate-500 block">Fasilitas Diperbarui</span>
                  <span className="text-base font-black text-blue-600">{importResult.updated}</span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <span className="text-slate-500 block">Total Diproses</span>
                  <span className="text-base font-black text-slate-900">{importResult.total}</span>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="max-w-md mx-auto text-left p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold block mb-1">Catatan Baris Dilewati:</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {importResult.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {step === "UPLOAD" ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <div className="text-xs text-slate-500 font-medium hidden sm:block">
                Pilih file Excel untuk melanjutkan ke tahap verifikasi
              </div>
            </>
          ) : step === "PREVIEW" ? (
            <>
              <button
                type="button"
                onClick={() => setStep("UPLOAD")}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Ganti File Excel
              </button>
              <button
                type="button"
                onClick={handleSubmitImport}
                disabled={submitting || validCount === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <Database size={14} />
                    <span>Simpan {validCount} Fasilitas ke Database</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Tutup & Tampilkan Data
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
