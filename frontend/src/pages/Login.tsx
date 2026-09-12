import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, HardHat, UserCheck, Building, KeyRound, AlertCircle, ArrowRight } from "lucide-react";
import { api } from "@/services/api";

const DEMO_ACCOUNTS = [
  { role: "pemohon", label: "Vendor (Pemohon)", email: "vendor@hse.com", icon: HardHat, color: "border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100/60" },
  { role: "pic_vendor", label: "PIC Vendor", email: "pic@hse.com", icon: UserCheck, color: "border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100/60" },
  { role: "hse", label: "Tim K3 / HSE", email: "hse@hse.com", icon: ShieldCheck, color: "border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100/60" },
  { role: "ga_dept_head", label: "GA Dept Head", email: "ga_dept@hse.com", icon: Building, color: "border-amber-200 bg-amber-50/60 text-amber-700 hover:bg-amber-100/60" },
  { role: "ga_div_head", label: "GA Div Head", email: "ga_div@hse.com", icon: Building, color: "border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100/60" },
  { role: "admin", label: "Administrator", email: "admin@hse.com", icon: KeyRound, color: "border-purple-200 bg-purple-50/60 text-purple-700 hover:bg-purple-100/60" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await api.login(loginEmail, loginPass);
      if (res.success && res.data) {
        sessionStorage.setItem("authToken", res.data.token);
        sessionStorage.setItem("userRole", res.data.user.role.code);
        sessionStorage.setItem("userData", JSON.stringify(res.data.user));
        navigate("/dashboard");
      } else {
        setErrorMsg(res.message || "Login gagal, silakan periksa kredensial Anda.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      // Fallback local simulation if backend server is unreachable
      const matched = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === loginEmail.toLowerCase());
      if (matched) {
        sessionStorage.setItem("userRole", matched.role);
        sessionStorage.setItem("userData", JSON.stringify({ name: matched.label, email: matched.email }));
        navigate("/dashboard");
      } else {
        setErrorMsg(err.message || "Gagal terhubung ke server backend atau email/password salah.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Harap masukkan email dan password.");
      return;
    }
    performLogin(email, password);
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    performLogin(demoEmail, "password123");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 mb-4">
          <ShieldCheck size={36} />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Digital Work Permit
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          HSE Safety Monitoring & Work Permit System — PT Widatra Bhakti
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 sm:px-10">
          
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Form Login Nyata */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@hse.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Masuk ke Sistem <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Selector */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              Atau Gunakan Akun Demo Cepat (1-Klik)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleQuickLogin(acc.email)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${acc.color}`}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="truncate">{acc.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Password default akun demo: <code className="text-slate-600 font-bold">password123</code>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
