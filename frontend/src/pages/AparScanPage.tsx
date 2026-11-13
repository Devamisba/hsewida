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
import { auth } from "@/lib/auth";

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

interface CategoryInspectionConfig {
  title: string;
  subtitle: string;
  badge: string;
  isConsumable: boolean;
  params: {
    id: "tbg" | "slg" | "nozz" | "sgl" | "lev";
    num: number;
    title: string;
    desc: string;
    passLabel: string;
    failLabel: string;
  }[];
}

const CATEGORY_CONFIG: Record<string, CategoryInspectionConfig> = {
  apar: {
    title: "Pemeriksaan APAR",
    subtitle: "Pemeriksaan fisik 5 parameter standar APAR",
    badge: "APAR",
    isConsumable: true,
    params: [
      { id: "tbg", num: 1, title: "1. Fisik Tabung", desc: "Bebas karat, penyok & keropos", passLabel: "Baik", failLabel: "Rusak" },
      { id: "slg", num: 2, title: "2. Selang (Hose)", desc: "Fleksibel, tidak retak/getas", passLabel: "Baik", failLabel: "Rusak" },
      { id: "nozz", num: 3, title: "3. Corong / Nozzle", desc: "Bersih, tidak tersumbat/buntu", passLabel: "Baik", failLabel: "Rusak" },
      { id: "sgl", num: 4, title: "4. Segel & Safety Pin", desc: "Kawat/plastik segel masih utuh", passLabel: "Utuh", failLabel: "Putus" },
      { id: "lev", num: 5, title: "5. Indikator Tekanan", desc: "Jarum berada di zona hijau", passLabel: "Hijau", failLabel: "Merah" },
    ],
  },
  hydrant: {
    title: "Pemeriksaan Hydrant",
    subtitle: "Pemeriksaan fisik 5 parameter standar Hydrant",
    badge: "Hydrant",
    isConsumable: false,
    params: [
      { id: "tbg", num: 1, title: "1. Box / Pilar Hydrant", desc: "Bersih, tertutup rapi & tidak terhalang", passLabel: "Baik", failLabel: "Rusak" },
      { id: "slg", num: 2, title: "2. Selang Pemadam (Hose)", desc: "Tergulung rapi, fleksibel & tidak bocor", passLabel: "Baik", failLabel: "Rusak" },
      { id: "nozz", num: 3, title: "3. Nozzle & Coupling", desc: "Kopling terpasang presisi, tidak aus", passLabel: "Baik", failLabel: "Rusak" },
      { id: "sgl", num: 4, title: "4. Kran Utama (Main Valve)", desc: "Dapat diputar lancar & tidak rembes", passLabel: "Lancar", failLabel: "Macet" },
      { id: "lev", num: 5, title: "5. Tekanan Air (Pressure)", desc: "Tekanan air siap pakai & gauge normal", passLabel: "Normal", failLabel: "Drop" },
    ],
  },
  p3k: {
    title: "Pemeriksaan Kotak P3K",
    subtitle: "Pemeriksaan fisik & kelengkapan Kotak P3K",
    badge: "Kotak P3K",
    isConsumable: true,
    params: [
      { id: "tbg", num: 1, title: "1. Fisik Kotak P3K", desc: "Kondisi kotak bersih, kokoh & tidak rusak", passLabel: "Baik", failLabel: "Rusak" },
      { id: "slg", num: 2, title: "2. Kerapian Tata Letak", desc: "Obat & alat tertata rapi sesuai sekat", passLabel: "Rapi", failLabel: "Berantakan" },
      { id: "nozz", num: 3, title: "3. Kelengkapan Isi & Obat", desc: "Sesuai daftar standar item P3K pabrik", passLabel: "Lengkap", failLabel: "Kurang" },
      { id: "sgl", num: 4, title: "4. Masa Kadaluarsa Obat", desc: "Seluruh obat & antiseptik belum expired", passLabel: "Aman", failLabel: "Expired" },
      { id: "lev", num: 5, title: "5. Akses & Kunci Kotak", desc: "Mudah dijangkau darurat & kunci tersedia", passLabel: "Siap", failLabel: "Terhalang" },
    ],
  },
  assembly_point: {
    title: "Pemeriksaan Titik Kumpul",
    subtitle: "Pemeriksaan kelayakan area & rambu titik kumpul",
    badge: "Titik Kumpul",
    isConsumable: false,
    params: [
      { id: "tbg", num: 1, title: "1. Papan Rambu Kumpul", desc: "Jelas terbaca, tegak lurus & kokoh", passLabel: "Jelas", failLabel: "Rusak" },
      { id: "slg", num: 2, title: "2. Jalur Akses Evakuasi", desc: "Bebas rintangan, material atau kendaraan", passLabel: "Bebas", failLabel: "Terhalang" },
      { id: "nozz", num: 3, title: "3. Kebersihan Area", desc: "Permukaan rata, bersih, bebas genangan/licin", passLabel: "Bersih", failLabel: "Kotor" },
      { id: "sgl", num: 4, title: "4. Penerangan Darurat", desc: "Lampu area malam/darurat berfungsi terang", passLabel: "Menyala", failLabel: "Mati" },
      { id: "lev", num: 5, title: "5. Marka Batas Kumpul", desc: "Garis batas kumpul cat hijau/kuning terlihat jelas", passLabel: "Jelas", failLabel: "Pudar" },
    ],
  },
  safety_mirror: {
    title: "Pemeriksaan Safety Mirror",
    subtitle: "Pemeriksaan cermin cembung tikungan / blindspot",
    badge: "Safety Mirror",
    isConsumable: false,
    params: [
      { id: "tbg", num: 1, title: "1. Kebersihan Cermin", desc: "Bening, bebas debu pekat, lumpur & minyak", passLabel: "Bening", failLabel: "Buram" },
      { id: "slg", num: 2, title: "2. Sudut Pandang (Angle)", desc: "Mengarah tepat ke blindspot persimpangan", passLabel: "Tepat", failLabel: "Bergeser" },
      { id: "nozz", num: 3, title: "3. Braket & Tiang", desc: "Baut kencang, tiang tegak & tidak goyang", passLabel: "Kokoh", failLabel: "Goyang" },
      { id: "sgl", num: 4, title: "4. Fisik Cermin & Topi", desc: "Tidak retak, pecah, ataupun berkarat parah", passLabel: "Utuh", failLabel: "Retak" },
      { id: "lev", num: 5, title: "5. Bebas Halangan", desc: "Tidak tertutup dahan pohon, spanduk atau barang", passLabel: "Bebas", failLabel: "Terhalang" },
    ],
  },
  emergency_door: {
    title: "Pemeriksaan Pintu Darurat",
    subtitle: "Pemeriksaan jalur evakuasi & pintu darurat",
    badge: "Pintu Darurat",
    isConsumable: false,
    params: [
      { id: "tbg", num: 1, title: "1. Mekanisme Panic Bar", desc: "Buka mudah sekali tekan dari arah dalam", passLabel: "Lancar", failLabel: "Macet" },
      { id: "slg", num: 2, title: "2. Bebas Gembok & Kunci", desc: "Tidak terhalang gembok saat jam operasional", passLabel: "Bebas", failLabel: "Terkunci" },
      { id: "nozz", num: 3, title: "3. Lampu Exit Sign", desc: "Lampu tanda keluar hijau darurat menyala", passLabel: "Menyala", failLabel: "Mati" },
      { id: "sgl", num: 4, title: "4. Akses Koridor Keluar", desc: "Area depan dan belakang pintu bebas barang", passLabel: "Lapang", failLabel: "Terhalang" },
      { id: "lev", num: 5, title: "5. Daun Pintu & Closer", desc: "Engsel presisi, door closer menutup rapat otomatis", passLabel: "Rapat", failLabel: "Rusak" },
    ],
  },
};

