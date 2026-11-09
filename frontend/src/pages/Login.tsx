import { useState, useEffect } from "react";
import { Eye, EyeOff, AlertCircle, Sparkles, X } from "lucide-react";
import { api } from "@/services/api";
import { auth } from "@/lib/auth";
import { K3Loader } from "@/components/K3Loader";
import { resolveImageUrl } from "@/utils/imageUrl";

const DEMO_ACCOUNTS = [
  { role: "admin", label: "Admin", nik: "SA12345" },
  { role: "pemohon", label: "Vendor (Pemohon)", nik: "VN10001" },
  { role: "pic_vendor", label: "PIC Widatra (Internal)", nik: "PC10002" },
  { role: "hse", label: "Tim K3 / HSE", nik: "HS10003" },
  { role: "pic_k3", label: "PIC K3 (Monitoring)", nik: "PK10006" },
  { role: "ga_dept_head", label: "Head Dept HRD&GA", nik: "GA10004" },
  { role: "ga_div_head", label: "Head Division HRD&GA", nik: "GA10005" },
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
        auth.setSession(res.data.token, res.data.user);
        window.location.href = "/dashboard";
      } else {
        setErrorMsg(res.message || "Login gagal, periksa kembali NIK dan password Anda.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(err.message || "Kredensial NIK atau password tidak sesuai.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg("Harap masukkan NIK dan password.");
      return;
    }
    performLogin(identifier, password);
  };

  const handleQuickLogin = (demoNik: string) => {
    setIdentifier(demoNik);
    setPassword("password");
    setShowDemoModal(false);
    performLogin(demoNik, "password");
  };

  return (
    <div className="h-screen w-screen flex bg-white font-sans antialiased overflow-hidden select-none">
      {/* Sisi Kiri: Form Login */}
      <div className="w-full md:w-1/2 h-full bg-white flex flex-col justify-between items-center md:items-end px-6 sm:px-10 md:px-10 lg:px-14 xl:px-20 py-5 sm:py-6 overflow-hidden">
        {/* Spacer Atas */}
        <div className="h-1" />

        {/* Center Container Form */}
        <div className="w-full max-w-[340px]">
          {/* Logo PT Widatra Bhakti (Di tengah & diperbesar) */}
          <div className="mb-5 sm:mb-6 w-full flex justify-center">
            <img
              src="/logo.png"
              alt="Widatra"
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>

          {/* Heading */}
          <div className="mb-4 sm:mb-5">
            <h1 className="text-[26px] sm:text-[30px] font-bold text-[#111827] leading-[1.15] tracking-tight">
              Hallo
              <br />
              Welcome Back
            </h1>
            <p className="mt-1 text-[12px] sm:text-[13px] text-[#94a3b8] font-normal">
              Hey, welcome back to your special place
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-3">
            {/* Field NIK */}
            <div>
              <label className="block text-[11px] font-bold text-[#4b5563] uppercase tracking-wider mb-1">
                NIK
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="SA12345"
                className="w-full h-[38px] sm:h-[40px] px-3.5 bg-[#edf2f9] border border-transparent rounded-xl text-[13px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:bg-white focus:border-[#2563eb] transition-all"
              />
            </div>

            {/* Field Password */}
            <div>
              <label className="block text-[11px] font-bold text-[#4b5563] uppercase tracking-wider mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[38px] sm:h-[40px] pl-3.5 pr-10 bg-[#edf2f9] border border-transparent rounded-xl text-[13px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:bg-white focus:border-[#2563eb] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94a3b8] hover:text-[#64748b] transition-colors focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() =>
                  alert("Silakan hubungi IT Department / Administrator untuk reset password.")
                }
                className="text-[11px] text-[#2563eb] hover:underline font-semibold cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Remember me Checkbox */}
            <div className="flex items-center pt-0.5 pb-0.5">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded-[4px] border-[#cbd5e1] text-[#2563eb] focus:ring-0 cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 text-[12px] text-[#64748b] cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>

            {/* Sign In Button */}
            <div className="pt-0.5">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[38px] sm:h-[40px] bg-[#1d68f0] hover:bg-[#185dd9] active:bg-[#124eb8] text-white text-[13px] font-semibold rounded-xl shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-60 flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Sign In"
                )}
              </button>
            </div>

            {/* Footer Note */}
            <div className="pt-1.5 text-center text-[12px] text-[#64748b]">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() =>
                  alert("Silakan hubungi IT Department untuk pendaftaran akun sistem.")
                }
                className="text-[#1d68f0] hover:underline font-semibold cursor-pointer"
              >
                Report to IT Department
              </button>
            </div>
          </form>
        </div>

        {/* Footer Copyright */}
        <div className="w-full max-w-[340px] pt-3 pb-1 text-center text-[11px] text-[#9ca3af]">
          © 2026 PT Widatra Bhakti. All rights reserved.
        </div>
      </div>

      {/* Sisi Kanan: Inset Card Foto Showcase Gedung / Fasilitas K3 */}
      <div className="hidden md:flex md:w-1/2 h-full p-4 md:p-6 lg:p-8 xl:p-10 items-center justify-center bg-white overflow-hidden">
        <div className="w-full h-full rounded-[28px] overflow-hidden shadow-sm relative border border-slate-100 bg-slate-50">
          <img
            src={resolveImageUrl(loginBgImage)}
            alt="PT Widatra Bhakti"
            className="w-full h-full object-cover object-center select-none"
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
          <div className="p-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl w-64 animate-in fade-in zoom-in-95">
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
                  onClick={() => handleQuickLogin(acc.nik)}
                  className="p-1.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-left transition cursor-pointer"
                >
                  <div className="text-[10px] font-semibold text-slate-800 truncate">{acc.label}</div>
                  <div className="text-[9px] text-slate-400 font-mono">NIK: {acc.nik}</div>
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
