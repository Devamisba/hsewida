import { useState, useEffect } from "react";
import { Eye, EyeOff, AlertCircle, Sparkles, X } from "lucide-react";
import { api } from "@/services/api";
import { auth } from "@/lib/auth";

const DEMO_ACCOUNTS = [
  { role: "admin", label: "Admin", nik: "SA12345" },
  { role: "pemohon", label: "Vendor (Pemohon)", nik: "VN10001" },
  { role: "pic_vendor", label: "PIC Vendor", nik: "PC10002" },
  { role: "hse", label: "Tim K3 / HSE", nik: "HS10003" },
  { role: "ga_dept_head", label: "GA Dept Head", nik: "GA10004" },
  { role: "ga_div_head", label: "GA Div Head", nik: "GA10005" },
];

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Auto-redirect if user already has an active session (persistent session like Facebook/Google)
  useEffect(() => {
    if (auth.isAuthenticated()) {
      window.location.href = "/dashboard";
    }
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
    setPassword("password123");
    setShowDemoModal(false);
    performLogin(demoNik, "password123");
  };

  return (
    <div className="h-screen w-screen flex bg-white font-sans antialiased overflow-hidden">
      {/* Sisi Kiri: Form Login */}
      <div className="w-full md:w-1/2 h-full bg-white flex flex-col justify-center items-center md:items-end md:pr-10 lg:pr-12 px-6 overflow-hidden">
        <div className="w-full max-w-[325px]">
          {/* Logo PT Widatra Bhakti */}
          <div className="mb-4">
            <img
              src="/widatra-logo.png"
              alt="PT WIDATRA BHAKTI"
              className="h-6 w-auto object-contain"
            />
          </div>

          {/* Heading */}
          <div className="mb-5">
            <h1 className="text-[28px] sm:text-[30px] font-bold text-[#111827] leading-[1.15] tracking-tight">
              Salam
              <br />
              Welcome Back
            </h1>
            <p className="mt-1 text-[13px] text-[#8c9ba5] font-normal">
              Hey, welcome back to your special place
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-red-700 text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleFormSubmit}>
            {/* Field NIK */}
            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-[#64748b] mb-1">
                NIK (Nomor Induk Karyawan / Rekanan)
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Contoh: SA12345, VN10001"
                className="w-full h-[34px] px-3 bg-[#e8f0fe] border border-transparent rounded-[5px] text-[13px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:bg-white focus:border-[#3b82f6] transition-all"
              />
            </div>

            {/* Field Password */}
            <div className="mb-1">
              <label className="block text-[11px] font-semibold text-[#64748b] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[34px] pl-3 pr-8 bg-[#e8f0fe] border border-transparent rounded-[5px] text-[13px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:bg-white focus:border-[#3b82f6] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#94a3b8] hover:text-[#64748b] transition-colors focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={() =>
                  alert("Silakan hubungi IT Department / Administrator untuk reset password.")
                }
                className="text-[11px] text-[#2563eb] hover:underline font-medium cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Remember me Checkbox */}
            <div className="flex items-center mb-4">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded-[3px] border-[#cbd5e1] text-[#2563eb] focus:ring-0 cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 text-[11px] text-[#64748b] cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>

            {/* Sign In Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[34px] bg-[#1d68f0] hover:bg-[#185dd9] active:bg-[#124eb8] text-white text-[13px] font-semibold rounded-[5px] shadow-sm transition-colors duration-150 cursor-pointer disabled:opacity-60 flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          {/* Footer Note */}
          <div className="mt-4 text-center text-[11px] text-[#64748b]">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() =>
                alert("Silakan hubungi IT Department untuk pendaftaran akun sistem.")
              }
              className="text-[#1d68f0] hover:underline font-medium cursor-pointer"
            >
              Report to IT Department
            </button>
          </div>
        </div>
      </div>

      {/* Sisi Kanan: Foto Gedung (Natural Aspect Ratio, Tanpa Zooming / Distorsi) */}
      <div className="hidden md:flex md:w-1/2 h-full bg-[#f2f7fd] items-center justify-start overflow-hidden relative select-none">
        <img
          src="/widatra-building.jpg"
          alt="PT Widatra Bhakti"
          className="h-full w-auto object-cover object-left pointer-events-none"
        />
      </div>

      {/* Floating Demo Picker (Bantuan Uji Coba Cepat tanpa Mengganggu Layout) */}
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
      </div>
    </div>
  );
}
