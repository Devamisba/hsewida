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
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { api } from "@/services/api";

const kontraktorNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ijin Kerja Baru", href: "/create-request", icon: FilePlus2 },
  { name: "Ijin Saya", href: "/my-requests", icon: Files },
  { name: "History", href: "/history", icon: Clock },
  { name: "Profil", href: "/profile", icon: User },
];

const hseNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ijin Kerja Baru", href: "/create-request", icon: FilePlus2 },
  { name: "Review Ijin", href: "/review", icon: CheckSquare },
  { name: "Monitoring K3", href: "/monitoring", icon: Activity },
  { name: "Master Data", href: "/master-data", icon: Database },
  { name: "History", href: "/history", icon: Clock },
  { name: "Profil", href: "/profile", icon: User },
];

const gaNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Review Ijin", href: "/review", icon: CheckSquare }, 
  { name: "Master Data", href: "/master-data", icon: Database },
  { name: "History", href: "/history", icon: Clock },
  { name: "Profil", href: "/profile", icon: User },
];

const picVendorNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Review Ijin", href: "/review", icon: CheckSquare }, 
  { name: "History", href: "/history", icon: Clock },
  { name: "Profil", href: "/profile", icon: User },
];

const adminNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ijin Kerja Baru", href: "/create-request", icon: FilePlus2 },
  { name: "Ijin Saya", href: "/my-requests", icon: Files },
  { name: "Review Ijin", href: "/review", icon: CheckSquare },
  { name: "Monitoring K3", href: "/monitoring", icon: Activity },
  { name: "Master Data", href: "/master-data", icon: Database },
  { name: "History", href: "/history", icon: Clock },
  { name: "Profil", href: "/profile", icon: User },
];

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  
  const role = auth.getRole();
  let navItems = kontraktorNav;
  if (role === 'hse') navItems = hseNav;
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

  return (
    <aside className="hidden md:flex flex-col w-[280px] h-screen border-r border-gray-200 bg-white flex-shrink-0">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 gap-3">
        <img src="/logo.png" alt="HSE Portal Logo" className="h-12 w-auto object-contain scale-150 origin-left ml-1" />
        <div>
          <h1 className="text-sm font-bold text-gray-900 leading-tight">HSE Portal</h1>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                isActive 
                  ? "bg-primary text-on-primary shadow-sm" 
                  : "text-gray-700 hover:bg-surface-variant hover:text-gray-900"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-on-primary" : "text-gray-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Nav */}
      <div className="p-4 border-t border-gray-200 space-y-1">
        <Link
          to="/panduan"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-surface-variant transition-colors"
        >
          <BookOpen size={20} className="text-gray-500" />
          Panduan Sistem
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer"
        >
          <LogOut size={20} className="text-gray-500" />
          Logout
        </button>
      </div>
    </aside>
  );
}
