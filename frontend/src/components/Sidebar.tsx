import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FilePlus2, 
  Files, 
  Clock, 
  BookOpen, 
  LogOut,
  CheckSquare, 
  Activity, 
  User, 
  Database,
  Pin,
  PinOff,
  X,
  Keyboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { api } from "@/services/api";
import { useSidebar } from "@/context/SidebarContext";

const kontraktorNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ijin Kerja Baru", href: "/create-request", icon: FilePlus2 },
  { name: "Ijin Saya", href: "/my-requests", icon: Files },
  { name: "Riwayat", href: "/history", icon: Clock },
  { name: "Profil", href: "/profile", icon: User },
];

const hseNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ijin Kerja Baru", href: "/create-request", icon: FilePlus2 },
  { name: "Review Ijin", href: "/review", icon: CheckSquare },
  { name: "Monitoring K3", href: "/monitoring", icon: Activity },
  { name: "Master Data", href: "/master-data", icon: Database },
  { name: "Riwayat", href: "/history", icon: Clock },
  { name: "Profil", href: "/profile", icon: User },
];

const picK3Nav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Monitoring K3", href: "/monitoring", icon: Activity },
  { name: "Riwayat", href: "/history", icon: Clock },
  { name: "Profil", href: "/profile", icon: User },
];

const gaNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Review Ijin", href: "/review", icon: CheckSquare }, 
  { name: "Master Data", href: "/master-data", icon: Database },
  { name: "Riwayat", href: "/history", icon: Clock },
  { name: "Profil", href: "/profile", icon: User },
];

const picVendorNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Review Ijin", href: "/review", icon: CheckSquare }, 
  { name: "Riwayat", href: "/history", icon: Clock },
  { name: "Profil", href: "/profile", icon: User },
];

const adminNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ijin Kerja Baru", href: "/create-request", icon: FilePlus2 },
  { name: "Ijin Saya", href: "/my-requests", icon: Files },
  { name: "Review Ijin", href: "/review", icon: CheckSquare },
  { name: "Monitoring K3", href: "/monitoring", icon: Activity },
  { name: "Master Data", href: "/master-data", icon: Database },
  { name: "Riwayat", href: "/history", icon: Clock },
  { name: "Profil", href: "/profile", icon: User },
];

export function Sidebar() {
  const { isOpen, isPinned, isMobile, closeSidebar, togglePin } = useSidebar();
  const location = useLocation();
  const pathname = location.pathname;
  
  const role = auth.getRole();
  let navItems = kontraktorNav;
  if (role === 'hse') navItems = hseNav;
  else if (role === 'pic_k3') navItems = picK3Nav;
  else if (role === 'ga_dept_head' || role === 'ga_div_head') navItems = gaNav;
  else if (role === 'pic_vendor') navItems = picVendorNav;
  else if (role === 'admin') navItems = adminNav;

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore network errors on logout
    }
    auth.clearSession();
    window.location.href = '/login';
  };

  const handleNavClick = () => {
    // If floating or mobile, close sidebar upon clicking a route
    if (!isPinned || isMobile) {
      closeSidebar();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Header Area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 gap-2">
        <Link to="/dashboard" onClick={handleNavClick} className="flex items-center gap-3 overflow-hidden">
          <img src="/logo.png" alt="HSE Portal Logo" className="h-10 w-auto object-contain scale-125 origin-left ml-1" />
          <div className="truncate">
            <h1 className="text-sm font-bold text-gray-900 leading-tight">HSE Portal</h1>
            <p className="text-[10px] text-gray-500 font-medium">PT Widatra Bhakti</p>
          </div>
        </Link>

        {/* Action Controls: Pin & Close */}
        <div className="flex items-center gap-1">
          {!isMobile && (
            <button
              type="button"
              onClick={togglePin}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                isPinned 
                  ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" 
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              )}
              title={isPinned ? "Lepaskan Kunci (Mode Mengambang / Floating)" : "Kunci Posisi Sidebar (Pinned)"}
            >
              {isPinned ? <Pin size={16} className="fill-emerald-600" /> : <PinOff size={16} />}
            </button>
          )}

          <button
            type="button"
            onClick={closeSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tutup Menu Sidebar (Ctrl + B)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary text-on-primary shadow-xs font-semibold" 
                  : "text-gray-700 hover:bg-surface-variant hover:text-gray-900"
              )}
            >
              <item.icon size={19} className={cn(isActive ? "text-on-primary" : "text-gray-500")} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Nav & Shortcut hint */}
      <div className="p-3 border-t border-gray-200 space-y-1">
        <Link
          to="/profile"
          onClick={handleNavClick}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-surface-variant transition-colors"
        >
          <BookOpen size={16} className="text-gray-500" />
          <span>Panduan Sistem</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut size={16} className="text-rose-500" />
          <span>Keluar Akun</span>
        </button>

        {/* Keyboard shortcut hint */}
        {!isMobile && (
          <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 px-3 font-mono">
            <span className="flex items-center gap-1">
              <Keyboard size={12} />
              <span>Toggle:</span>
            </span>
            <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-semibold">
              Ctrl + B
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // 1. Mobile Drawer OR Floating Mode (When NOT pinned or on Mobile screen)
  if (!isPinned || isMobile) {
    return (
      <>
        {/* Backdrop blur overlay */}
        <div
          onClick={closeSidebar}
          aria-hidden="true"
          className={cn(
            "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out cursor-pointer",
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        />

        {/* Floating Off-canvas Drawer */}
        <aside
          aria-label="Navigation Drawer"
          className={cn(
            "fixed top-0 left-0 h-screen w-[270px] z-50 bg-white border-r border-gray-200 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  // 2. Desktop Pinned Docked Mode (Pushes content)
  return (
    <aside
      aria-label="Sidebar Navigation"
      className={cn(
        "hidden lg:block h-screen border-r border-gray-200 bg-white flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden",
        isOpen ? "w-[270px]" : "w-0 border-r-0"
      )}
    >
      <div className="w-[270px] h-full">
        {sidebarContent}
      </div>
    </aside>
  );
}
