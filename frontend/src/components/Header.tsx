import { Bell, HardHat, Menu } from "lucide-react";
import { Link } from "react-router-dom";

interface HeaderProps {
  title?: string;
  onMobileMenuToggle?: () => void;
}

export function Header({ title = "HSE Portal", onMobileMenuToggle }: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:bg-surface-variant rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[9px] font-bold text-on-error ring-2 ring-white">
            1
          </span>
        </button>

        {/* Profile */}
        <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {sessionStorage.getItem('userRole') === 'hse' ? 'Tim HSE' : 
               sessionStorage.getItem('userRole') === 'ga_dept_head' ? 'P. Andaru' : 
               sessionStorage.getItem('userRole') === 'ga_div_head' ? 'P. Effendy' : 
               sessionStorage.getItem('userRole') === 'pic_vendor' ? 'PIC Vendor Widatra' : 'PT. Maju Mundur'}
            </p>
            <p className="text-xs text-gray-500 font-bold">
              {sessionStorage.getItem('userRole') === 'hse' ? 'PIC HSE' : 
               sessionStorage.getItem('userRole') === 'ga_dept_head' ? 'HRD & GA Dept Head' : 
               sessionStorage.getItem('userRole') === 'ga_div_head' ? 'HRD & GA Div Head' : 
               sessionStorage.getItem('userRole') === 'pic_vendor' ? 'Penanggung Jawab' : 'Vendor'}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary font-bold shadow-sm">
            <HardHat size={20} />
          </div>
        </Link>
      </div>
    </header>
  );
}
