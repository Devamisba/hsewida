import { useState, useEffect, useRef, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Camera, 
  ArrowLeft,
  Check,
  RotateCcw,
  X,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  ClipboardCheck,
  History,
  Inbox
} from "lucide-react";
import { api, SafetyFacility } from "@/services/api";
import { PLANT_CENTER, syncGeofenceFromSettingsMap } from "@/utils/facilityCoordinates";

type ViewMode = "CHOICE" | "PENGECEKAN";

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB";
  } catch {
    return dateStr;
  }
};

export default function AparScanPage() {
  const { code } = useParams<{ code: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facility, setFacility] = useState<SafetyFacility | null>(null);
  const [inspectionStatusLabel, setInspectionStatusLabel] = useState<string>("");
  const [isRefillQueue, setIsRefillQueue] = useState<boolean>(false);
  const [totalInspections, setTotalInspections] = useState<number>(0);

  // Current View Mode (CHOICE = Kartu & Riwayat Utama, PENGECEKAN = Form Lapangan)
  const [viewMode, setViewMode] = useState<ViewMode>("CHOICE");

  // --- FORM 1: Petugas HSE State ---
  const [petugasName, setPetugasName] = useState<string>("");
  const [tbg, setTbg] = useState<boolean>(true);
  const [slg, setSlg] = useState<boolean>(true);
  const [nozz, setNozz] = useState<boolean>(true);
  const [sgl, setSgl] = useState<boolean>(true);
  const [lev, setLev] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [submittingPetugas, setSubmittingPetugas] = useState<boolean>(false);
  const [petugasSubmitted, setPetugasSubmitted] = useState<boolean>(false);

  // --- Live Camera Elements (Realtime Only - No Gallery Upload) ---
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fetchAparData = async () => {
    if (!code) {
      setError("Kode tabung APAR tidak valid.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.getAparByScanCode(code);
      if (res.success && res.data) {
        setFacility(res.data.facility);
        setInspectionStatusLabel(res.data.inspection_status_label || "");
        setIsRefillQueue(!!res.data.is_refill_queue);
        setTotalInspections(res.data.total_inspections ?? res.data.facility?.inspections_count ?? (res.data.facility?.inspections?.length || 0));

        // If inspection was already submitted by petugas
        if (res.data.inspection_stage === "PETUGAS" || res.data.inspection_stage === "PETUGAS_SUBMITTED") {
          setPetugasSubmitted(true);
        }
      } else {
        setError(res.message || "Data APAR tidak ditemukan.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat informasi tabung APAR.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAparData();
    api.getSettings()
      .then(res => {
        if (res?.success && res.data?.map) {
          syncGeofenceFromSettingsMap(res.data.map);
        }
      })
      .catch(() => {});
  }, [code]);

  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  // --- BUTTON CLICKS FROM CHOICE MENU ---
  const handleSelectPengecekan = () => {
    setViewMode("PENGECEKAN");
  };

  // --- CAMERA HANDLERS (STRICT REALTIME ONLY - NO GALLERY UPLOAD) ---
  const startLiveCamera = async () => {
    setCameraError(null);

    // Ambil koordinat GPS saat kamera mulai dibuka
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentGps({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => {
          // Fallback ke koordinat default pabrik jika GPS browser ditolak
          setCurrentGps({
            lat: PLANT_CENTER.lat,
            lng: PLANT_CENTER.lng,
            accuracy: 5.0,
          });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

    try {
      setIsLiveCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setCameraError("Tidak dapat mengakses kamera. Pastikan izin kamera aktif pada browser.");
      setIsLiveCameraOpen(false);
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsLiveCameraOpen(false);
  };

  const takeSnapshotFromVideo = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const bannerHeight = Math.max(90, Math.floor(height * 0.22));

      // 2. Render Gradient Background hitam transparan di bagian bawah
      const gradient = ctx.createLinearGradient(0, height - bannerHeight, 0, height);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(0.3, "rgba(0, 0, 0, 0.75)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.94)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

      // 3. Render teks watermark digital resmi K3
      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " WIB";

      const latStr = currentGps ? currentGps.lat.toFixed(6) : "-7.644263";
      const lngStr = currentGps ? currentGps.lng.toFixed(6) : "112.694194";
      const accStr = currentGps ? `±${Math.round(currentGps.accuracy)}m` : "±3m";

      const fontSizePrimary = Math.max(15, Math.floor(width * 0.022));
      const fontSizeSecondary = Math.max(12, Math.floor(width * 0.016));

      ctx.fillStyle = "#fbbf24"; // Gold Amber
      ctx.font = `bold ${fontSizePrimary}px sans-serif`;
      ctx.fillText(`🏢 ${PLANT_CENTER.name.toUpperCase()}`, 20, height - bannerHeight + fontSizePrimary + 12);

      ctx.fillStyle = "#ffffff";
      ctx.font = `600 ${fontSizeSecondary}px sans-serif`;
      ctx.fillText(`🕒 ${dateStr}  |  📍 GPS: ${latStr}, ${lngStr} (${accStr})`, 20, height - bannerHeight + fontSizePrimary + fontSizeSecondary + 20);

      ctx.fillStyle = "#67e8f9"; // Cyan
      ctx.font = `500 ${fontSizeSecondary}px monospace`;
      ctx.fillText(`🏷️ Unit: ${facility?.code || code} (${facility?.area_zone || "Area Pabrik"})  |  📸 REALTIME CAMERA AUDIT`, 20, height - bannerHeight + fontSizePrimary + (fontSizeSecondary * 2) + 28);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setCapturedPhoto(dataUrl);
    }
    stopLiveCamera();
  };

  // --- SUBMIT FORM 1 (Petugas HSE) ---
  const handlePetugasSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code) return;

    if (!petugasName.trim()) {
      alert("Silakan ketik nama petugas pemeriksa.");
      return;
    }
    if (!notes.trim() || notes.trim().length < 3) {
      alert("Catatan / Keterangan temuan wajib diisi (minimal 3 karakter).");
      return;
    }

    setSubmittingPetugas(true);
    try {
      const payload = {
        inspector_name: petugasName.trim(),
        notes: notes.trim(),
        tbg,
        slg,
        nozz,
        sgl,
        lev,
        foto_bukti: capturedPhoto || undefined,
        latitude: currentGps?.lat,
        longitude: currentGps?.lng,
        accuracy: currentGps?.accuracy,
        is_plant_geofence_valid: true,
        is_facility_geofence_valid: true,
        is_camera_realtime: true,
      };

      const res = await api.submitPetugasInspection(code, payload);
      if (res.success) {
        setPetugasSubmitted(true);
        await fetchAparData();
        setNotes("");
      } else {
        alert(res.message || "Gagal menyimpan hasil inspeksi.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat menyimpan inspeksi.");
    } finally {
      setSubmittingPetugas(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      
      {/* Container Utama */}
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
        
        {/* Header Bersih */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">PT WIDATRA BHAKTI</div>
            <h1 className="text-sm font-bold text-slate-800">Pemeriksaan APAR</h1>
          </div>
          <Link
            to="/monitoring"
            className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition border border-slate-200"
          >
            Dashboard K3
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800 mb-2"></div>
            <div>Memuat data APAR {code}...</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 text-center text-xs space-y-4">
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">
              {error}
            </div>
            <Link
              to="/monitoring"
              className="inline-block text-xs font-semibold text-slate-900 underline"
            >
              Kembali ke Halaman Monitoring
            </Link>
          </div>
        )}

        {/* Konten Utama */}
        {!loading && !error && facility && (
          <div>
            
            {/* Kartu Identitas APAR Sederhana */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {facility.area_zone || "Zona Pabrik"}
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">
                    {facility.code}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {facility.location?.name || "Lokasi tidak tercatat"}
                  </div>
                </div>
                
                <div className="text-right text-xs">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    facility.calculated_status === "AMAN" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                      : "bg-rose-50 text-rose-700 border-rose-300"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${facility.calculated_status === "AMAN" ? "bg-emerald-500" : "bg-rose-500"}`} />
                    {facility.calculated_status === "AMAN" ? "Media Aman" : "Perlu Refill"}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    Exp: {facility.consumable_cycle?.expired_at || "-"}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200 flex justify-between">
                <span>Spesifikasi: <strong>{facility.specifications?.type || "Powder"} ({facility.specifications?.capacity || "3 Kg"})</strong></span>
                {isRefillQueue && <span className="text-amber-700 font-semibold">Antrean Refill</span>}
              </div>

              {/* Status Pemantauan Terkini */}
              {inspectionStatusLabel && (
                <div className={`mt-2.5 p-2.5 rounded-lg border text-xs ${
                  inspectionStatusLabel.toLowerCase().includes("aman") || inspectionStatusLabel.toLowerCase().includes("terverifikasi")
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-white border-slate-200 text-slate-800"
                }`}>
                  <span className="text-slate-500 text-[10px] block font-bold uppercase tracking-wider">Status Saat Ini:</span>
                  <span className="font-bold flex items-center gap-1.5 mt-0.5">
                    {inspectionStatusLabel.toLowerCase().includes("aman") || inspectionStatusLabel.toLowerCase().includes("terverifikasi") ? (
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    ) : (
                      <Clock size={13} className="text-amber-500 shrink-0" />
                    )}
                    <span>{inspectionStatusLabel}</span>
                  </span>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* VIEW 1: RINGKASAN FASILITAS, AKSI PEMERIKSAAN & RIWAYAT   */}
            {/* ======================================================== */}
            {viewMode === "CHOICE" && (
              <div className="p-4 sm:p-5 space-y-5">
                
                {/* 1. Tombol Tindakan Tunggal: Pemeriksaan Fisik Lapangan */}
                <div>
                  <button
                    type="button"
                    onClick={handleSelectPengecekan}
                    className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold text-center transition shadow-md cursor-pointer active:scale-98 flex items-center justify-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <ClipboardCheck size={20} />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-sm font-bold text-white">Mulai Pemeriksaan Lapangan</div>
                      <div className="text-[11px] font-normal text-slate-300">
                        Pemeriksaan fisik 5 parameter standar APAR oleh Petugas HSE
                      </div>
                    </div>
                  </button>
                </div>

                {/* 2. Informasi & Riwayat Inspeksi Objek Tersebut */}
                <div className="space-y-3 pt-1 border-t border-slate-200">
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-slate-600" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Riwayat & Kartu Kendali Inspeksi
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                      {totalInspections} Riwayat
                    </span>
                  </div>

                  {(!facility.inspections || facility.inspections.length === 0) ? (
                    <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                      <Inbox size={28} className="mx-auto text-slate-300 mb-1.5" />
                      <p className="text-xs font-semibold text-slate-700">Belum Ada Riwayat Inspeksi</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tabung ini belum memiliki catatan pemeriksaan. Silakan mulai pengecekan pertama melalui tombol di atas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {facility.inspections.map((insp: any, idx: number) => {
                        const inspector = insp.inspector_name || insp.inspector?.name || "Petugas Lapangan";
                        const pic = insp.pic_name || null;
                        const isVerified = insp.inspection_stage === "PIC_VERIFIED" || insp.verification_status === "VERIFIED";
                        const results = Array.isArray(insp.checklist_results) ? insp.checklist_results : [];
                        const isLatest = idx === 0;

                        return (
                          <div 
                            key={insp.id || idx}
                            className={`p-3.5 bg-white rounded-xl border text-xs space-y-2.5 transition ${
                              isLatest 
                                ? "border-emerald-300 shadow-xs ring-1 ring-emerald-500/20" 
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {/* Baris 1: Tanggal & Badge Verifikasi */}
                            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                                <Calendar size={13} className="text-slate-400" />
                                <span>{formatDateTime(insp.created_at || insp.inspection_date)}</span>
                                {isLatest && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                                    Inspeksi Terbaru
                                  </span>
                                )}
                              </div>

                              {isVerified ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 size={11} />
                                  Terverifikasi PIC
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock size={11} />
                                  Menunggu Verifikasi PIC
                                </span>
                              )}
                            </div>

                            {/* Baris 2: Pemeriksa & Verifikator */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-slate-400 block text-[10px]">Petugas Pemeriksa:</span>
                                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                                  <User size={12} className="text-slate-500 shrink-0" />
                                  <span className="truncate">{inspector}</span>
                                </span>
                              </div>

                              <div className={`p-2 rounded-lg border ${
                                isVerified ? "bg-emerald-50/50 border-emerald-100" : "bg-amber-50/50 border-amber-100"
                              }`}>
                                <span className="text-slate-400 block text-[10px]">Diverifikasi Oleh:</span>
                                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                                  <ShieldCheck size={12} className={`shrink-0 ${isVerified ? "text-emerald-600" : "text-amber-600"}`} />
                                  <span className="truncate">{pic || "Belum Diverifikasi"}</span>
                                </span>
                                {insp.verified_at && (
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {formatDateTime(insp.verified_at)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Baris 3: Parameter Fisik (5 Parameter) */}
                            {results.length > 0 && (
                              <div className="pt-0.5">
                                <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                                  Kondisi 5 Parameter Fisik:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {results.map((r: any, rIdx: number) => {
                                    const isPass = r.passed !== false && r.jawaban !== "Rusak" && r.jawaban !== "Karat / Rusak" && r.jawaban !== "Putus / Hilang";
                                    return (
                                      <span
                                        key={rIdx}
                                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                          isPass 
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                            : "bg-rose-50 text-rose-700 border-rose-200"
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

                            {/* Baris 4: Catatan Petugas */}
                            {insp.notes && (
                              <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                                <span className="font-semibold text-slate-700">Catatan Petugas: </span>
                                <span className="italic">"{insp.notes}"</span>
                              </div>
                            )}

                            {/* Baris 5: Catatan Verifikasi PIC */}
                            {insp.verification_notes && (
                              <div className="text-[11px] text-emerald-800 pt-0.5">
                                <span className="font-semibold">Catatan PIC: </span>
                                <span className="italic">"{insp.verification_notes}"</span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Footer Info Jumlah Riwayat sesuai permintaan pengguna */}
                      {totalInspections > 5 ? (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-600 font-medium">
                          Menampilkan 1 - 5 dari {totalInspections} riwayat inspeksi
                        </div>
                      ) : totalInspections > 0 ? (
                        <div className="p-2 bg-slate-50/60 border border-slate-100 rounded-lg text-center text-[11px] text-slate-500 font-medium">
                          Menampilkan {totalInspections} riwayat inspeksi
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 2: FORM PENGECEKAN (PETUGAS LAPANGAN)               */}
            {/* ======================================================== */}
            {viewMode === "PENGECEKAN" && (
              <div className="p-5 space-y-4">
                
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("CHOICE");
                    setPetugasSubmitted(false);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Kembali ke kartu tabung & riwayat
                </button>

                <div className="border-b border-slate-200 pb-2">
                  <h2 className="text-sm font-bold text-slate-900">Formulir Pengecekan Lapangan</h2>
                  <p className="text-xs text-slate-500">Pemeriksaan fisik 5 parameter standar APAR</p>
                </div>

                <form onSubmit={handlePetugasSubmit} className="space-y-4 text-xs">
                  
                  {/* Nama Petugas */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      Nama Petugas Pemeriksa *
                    </label>
                    <input
                      type="text"
                      required
                      value={petugasName}
                      onChange={(e) => setPetugasName(e.target.value)}
                      placeholder="Ketik nama lengkap pemeriksa..."
                      disabled={petugasSubmitted}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
                    />
                  </div>

                  {/* 5 Parameter Fisik APAR */}
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <div className="font-semibold text-slate-700">Pemeriksaan Fisik 5 Parameter APAR:</div>
                    
                    {/* 1. Kondisi Tabung */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">1. Fisik Tabung</span>
                        <span className="text-[11px] text-slate-500">Bebas karat, penyok & keropos</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={petugasSubmitted}
                          onClick={() => setTbg(true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            tbg 
                              ? "bg-emerald-600 text-white shadow-xs" 
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-medium"
                          }`}
                        >
                          Baik
                        </button>
                        <button
                          type="button"
                          disabled={petugasSubmitted}
                          onClick={() => setTbg(false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            !tbg 
                              ? "bg-rose-600 text-white shadow-xs" 
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-medium"
                          }`}
                        >
                          Rusak
                        </button>
                      </div>
                    </div>

                    {/* 2. Selang (Hose) */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">2. Selang (Hose)</span>
                        <span className="text-[11px] text-slate-500">Fleksibel, tidak retak/getas</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={petugasSubmitted}
                          onClick={() => setSlg(true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            slg 
                              ? "bg-emerald-600 text-white shadow-xs" 
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-medium"
                          }`}
                        >
                          Baik
                        </button>
                        <button
                          type="button"
                          disabled={petugasSubmitted}
                          onClick={() => setSlg(false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            !slg 
                              ? "bg-rose-600 text-white shadow-xs" 
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-medium"
                          }`}
                        >
                          Rusak
                        </button>
                      </div>
                    </div>

                    {/* 3. Nozzle */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">3. Corong / Nozzle</span>
                        <span className="text-[11px] text-slate-500">Bersih, tidak tersumbat/buntu</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={petugasSubmitted}
                          onClick={() => setNozz(true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            nozz 
                              ? "bg-emerald-600 text-white shadow-xs" 
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-medium"
                          }`}
                        >
                          Baik
                        </button>
                        <button
                          type="button"
                          disabled={petugasSubmitted}
                          onClick={() => setNozz(false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            !nozz 
                              ? "bg-rose-600 text-white shadow-xs" 
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-medium"
                          }`}
                        >
                          Rusak
                        </button>
                      </div>
                    </div>

                    {/* 4. Segel & Pin */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">4. Segel & Safety Pin</span>
                        <span className="text-[11px] text-slate-500">Kawat/plastik segel masih utuh</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={petugasSubmitted}
                          onClick={() => setSgl(true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            sgl 
                              ? "bg-emerald-600 text-white shadow-xs" 
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-medium"
                          }`}
                        >
                          Utuh
                        </button>
                        <button
                          type="button"
                          disabled={petugasSubmitted}
                          onClick={() => setSgl(false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            !sgl 
                              ? "bg-rose-600 text-white shadow-xs" 
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-medium"
                          }`}
                        >
                          Putus
                        </button>
                      </div>
                    </div>

                    {/* 5. Lever & Pressure Gauge */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">5. Indikator Tekanan</span>
                        <span className="text-[11px] text-slate-500">Jarum berada di zona hijau</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={petugasSubmitted}
                          onClick={() => setLev(true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            lev 
                              ? "bg-emerald-600 text-white shadow-xs" 
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-medium"
                          }`}
                        >
                          Hijau
                        </button>
                        <button
                          type="button"
                          disabled={petugasSubmitted}
                          onClick={() => setLev(false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            !lev 
                              ? "bg-rose-600 text-white shadow-xs" 
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-medium"
                          }`}
                        >
                          Merah
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Catatan / Keterangan Temuan Lapangan */}
                  <div className="space-y-1 border-t border-slate-200 pt-3">
                    <label className="block font-semibold text-slate-700">
                      Catatan / Temuan Lapangan *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Kondisi fisik bersih, jarum tekanan hijau, siap digunakan..."
                      disabled={petugasSubmitted}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
                    />
                  </div>

                  {/* Foto Lapangan Menggunakan Kamera Realtime */}
                  <div className="space-y-1.5 border-t border-slate-200 pt-3">
                    <label className="block font-semibold text-slate-700">
                      Foto Bukti Fisik Lapangan
                    </label>

                    {!capturedPhoto ? (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          disabled={petugasSubmitted}
                          onClick={startLiveCamera}
                          className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
                        >
                          <Camera size={15} /> Buka Kamera Realtime
                        </button>
                        <span className="text-[10px] text-slate-500 block text-center">
                          Otomatis menyematkan watermark resmi waktu & koordinat GPS
                        </span>
                        {cameraError && (
                          <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded">
                            {cameraError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative border border-slate-300 rounded-md overflow-hidden aspect-video max-h-52 bg-black shadow-inner">
                        <img src={capturedPhoto} alt="Bukti Pengecekan Realtime" className="w-full h-full object-contain" />
                        {!petugasSubmitted && (
                          <button
                            type="button"
                            onClick={() => {
                              setCapturedPhoto(null);
                              startLiveCamera();
                            }}
                            className="absolute bottom-2 right-2 bg-slate-900/90 hover:bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded flex items-center gap-1 shadow-md cursor-pointer"
                          >
                            <RotateCcw size={12} /> Ambil Ulang Foto
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button atau Status Menunggu Verifikasi */}
                  <div className="pt-2">
                    {petugasSubmitted ? (
                      <div className="space-y-2">
                        <div className="w-full py-3 px-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5">
                          <Check size={14} /> Hasil Pemeriksaan Berhasil Disimpan!
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setViewMode("CHOICE");
                            setPetugasSubmitted(false);
                          }}
                          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold text-center transition cursor-pointer"
                        >
                          Lihat Riwayat & Kartu Kendali
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={submittingPetugas}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-md text-xs font-semibold text-center transition cursor-pointer"
                      >
                        {submittingPetugas ? "Menyimpan data..." : "Simpan Hasil Pengecekan"}
                      </button>
                    )}
                  </div>

                </form>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Footer Minimalis */}
      <div className="mt-4 text-center text-xs text-slate-400">
        PT Widatra Bhakti • Health, Safety & Environment
      </div>

      {/* Kamera Fullscreen Sederhana */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4">
          <div className="flex items-center justify-between text-white z-10">
            <span className="text-xs font-medium">Kamera Lapangan</span>
            <button
              type="button"
              onClick={stopLiveCamera}
              className="p-1 rounded text-white hover:bg-white/20"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded"
            />
          </div>

          <div className="py-3 flex flex-col items-center gap-2 z-10">
            <button
              type="button"
              onClick={takeSnapshotFromVideo}
              className="w-14 h-14 rounded-full border-2 border-white bg-slate-800 text-white flex items-center justify-center active:scale-95 transition"
            >
              <Camera size={24} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
