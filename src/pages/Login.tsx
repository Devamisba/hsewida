import { useNavigate } from "react-router-dom";
import { ShieldCheck, HardHat, UserCheck, Building } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (role: 'pemohon' | 'pic_vendor' | 'hse' | 'ga_dept_head' | 'ga_div_head') => {
    sessionStorage.setItem('userRole', role);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-10 flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-on-primary mb-6 shadow-md">
          <ShieldCheck size={48} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight text-center">Digital Work Permit</h1>
        <p className="text-gray-500 mt-2 text-center max-w-sm">Pilih peran Anda untuk masuk ke dalam sistem</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full max-w-7xl">
        {/* Role Pemohon */}
        <button 
          onClick={() => handleLogin('pemohon')}
          className="group bg-white border-2 border-transparent hover:border-primary p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center cursor-pointer"
        >
          <div className="h-16 w-16 bg-info-container text-on-info-container rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <HardHat size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Vendor</h2>
          <p className="text-xs text-gray-500">(Pemohon)</p>
        </button>

        {/* Role PIC Vendor */}
        <button 
          onClick={() => handleLogin('pic_vendor')}
          className="group bg-white border-2 border-transparent hover:border-primary p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center cursor-pointer"
        >
          <div className="h-16 w-16 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <UserCheck size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">PIC Vendor</h2>
          <p className="text-xs text-gray-500">(Penanggung Jawab Internal)</p>
        </button>

        {/* Role HSE */}
        <button 
          onClick={() => handleLogin('hse')}
          className="group bg-white border-2 border-transparent hover:border-primary p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center cursor-pointer"
        >
          <div className="h-16 w-16 bg-success-container text-on-success-container rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">HSE</h2>
          <p className="text-xs text-gray-500">Review & Persetujuan Keselamatan</p>
        </button>

        {/* Role GA Dept Head */}
        <button 
          onClick={() => handleLogin('ga_dept_head')}
          className="group bg-white border-2 border-transparent hover:border-primary p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center cursor-pointer"
        >
          <div className="h-16 w-16 bg-warning-container text-on-warning-container rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Building size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">GA Dept Head</h2>
          <p className="text-xs text-gray-500">(P Andaru)</p>
        </button>

        {/* Role GA Div Head */}
        <button 
          onClick={() => handleLogin('ga_div_head')}
          className="group bg-white border-2 border-transparent hover:border-primary p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center cursor-pointer"
        >
          <div className="h-16 w-16 bg-error-container text-on-error-container rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Building size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">GA Div Head</h2>
          <p className="text-xs text-gray-500">(P Effendy)</p>
        </button>
      </div>
    </div>
  );
}
