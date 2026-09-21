import { useState, useEffect, useRef } from "react";
import { X, QrCode, Search, AlertCircle, ArrowRight, RefreshCw, SwitchCamera, Loader2, CheckCircle2 } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "@/services/api";

interface QrScanFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (facility: any) => void;
}

export function QrScanFieldModal({ isOpen, onClose, onScanSuccess }: QrScanFieldModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanSuccessMsg, setScanSuccessMsg] = useState("");

  // Camera states
  const [cameraStatus, setCameraStatus] = useState<"idle" | "starting" | "active" | "error">("idle");
  const [cameraError, setCameraError] = useState("");
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  // Audio beep feedback on successful scan
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {
      // Audio context might be restricted before user gesture
    }
  };

  const handleLookup = async (codeToSearch: string) => {
    let code = codeToSearch.trim();
    if (!code) {
      setError("Silakan masukkan kode QR atau ID alat K3.");
      return;
    }

    // Clean URL format if scanned QR contains full URL (e.g. http://.../facility/QR-AP001 or ?code=QR-AP001)
    if (code.includes("?")) {
      try {
        const url = new URL(code);
        const paramCode = url.searchParams.get("code") || url.searchParams.get("id") || url.searchParams.get("qr");
        if (paramCode) code = paramCode;
      } catch (_) {}
    }
    if (code.includes("/")) {
      const parts = code.split("/").filter(Boolean);
      code = parts[parts.length - 1];
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.getFacilityByQrId(code);
      if (res.success && res.data?.facility) {
        setScanSuccessMsg(`Alat ditemukan: ${res.data.facility.nama_item || res.data.facility.code}`);
        setTimeout(() => {
          onScanSuccess(res.data.facility);
          onClose();
        }, 400);
      } else {
        setError(res.message || `Alat K3 dengan kode "${code}" tidak ditemukan.`);
        isProcessingRef.current = false;
      }
    } catch (err: any) {
      setError(err.message || `Kode QR "${code}" tidak dikenali atau belum terdaftar.`);
      isProcessingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  // Stop scanner safely
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      } finally {
        scannerRef.current = null;
      }
    }
  };

  // Start scanner using detected camera or facingMode
  const startCamera = async (cameraIdx = 0) => {
    await stopScanner();
    setCameraStatus("starting");
    setCameraError("");
    isProcessingRef.current = false;

    // Small delay to ensure container element is mounted
    setTimeout(async () => {
      const readerElem = document.getElementById("qr-camera-reader");
      if (!readerElem) {
        setCameraStatus("error");
        setCameraError("Container kamera tidak ditemukan.");
        return;
      }

      try {
        const html5QrCode = new Html5Qrcode("qr-camera-reader", { verbose: false });
        scannerRef.current = html5QrCode;

        // Query available cameras
        let deviceIdToUse = "";
        try {
          const availableCameras = await Html5Qrcode.getCameras();
          if (availableCameras && availableCameras.length > 0) {
            setCameras(availableCameras.map(c => ({ id: c.id, label: c.label || `Kamera ${c.id.slice(0, 5)}` })));
            const chosen = availableCameras[cameraIdx % availableCameras.length];
            deviceIdToUse = chosen.id;
          }
        } catch (_) {
          // getCameras query may fail if permissions not yet granted
        }

        const scanConfig = {
          fps: 12,
          qrbox: (viewWidth: number, viewHeight: number) => {
            const minDim = Math.min(viewWidth, viewHeight);
            const size = Math.floor(minDim * 0.72);
            return { width: size, height: size };
          },
          aspectRatio: 1.333333,
        };

        const onScan = (decodedText: string) => {
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;
          playBeep();
          handleLookup(decodedText);
        };

        if (deviceIdToUse) {
          await html5QrCode.start(deviceIdToUse, scanConfig, onScan, () => {});
        } else {
          // Fallback to environment or user facingMode
          try {
            await html5QrCode.start({ facingMode: "environment" }, scanConfig, onScan, () => {});
          } catch {
            await html5QrCode.start({ facingMode: "user" }, scanConfig, onScan, () => {});
          }
        }

        setCameraStatus("active");
      } catch (err: any) {
        console.warn("Camera start failed:", err);
        setCameraStatus("error");
        const msg = err?.message || String(err);
        if (msg.includes("NotAllowedError") || msg.includes("Permission") || msg.includes("permission")) {
          setCameraError("Izin kamera diblokir oleh browser. Silakan klik ikon gembok/kamera di bilah alamat URL untuk mengizinkan akses kamera.");
        } else if (msg.includes("NotFoundError") || msg.includes("DevicesNotFoundError")) {
          setCameraError("Kamera fisik tidak terdeteksi pada perangkat ini.");
        } else {
          setCameraError("Gagal membuka kamera: " + msg);
        }
      }
    }, 150);
  };

  useEffect(() => {
    if (isOpen) {
      setError("");
      setScanSuccessMsg("");
      startCamera(0);
    } else {
      stopScanner();
      setCameraStatus("idle");
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const nextIdx = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(nextIdx);
    startCamera(nextIdx);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Scan QR Stiker Lapangan</h3>
              <p className="text-[11px] text-slate-500">Pindai stiker fisik tabung/lemari untuk inspeksi instan</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scan Success Notification Banner */}
        {scanSuccessMsg && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="font-bold">{scanSuccessMsg}</span>
          </div>
        )}

        {/* Scan Error Banner */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="p-5 space-y-4 text-xs">
          {/* Style to eliminate html5-qrcode internal duplicate white borders and enable smooth laser */}
          <style>{`
            #qr-camera-reader__scan_region,
            #qr-shaded-region {
              display: none !important;
            }
            #qr-camera-reader {
              border: none !important;
            }
            #qr-camera-reader video {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              border-radius: 0.875rem !important;
            }
            @keyframes scanline-laser {
              0%, 100% { top: 6%; opacity: 0.7; }
              50% { top: 92%; opacity: 1; }
            }
            .laser-scanner-line {
              animation: scanline-laser 2.2s ease-in-out infinite;
            }
          `}</style>

          {/* Live Camera Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-64 sm:h-72 flex items-center justify-center shadow-inner">
            
            {/* HTML5 QR Code Mount Node */}
            <div 
              id="qr-camera-reader" 
              className="w-full h-full"
            />

            {/* Starting Camera Spinner */}
            {cameraStatus === "starting" && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white p-4 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
                <p className="text-xs font-bold text-slate-200">Mengaktifkan Kamera...</p>
                <p className="text-[11px] text-slate-400 mt-1 text-center">
                  Mohon izinkan akses kamera jika muncul permintaan izin di browser
                </p>
              </div>
            )}

            {/* Camera Error / Permission Denied State */}
            {cameraStatus === "error" && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white p-5 text-center z-10">
                <AlertCircle className="w-9 h-9 text-rose-400 mb-2" />
                <p className="text-xs font-bold text-rose-300">Kamera Belum Aktif</p>
                <p className="text-[11px] text-slate-300 mt-1.5 max-w-xs leading-relaxed">
                  {cameraError || "Pastikan memberikan izin akses kamera pada ikon gembok di bilah URL browser."}
                </p>
                <button
                  type="button"
                  onClick={() => startCamera(activeCameraIndex)}
                  className="mt-3.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <RefreshCw size={13} />
                  <span>Coba Nyalakan Kamera Lagi</span>
                </button>
              </div>
            )}

            {/* Clean Single Viewfinder Overlay when Camera is Active (No overlapping duplicate boxes) */}
            {cameraStatus === "active" && (
              <>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                  <div className="w-44 h-44 sm:w-48 sm:h-48 border-2 border-emerald-400/90 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                    {/* Precise Corner Accents */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-400 rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-400 rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-400 rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-400 rounded-br" />

                    {/* Smooth Animated Scanning Laser Line */}
                    <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] laser-scanner-line" />
                  </div>
                </div>

                {/* Subtitle neatly placed at the bottom edge, away from the box */}
                <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none z-20">
                  <span className="text-[10.5px] font-semibold text-white/95 bg-black/65 px-3 py-1 rounded-full backdrop-blur-md shadow-sm border border-white/10">
                    Arahkan kamera ke stiker QR unit K3
                  </span>
                </div>
              </>
            )}

            {/* Switch Camera Button (if device has multiple cameras) */}
            {cameras.length > 1 && cameraStatus === "active" && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="absolute top-2.5 right-2.5 px-2.5 py-1.5 bg-black/65 hover:bg-black/85 text-white rounded-lg backdrop-blur-md text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer z-30 shadow-xs border border-white/10 active:scale-95"
                title="Ganti Kamera"
              >
                <SwitchCamera size={13} />
                <span>Ganti Kamera</span>
              </button>
            )}
          </div>

          {/* Manual Input / Barcode Gun Form */}
          <form onSubmit={handleFormSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Atau Ketik / Tembak Barcode ID Alat:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Contoh: QR-AP001, AP-001, QR-HY001"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !manualCode.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer text-xs"
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <span>Buka</span> <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Sample Buttons for easy testing */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block mb-1.5 uppercase">
                Uji Coba Cepat (Klik Sampel QR):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['QR-AP001', 'QR-AP002', 'QR-AP003', 'QR-HY001', 'QR-FA001'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setManualCode(code);
                      handleLookup(code);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-[10px] font-mono font-bold text-slate-600 transition-colors cursor-pointer"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
