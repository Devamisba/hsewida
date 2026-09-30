import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Camera, 
  ArrowLeft,
  Check,
  RotateCcw,
  X,
  ExternalLink
} from "lucide-react";
import { api, SafetyFacility } from "@/services/api";
import { auth } from "@/lib/auth";

type ViewMode = "CHOICE" | "PENGECEKAN" | "MONITORING_LOGIN" | "MONITORING_DASHBOARD";

export default function AparScanPage() {
  const { code } = useParams<{ code: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facility, setFacility] = useState<SafetyFacility | null>(null);
  const [latestInspection, setLatestInspection] = useState<any>(null);
  const [latestInspectorName, setLatestInspectorName] = useState<string>("");
  const [inspectionStatusLabel, setInspectionStatusLabel] = useState<string>("");
  const [isRefillQueue, setIsRefillQueue] = useState<boolean>(false);
  const [stats, setStats] = useState<{ total_apar: number; monitored_count: number; unmonitored_count: number }>({
    total_apar: 266,
    monitored_count: 0,
    unmonitored_count: 266,
  });

  // Current View Mode
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

  // --- LOGIN PIC HSE State ---
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // --- FORM 2: PIC HSE State ---
  const [picName, setPicName] = useState<string>("");
  const [verificationStatus, setVerificationStatus] = useState<"VERIFIED" | "REVISE" | "REFILL_REQUESTED">("VERIFIED");
  const [picNotes, setPicNotes] = useState<string>("");
  const [submittingPic, setSubmittingPic] = useState<boolean>(false);
  const [picSuccessMsg, setPicSuccessMsg] = useState<string | null>(null);

  // --- Live Camera Elements ---
  const fileCameraInputRef = useRef<HTMLInputElement>(null);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
        setLatestInspection(res.data.latest_inspection);
        setLatestInspectorName(res.data.latest_inspector_name || "");
        if (res.data.latest_pic_name && !picName) {
          setPicName(res.data.latest_pic_name);
        }
        setInspectionStatusLabel(res.data.inspection_status_label || "");
        setIsRefillQueue(!!res.data.is_refill_queue);
        if (res.data.stats) {
          setStats(res.data.stats);
        }

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
  }, [code]);

  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  // Pre-fill PIC name if logged in
  useEffect(() => {
    if (auth.isAuthenticated()) {
      const user = auth.getUser();
      if (user?.name && !picName) {
        setPicName(user.name);
      }
    }
  }, [viewMode]);

  // --- BUTTON CLICKS FROM CHOICE MENU ---
  const handleSelectPengecekan = () => {
    setViewMode("PENGECEKAN");
  };

  const handleSelectMonitoring = () => {
    if (auth.isAuthenticated()) {
      const role = auth.getRole();
      const user = auth.getUser();
      const perms = user?.permissions || [];
      const isAuthorized = role === 'pic_k3' || role === 'hse' || role === 'admin' || perms.includes('monitoring.view');
      if (isAuthorized) {
        setViewMode("MONITORING_DASHBOARD");
      } else {
        setViewMode("MONITORING_LOGIN");
        setLoginError("Akun aktif Anda saat ini bukan PIC K3 / Tim HSE. Silakan login dengan akun PIC K3 yang berwenang.");
      }
    } else {
      setViewMode("MONITORING_LOGIN");
    }
  };

  // --- PIC LOGIN SUBMISSION ---
  const handlePicLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await api.login(loginEmail.trim(), loginPassword);
      if (res.success && res.data) {
        const roleCode = res.data.user?.role?.code;
        const perms = res.data.user?.permissions || [];
        const isAuthorized = roleCode === 'pic_k3' || roleCode === 'hse' || roleCode === 'admin' || perms.includes('monitoring.view') || perms.includes('inspections.create');

        if (!isAuthorized) {
          setLoginError("Akun ini bukan PIC K3 / Tim HSE. Silakan login menggunakan akun PIC K3 yang memiliki akses monitoring.");
          return;
        }

        auth.setSession(res.data.token, res.data.user);
        if (res.data.user?.name) {
          setPicName(res.data.user.name);
        }
        setViewMode("MONITORING_DASHBOARD");
      } else {
        setLoginError(res.message || "Email atau password PIC salah.");
      }
    } catch (err: any) {
      setLoginError(err.message || "Gagal login sebagai PIC K3 / HSE.");
    } finally {
      setLoginLoading(false);
    }
  };

  // --- CAMERA HANDLERS ---
  const handleNativeCameraCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          setCapturedPhoto(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startLiveCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        fileCameraInputRef.current?.click();
        return;
      }

      setIsLiveCameraOpen(true);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setIsLiveCameraOpen(false);
      fileCameraInputRef.current?.click();
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
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
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
      };

      const res = await api.submitPetugasInspection(code, payload);
      if (res.success) {
        setPetugasSubmitted(true);
        await fetchAparData();
      } else {
        alert(res.message || "Gagal menyimpan hasil inspeksi.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat menyimpan inspeksi.");
    } finally {
      setSubmittingPetugas(false);
    }
  };

  // --- SUBMIT FORM 2 (PIC HSE) ---
  const handlePicSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code) return;

    if (!picName.trim()) {
      alert("Silakan ketik nama PIC HSE.");
      return;
    }

    setSubmittingPic(true);
    setPicSuccessMsg(null);
    try {
      const payload = {
        pic_name: picName.trim(),
        verification_status: verificationStatus,
        verification_notes: picNotes.trim() || undefined,
      };

      const res = await api.submitPicVerification(code, payload);
      if (res.success) {
        setPicSuccessMsg(res.data.status_label || "Verifikasi berhasil disimpan.");
        await fetchAparData();
      } else {
        alert(res.message || "Gagal menyimpan verifikasi PIC.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat menyimpan verifikasi.");
    } finally {
      setSubmittingPic(false);
    }
  };

  const referencedInspector = latestInspectorName || petugasName || "Petugas Lapangan";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 font-sans text-slate-800 antialiased">
      
      {/* Top Header - Sederhana */}
      <div className="w-full max-w-md mb-3 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">PT Widatra Bhakti</span>
          <h1 className="text-sm font-bold text-slate-900 leading-tight">Pemeriksaan APAR</h1>
        </div>
        <Link 
          to="/monitoring" 
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-300 bg-white px-2.5 py-1 rounded-md transition"
        >
          Dashboard K3
        </Link>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            Memuat data tabung APAR...
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 text-center space-y-3">
            <div className="text-sm font-bold text-slate-800">Tabung APAR Tidak Ditemukan</div>
            <p className="text-xs text-slate-500">{error}</p>
            <button
              onClick={fetchAparData}
              className="text-xs text-blue-600 underline font-medium cursor-pointer"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Facility Loaded Card */}
        {facility && !loading && (
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
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    facility.calculated_status === "AMAN" 
                      ? "bg-slate-100 text-slate-800 border-slate-300" 
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}>
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
                <div className="mt-2.5 p-2 bg-white rounded border border-slate-200 text-xs">
                  <span className="text-slate-500 text-[10px] block font-semibold uppercase">Status Saat Ini:</span>
                  <span className="font-semibold text-slate-800">{inspectionStatusLabel}</span>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* VIEW 1: LAYAR PILIHAN UTAMA (HANYA 2 TOMBOL)              */}
            {/* ======================================================== */}
            {viewMode === "CHOICE" && (
              <div className="p-5 space-y-4">
                <div className="text-xs text-slate-600 leading-relaxed text-center pb-1">
                  Pilih jenis tindakan yang akan dilakukan pada tabung ini:
                </div>

                <div className="space-y-3">
                  {/* Tombol 1: Pengecekan */}
                  <button
                    type="button"
                    onClick={handleSelectPengecekan}
                    className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold text-center transition cursor-pointer"
                  >
                    1. Pengecekan
                    <span className="block text-[11px] font-normal text-slate-300 mt-0.5">
                      Pemeriksaan fisik keliling lapangan oleh Petugas HSE
                    </span>
                  </button>

                  {/* Tombol 2: Monitoring */}
                  <button
                    type="button"
                    onClick={handleSelectMonitoring}
                    className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-sm font-semibold text-center transition cursor-pointer"
                  >
                    2. Monitoring
                    <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                      Verifikasi audit & rekapitulasi data oleh PIC HSE
                    </span>
                  </button>
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
                  onClick={() => setViewMode("CHOICE")}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Kembali ke pilihan
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
                      disabled={petugasSubmitted}
                      onChange={(e) => setPetugasName(e.target.value)}
                      placeholder="Ketik nama lengkap pemeriksa..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
                    />
                  </div>

                  {/* 5 Parameter Fisik */}
                  <div className="space-y-2 pt-1">
                    <label className="block font-semibold text-slate-700">
                      Pemeriksaan 5 Parameter Fisik
                    </label>

                    <div className="space-y-1.5 border border-slate-200 rounded-md p-2 bg-slate-50/50">
                      
                      {/* Tbg */}
                      <div className="flex items-center justify-between py-1 border-b border-slate-200">
                        <span>1. Kondisi Tabung (Tbg)</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={petugasSubmitted}
                            onClick={() => setTbg(true)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold ${tbg ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                          >
                            Baik
                          </button>
                          <button
                            type="button"
                            disabled={petugasSubmitted}
                            onClick={() => setTbg(false)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold ${!tbg ? "bg-red-700 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                          >
                            Rusak
                          </button>
                        </div>
                      </div>

                      {/* Slg */}
                      <div className="flex items-center justify-between py-1 border-b border-slate-200">
                        <span>2. Selang / Hose (Slg)</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={petugasSubmitted}
                            onClick={() => setSlg(true)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold ${slg ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                          >
                            Baik
                          </button>
                          <button
                            type="button"
                            disabled={petugasSubmitted}
                            onClick={() => setSlg(false)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold ${!slg ? "bg-red-700 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                          >
                            Rusak
                          </button>
                        </div>
                      </div>

                      {/* Nozz */}
                      <div className="flex items-center justify-between py-1 border-b border-slate-200">
                        <span>3. Nozzle / Corong (Nozz)</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={petugasSubmitted}
                            onClick={() => setNozz(true)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold ${nozz ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                          >
                            Baik
                          </button>
                          <button
                            type="button"
                            disabled={petugasSubmitted}
                            onClick={() => setNozz(false)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold ${!nozz ? "bg-red-700 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                          >
                            Rusak
                          </button>
                        </div>
                      </div>

                      {/* Sgl */}
                      <div className="flex items-center justify-between py-1 border-b border-slate-200">
                        <span>4. Segel & Pin (Sgl)</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={petugasSubmitted}
                            onClick={() => setSgl(true)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold ${sgl ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                          >
                            Baik
                          </button>
                          <button
                            type="button"
                            disabled={petugasSubmitted}
                            onClick={() => setSgl(false)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold ${!sgl ? "bg-red-700 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                          >
                            Rusak
                          </button>
                        </div>
                      </div>

                      {/* Lev */}
                      <div className="flex items-center justify-between py-1">
                        <span>5. Lever & Tekanan (Lev)</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={petugasSubmitted}
                            onClick={() => setLev(true)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold ${lev ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                          >
                            Baik
                          </button>
                          <button
                            type="button"
                            disabled={petugasSubmitted}
                            onClick={() => setLev(false)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold ${!lev ? "bg-red-700 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                          >
                            Rusak
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Keterangan Temuan (Wajib) */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      Keterangan / Temuan Lapangan * (Wajib diisi)
                    </label>
                    <textarea
                      required
                      minLength={3}
                      rows={2}
                      disabled={petugasSubmitted}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Kondisi tabung bersih, pin terkunci rapat, manometer normal."
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-slate-600 disabled:bg-slate-100"
                    />
                  </div>

                  {/* Foto Dokumentasi (Live Camera Only) */}
                  <div className="space-y-1 pt-1">
                    <label className="block font-semibold text-slate-700">
                      Foto Dokumentasi (Kamera Langsung)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={fileCameraInputRef}
                      onChange={handleNativeCameraCapture}
                      className="hidden"
                    />

                    {!capturedPhoto ? (
                      <div>
                        <button
                          type="button"
                          disabled={petugasSubmitted}
                          onClick={startLiveCamera}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold transition cursor-pointer"
                        >
                          <Camera size={14} /> Ambil Foto Kamera
                        </button>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          Foto diambil langsung di lokasi tabung berada.
                        </span>
                      </div>
                    ) : (
                      <div className="relative border border-slate-300 rounded-md overflow-hidden aspect-video max-h-44 bg-black">
                        <img src={capturedPhoto} alt="Bukti Pengecekan" className="w-full h-full object-contain" />
                        {!petugasSubmitted && (
                          <button
                            type="button"
                            onClick={() => {
                              setCapturedPhoto(null);
                              startLiveCamera();
                            }}
                            className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded flex items-center gap-1"
                          >
                            <RotateCcw size={12} /> Foto Ulang
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button atau Status Menunggu Verifikasi */}
                  <div className="pt-2">
                    {petugasSubmitted ? (
                      <div className="w-full py-3 px-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <Check size={14} /> Menunggu Verifikasi PIC
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

            {/* ======================================================== */}
            {/* VIEW 3: FORM LOGIN PIC HSE (JIKA BELUM LOGIN)            */}
            {/* ======================================================== */}
            {viewMode === "MONITORING_LOGIN" && (
              <div className="p-5 space-y-4">
                
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => setViewMode("CHOICE")}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Kembali ke pilihan
                </button>

                <div className="border-b border-slate-200 pb-2">
                  <h2 className="text-sm font-bold text-slate-900">Login PIC K3 / HSE</h2>
                  <p className="text-xs text-slate-500">Masukkan akun PIC K3 untuk memverifikasi data dan memantau status monitoring.</p>
                </div>

                {loginError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                    {loginError}
                  </div>
                )}

                <form onSubmit={handlePicLogin} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">Email atau NIK PIC K3</label>
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="pick3@hse.com atau PK10006"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-slate-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">Password</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-slate-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-md text-xs font-semibold text-center transition cursor-pointer"
                  >
                    {loginLoading ? "Memeriksa kredensial..." : "Masuk"}
                  </button>

                  <p className="text-[11px] text-slate-400 text-center pt-1">
                    Akun PIC K3: <span className="font-mono text-slate-600">pick3@hse.com</span> / <span className="font-mono text-slate-600">password123</span>
                  </p>
                </form>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 4: MONITORING PIC HSE (REKAP DATA + FORM VERIFIKASI) */}
            {/* ======================================================== */}
            {viewMode === "MONITORING_DASHBOARD" && (
              <div className="p-5 space-y-4">
                
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => setViewMode("CHOICE")}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Kembali ke pilihan
                </button>

                {/* 1. Rekap Data Monitoring Pabrik (Ringkas & Sederhana) */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Rekapitulasi Monitoring APAR Pabrik
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-md border border-slate-200 bg-slate-50">
                      <span className="text-[10px] text-slate-500 block">Total APAR</span>
                      <span className="text-base font-bold text-slate-900">{stats.total_apar}</span>
                    </div>
                    <div className="p-2.5 rounded-md border border-slate-200 bg-slate-50">
                      <span className="text-[10px] text-slate-500 block">Sudah Dimonitoring</span>
                      <span className="text-base font-bold text-slate-900">{stats.monitored_count}</span>
                    </div>
                    <div className="p-2.5 rounded-md border border-slate-200 bg-slate-50">
                      <span className="text-[10px] text-slate-500 block">Belum Dimonitoring</span>
                      <span className="text-base font-bold text-slate-900">{stats.unmonitored_count}</span>
                    </div>
                  </div>
                </div>

                {picSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium">
                    {picSuccessMsg}
                  </div>
                )}

                {/* 2. Form Verifikasi APAR yang Sedang Discan */}
                <div className="border-t border-slate-200 pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Verifikasi APAR {facility.code}
                      </h2>
                      <p className="text-xs text-slate-500">Cross-check temuan pemeriksaan petugas lapangan</p>
                    </div>
                  </div>

                  {/* Ringkasan Data Petugas */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-2">
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">Pemeriksa Lapangan:</span>
                      <span className="font-semibold text-slate-900">{referencedInspector}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">Tanggal Cek:</span>
                      <span className="font-semibold text-slate-900">
                        {latestInspection?.inspection_date || facility.last_inspected_at || "Hari ini"}
                      </span>
                    </div>

                    {latestInspection?.notes && (
                      <div className="border-b border-slate-200 pb-1.5">
                        <span className="text-slate-500 block text-[11px]">Catatan Petugas:</span>
                        <span className="font-medium text-slate-800 italic">"{latestInspection.notes}"</span>
                      </div>
                    )}

                    {/* Foto Bukti Petugas jika ada */}
                    {latestInspection?.foto_bukti && latestInspection.foto_bukti.length > 0 && (
                      <div>
                        <span className="text-slate-500 block text-[11px] mb-1">Foto Bukti Lapangan:</span>
                        <div className="rounded border border-slate-300 overflow-hidden aspect-video max-h-40 bg-black">
                          <img src={latestInspection.foto_bukti[0]} alt="Foto Lapangan" className="w-full h-full object-contain" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Tindakan PIC */}
                  <form onSubmit={handlePicSubmit} className="space-y-3 text-xs pt-1">
                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700">Nama PIC HSE *</label>
                      <input
                        type="text"
                        required
                        value={picName}
                        onChange={(e) => setPicName(e.target.value)}
                        placeholder="Ketik nama PIC HSE..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-slate-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700">Keputusan Verifikasi *</label>
                      <div className="space-y-1">
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded cursor-pointer hover:bg-slate-50">
                          <input
                            type="radio"
                            name="vstatus"
                            value="VERIFIED"
                            checked={verificationStatus === "VERIFIED"}
                            onChange={() => setVerificationStatus("VERIFIED")}
                          />
                          <span>Sesuai / Disetujui (VERIFIED)</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded cursor-pointer hover:bg-slate-50">
                          <input
                            type="radio"
                            name="vstatus"
                            value="REVISE"
                            checked={verificationStatus === "REVISE"}
                            onChange={() => setVerificationStatus("REVISE")}
                          />
                          <span>Ada Temuan (REVISE)</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 border border-slate-200 rounded cursor-pointer hover:bg-slate-50">
                          <input
                            type="radio"
                            name="vstatus"
                            value="REFILL_REQUESTED"
                            checked={verificationStatus === "REFILL_REQUESTED"}
                            onChange={() => setVerificationStatus("REFILL_REQUESTED")}
                          />
                          <span>Perlu Refill Tabung (REFILL QUEUE)</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700">Catatan PIC (Opsional)</label>
                      <textarea
                        rows={2}
                        value={picNotes}
                        onChange={(e) => setPicNotes(e.target.value)}
                        placeholder="Catatan tambahan hasil supervisi jika ada..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-slate-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingPic}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-md text-xs font-semibold text-center transition cursor-pointer"
                    >
                      {submittingPic ? "Menyimpan verifikasi..." : `Simpan Verifikasi Pemeriksaan ${referencedInspector}`}
                    </button>
                  </form>

                </div>

                {/* Link ke Dashboard Lengkap */}
                <div className="border-t border-slate-200 pt-3 text-center">
                  <Link
                    to="/monitoring"
                    className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline font-semibold"
                  >
                    Buka Dashboard Monitoring Lengkap (266 Tabung) <ExternalLink size={12} />
                  </Link>
                </div>

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