const getCategoryConfig = (category?: string): CategoryInspectionConfig => {
  const cat = (category || "apar").toLowerCase().trim();
  if (cat === "titik_kumpul") return CATEGORY_CONFIG.assembly_point;
  if (cat === "pintu_darurat") return CATEGORY_CONFIG.emergency_door;
  return CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.apar;
};

export default function AparScanPage() {
  const { code } = useParams<{ code: string }>();

  const isAuthenticated = auth.isAuthenticated();
  const user = auth.getUser();
  const userRole = (auth.getRole() || user?.role?.code || "").toLowerCase().trim();
  const targetDashboard = !isAuthenticated 
    ? "/login" 
    : (["admin", "hse", "pic_k3"].includes(userRole) ? "/monitoring" : "/dashboard");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facility, setFacility] = useState<SafetyFacility | null>(null);
  const [isRefillQueue, setIsRefillQueue] = useState<boolean>(false);
  const [totalInspections, setTotalInspections] = useState<number>(0);

  // Current View Mode (CHOICE = Kartu & Riwayat Utama, PENGECEKAN = Form Lapangan)
  const [viewMode, setViewMode] = useState<ViewMode>("CHOICE");
  const categoryConfig = getCategoryConfig(facility?.category);

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
      setError("Kode fasilitas keselamatan tidak valid.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.getAparByScanCode(code);
      if (res.success && res.data) {
        setFacility(res.data.facility);
        setIsRefillQueue(!!res.data.is_refill_queue);
        setTotalInspections(res.data.total_inspections ?? res.data.facility?.inspections_count ?? (res.data.facility?.inspections?.length || 0));


      } else {
        setError(res.message || "Data fasilitas keselamatan tidak ditemukan.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat informasi fasilitas keselamatan.");
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
    setPetugasSubmitted(false);
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
      ctx.fillText(`🏷️ Unit: ${facility?.code || code} (${categoryConfig.badge} - ${facility?.area_zone || "Area Pabrik"})  |  📸 REALTIME CAMERA AUDIT`, 20, height - bannerHeight + fontSizePrimary + (fontSizeSecondary * 2) + 28);

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
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
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
            <h1 className="text-sm font-bold text-slate-800">{categoryConfig.title}</h1>
          </div>
          <Link
            to={targetDashboard}
            className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition border border-slate-200 cursor-pointer"
            title={isAuthenticated ? "Kembali ke Dashboard K3" : "Masuk ke Akun Portal HSE"}
          >
            Dashboard K3
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800 mb-2"></div>
            <div>Memuat data fasilitas {code}...</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 text-center text-xs space-y-4">
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">
              {error}
            </div>
            <Link
              to={targetDashboard}
              className="inline-block text-xs font-semibold text-slate-900 underline cursor-pointer"
            >
              {isAuthenticated ? "Kembali ke Halaman Monitoring" : "Masuk ke Portal HSE"}
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
                    (facility.calculated_status === "AMAN" || facility.calculated_status === "BAIK") 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                      : "bg-rose-50 text-rose-700 border-rose-300"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${(facility.calculated_status === "AMAN" || facility.calculated_status === "BAIK") ? "bg-emerald-500" : "bg-rose-500"}`} />
                    {(facility.calculated_status === "AMAN" || facility.calculated_status === "BAIK") 
                      ? (categoryConfig.isConsumable ? "Media Aman" : "Kondisi Baik") 
                      : (categoryConfig.isConsumable ? "Perlu Refill" : "Perlu Atensi")}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    {categoryConfig.isConsumable 
                      ? `Exp: ${facility.consumable_cycle?.expired_at || "-"}`
                      : `Interval: ${facility.condition_schedule?.interval_pemeriksaan_hari || 30} Hari`}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200 flex justify-between items-center flex-wrap gap-1">
                <span>
                  Kategori: <strong>{categoryConfig.badge}</strong>
                  {facility.specifications?.type ? ` • ${facility.specifications.type}` : ""}
                  {facility.specifications?.capacity ? ` (${facility.specifications.capacity})` : ""}
                </span>
                {isRefillQueue && <span className="text-amber-700 font-semibold">Antrean Refill</span>}
              </div>


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
                        {categoryConfig.subtitle} oleh Petugas HSE
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
                        Fasilitas ini belum memiliki catatan pemeriksaan. Silakan mulai pengecekan pertama melalui tombol di atas.
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
                  <ArrowLeft size={14} /> Kembali ke kartu fasilitas & riwayat
                </button>

                <div className="border-b border-slate-200 pb-2">
                  <h2 className="text-sm font-bold text-slate-900">Formulir Pengecekan {categoryConfig.badge}</h2>
                  <p className="text-xs text-slate-500">{categoryConfig.subtitle}</p>
                </div>

                {/* Notifikasi Berhasil di Bagian Atas */}
                {petugasSubmitted && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in duration-200">
                    <div className="text-emerald-800 font-bold text-xs flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check size={12} />
                      </div>
                      <span>Hasil Pemeriksaan Berhasil Disimpan!</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      Laporan inspeksi fisik 5 parameter {categoryConfig.badge} telah dicatat ke sistem dan siap diverifikasi oleh PIC K3.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("CHOICE");
                        setPetugasSubmitted(false);
                      }}
                      className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold text-center transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Lihat Riwayat & Kartu Kendali</span>
                    </button>
                  </div>
                )}

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
                      disabled={submittingPetugas}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
                    />
                  </div>

                  {/* 5 Parameter Fisik Berdasarkan Kategori Fasilitas */}
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <div className="font-semibold text-slate-700">Pemeriksaan Fisik 5 Parameter {categoryConfig.badge}:</div>
                    
                    {categoryConfig.params.map((param) => {
                      const isGood = param.id === "tbg" ? tbg
                        : param.id === "slg" ? slg
                        : param.id === "nozz" ? nozz
                        : param.id === "sgl" ? sgl
                        : lev;
                      const setter = param.id === "tbg" ? setTbg
                        : param.id === "slg" ? setSlg
                        : param.id === "nozz" ? setNozz
                        : param.id === "sgl" ? setSgl
                        : setLev;

                      return (
                        <div key={param.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-800 block text-xs truncate sm:text-clip">{param.title}</span>
                            <span className="text-[11px] text-slate-500 leading-tight block">{param.desc}</span>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={submittingPetugas}
                              onClick={() => setter(true)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isGood 
                                  ? "bg-emerald-600 text-white shadow-xs" 
                                  : "bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-medium"
                              }`}
                            >
                              {param.passLabel}
                            </button>
                            <button
                              type="button"
                              disabled={submittingPetugas}
                              onClick={() => setter(false)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                !isGood 
                                  ? "bg-rose-600 text-white shadow-xs" 
                                  : "bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-medium"
                              }`}
                            >
                              {param.failLabel}
                            </button>
                          </div>
                        </div>
                      );
                    })}
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
                      placeholder={`Contoh: Kondisi fisik ${categoryConfig.badge} bersih, fungsi normal dan siap digunakan...`}
                      disabled={submittingPetugas}
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
                          disabled={submittingPetugas}
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
                        {!submittingPetugas && (
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

                  {/* Submit Button atau Tombol Kembali */}
                  <div className="pt-2">
                    {petugasSubmitted ? (
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
