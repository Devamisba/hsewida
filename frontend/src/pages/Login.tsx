import { useState, useEffect } from "react";
import { Eye, EyeOff, Sparkles, X } from "lucide-react";
import { api } from "@/services/api";
import { auth } from "@/lib/auth";
import { K3Loader } from "@/components/K3Loader";
import { resolveImageUrl } from "@/utils/imageUrl";

const DEMO_ACCOUNTS = [
  { role: "admin", label: "Admin", nip: "SA12345", name: "System Administrator" },
  { role: "pemohon", label: "Vendor (Pemohon)", nip: "VN10001", name: "PT Maju Mundur" },
  { role: "pic_vendor", label: "PIC Widatra (Internal)", nip: "PC10002", name: "PIC Widatra (Internal)" },
  { role: "hse", label: "Tim K3 / HSE", nip: "HS10003", name: "Tim K3 / HSE Officer" },
  { role: "pic_k3", label: "PIC K3 (Monitoring)", nip: "PK10006", name: "PIC K3 Widatra" },
  { role: "ga_dept_head", label: "Head Dept HRD&GA", nip: "GA10004", name: "P. Andaru" },
  { role: "ga_div_head", label: "Head Division HRD&GA", nip: "GA10005", name: "P. Effendy" },
];

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [loginBgImage, setLoginBgImage] = useState<string>("/widatra-building.jpg");

  // Auto-redirect if user already has an active session
  useEffect(() => {
    if (auth.isAuthenticated()) {
      window.location.href = "/dashboard";
      return;
    }

    // Check remembered NIP
    const remembered = localStorage.getItem("hse_remembered_nip") || localStorage.getItem("hse_remembered_nik");
    if (remembered) {
      setIdentifier(remembered);
      setRememberMe(true);
    }

    // Fetch dynamic login background image from Master Data
    api.getSettings()
      .then((res) => {
        if (res?.success && res.data?.map?.login_background_image) {
          setLoginBgImage(res.data.map.login_background_image);
        }
      })
      .catch((err) => {
        console.warn("Could not load custom login background:", err);
      });
  }, []);

  const performLogin = async (loginIdentifier: string, loginPass: string) => {
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await api.login(loginIdentifier, loginPass);
      if (res.success && res.data) {
        if (rememberMe) {
          localStorage.setItem("hse_remembered_nip", loginIdentifier.trim());
        } else {
          localStorage.removeItem("hse_remembered_nip"); localStorage.removeItem("hse_remembered_nik");
        }
        auth.setSession(res.data.token, res.data.user);
        window.location.href = "/dashboard";
      } else {
        setErrorMsg(res.message || "Login gagal, periksa kembali NIP dan password Anda.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(err.message || "Kredensial NIP atau password tidak sesuai.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg("Harap masukkan NIP dan password.");
      return;
    }
    performLogin(identifier, password);
  };

  const handleQuickLogin = (demoNip: string) => {
    setIdentifier(demoNip);
    setPassword("password");
    setShowDemoModal(false);
    performLogin(demoNip, "password");
  };

  return (
    <div className="h-screen w-full bg-[#f8fafc] md:bg-white flex flex-col md:flex-row overflow-hidden selection:bg-blue-100 selection:text-blue-900 select-none">
      {/* Sisi Kiri: Form Login */}
      <div className="w-full md:w-[45%] lg:w-[42%] xl:w-[40%] h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 bg-white shadow-sm md:shadow-none z-10 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="w-full max-w-[360px] mx-auto flex flex-col justify-between h-full py-1">
          {/* Logo & Nama Perusahaan PT Widatra Bhakti */}
          <div className="pt-1 pb-2 min-h-[52px] flex items-center">
            <div className="flex items-center gap-2.5 sm:gap-3 select-none">
              <img
                src="/logo-widatra.png"
                alt="PT Widatra Bhakti"
                className="h-10 sm:h-11 w-auto object-contain object-left shrink-0"
              />
              <span className="font-extrabold text-[15px] sm:text-[16px] text-[#22247b] tracking-tight leading-none uppercase">
                PT WIDATRA BHAKTI
              </span>
            </div>
          </div>

          {/* Form Area */}
          <div className="my-auto py-2 sm:py-3">
            <div className="mb-4 sm:mb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-tight">
                Hallo
              </h2>
              <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-slate-900 tracking-tight leading-none mt-1">
                Welcome Back
              </h1>
              <p className="text-xs text-slate-400 mt-1.5 font-normal">
                Hey, welcome back to your special place
              </p>
            </div>

            <form className="space-y-3" onSubmit={handleFormSubmit}>
              <div>
                <label
                  htmlFor="nip-input"
                  className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider"
                >
                  NIP
                </label>
                <input
                  id="nip-input"
                  type="text"
                  placeholder="SA12345"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full h-[38px] px-3 text-xs sm:text-sm rounded-lg border border-slate-200 bg-[#edf2f9] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50 disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="password-input"
                  className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full h-[38px] pl-3 pr-9 text-xs sm:text-sm rounded-lg border border-slate-200 bg-[#edf2f9] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
                    aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={() =>
                      alert("Silakan hubungi IT Department / Administrator untuk reset password.")
                    }
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium hover:underline focus:outline-none cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-2">
                  <span className="font-semibold shrink-0">Peringatan:</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="text-[11px] text-slate-500 cursor-pointer select-none"
                >
                  Remember me
                </label>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[38px] rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-3.5 w-3.5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>

              <div className="mt-3 text-center text-[11px] text-slate-500">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() =>
                    alert("Silakan hubungi IT Department untuk pendaftaran akun sistem.")
                  }
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
                >
                  Report to IT Department
                </button>
              </div>
            </form>
          </div>

          {/* Footer Copyright */}
          <div className="text-center text-[10px] text-slate-400 pt-2 pb-1">
            © 2026 PT Widatra Bhakti. All rights reserved.
          </div>
        </div>
      </div>

      {/* Sisi Kanan: Inset Card Foto Showcase Gedung (Gambar 3 Sesuai Gambar 4) */}
      <div className="hidden md:flex md:w-[55%] lg:w-[58%] xl:w-[60%] h-full p-3 sm:p-4 lg:p-5 bg-[#f8fafc] items-center justify-center">
        <div className="relative w-full h-full rounded-2xl xl:rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-100">
          <img
            src={resolveImageUrl(loginBgImage)}
            alt="PT Widatra Bhakti Plant & Head Office"
            className="w-full h-full object-cover object-center"
            loading="eager"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/widatra-building.jpg";
            }}
          />
        </div>
      </div>

      {/* Floating Demo Picker (Bantuan Uji Coba Cepat) */}
      <div className="fixed bottom-3 left-3 z-50">
        {!showDemoModal ? (
          <button
            type="button"
            onClick={() => setShowDemoModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-medium shadow-md backdrop-blur-sm transition cursor-pointer"
            title="Pilih akun demo cepat"
          >
            <Sparkles size={12} className="text-amber-300" />
            <span>Demo Akun</span>
          </button>
        ) : (
          <div className="p-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl w-72 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-700">Pilih Role Demo (1-Klik)</span>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc.nip)}
                  className="p-1.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-left transition cursor-pointer"
                >
                  <div className="text-[10px] font-semibold text-slate-800 truncate">{acc.label}</div>
                  <div className="text-[9px] text-slate-400 font-mono">NIP: {acc.nip}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full Screen K3 Loading Animation saat Login */}
        {loading && (
          <K3Loader
            fullScreen
            size="lg"
            showSlogan
            text="Mengautentikasi Akun HSE..."
          />
        )}
      </div>
    </div>
  );
}
