import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText,
  FilePlus2, 
  Files, 
  Clock, 
  BookOpen, 
  LogOut,
  CheckSquare, 
  Activity, 
  ShieldCheck,
  User, 
  Database,
  X,
  Keyboard,
  MapPin,
  ChevronDown,
  ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { api } from "@/services/api";
import { useSidebar } from "@/context/SidebarContext";

// ---------------------------------------------------------------------------
// NAVIGATION SCHEMA TYPES
// ---------------------------------------------------------------------------

export interface NavChildItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles?: string[];
  badge?: string | number;
}

export interface NavParentItem {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles?: string[];
  children: NavChildItem[];
}

export type NavItem = NavChildItem | NavParentItem;

export function isParentItem(item: NavItem): item is NavParentItem {
  return "children" in item && Array.isArray((item as any).children);
}

// ---------------------------------------------------------------------------
// SINGLE NAVIGATION CONFIGURATION
// Struktur hierarki 5 item level atas sesuai instruksi:
// 1. Dashboard (berdiri sendiri)
// 2. Perizinan (induk dropdown -> Ijin Kerja Baru, Ijin Saya, Review Ijin, Riwayat)
// 3. Monitoring (induk dropdown -> Monitoring K3, Peta GIS & Geofence)
// 4. Master Data (berdiri sendiri)
// 5. Profil (berdiri sendiri)
// ---------------------------------------------------------------------------

export const NAVIGATION_CONFIG: NavItem[] = [
  // 1. Dashboard (Standalone)
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["*"],
  },

  // 2. Perizinan (Parent Dropdown / Accordion)
  {
    name: "Perizinan",
    icon: FileText,
    roles: ["*"],
    children: [
      {
        name: "Ijin Kerja Baru",
        href: "/create-request",
        icon: FilePlus2,
        roles: ["admin", "hse", "kontraktor", "contractor", "pemohon", "vendor"],
      },
      {
        name: "Ijin Saya",
        href: "/my-requests",
        icon: Files,
        roles: ["admin", "kontraktor", "contractor", "pemohon", "vendor"],
      },
      {
        name: "Review Ijin",
        href: "/review",
        icon: CheckSquare,
        roles: ["admin", "hse", "ga_dept_head", "ga_div_head", "pic_vendor"],
      },
      {
        name: "Riwayat",
        href: "/history",
        icon: Clock,
        roles: ["admin", "hse", "ga_dept_head", "ga_div_head", "pic_vendor"],
      },
    ],
  },

  // 3. Monitoring (Parent Dropdown / Accordion)
  {
    name: "Monitoring",
    icon: Activity,
    roles: ["admin", "hse", "pic_k3"],
    children: [
      {
        name: "Monitoring K3",
        href: "/monitoring",
        icon: ShieldCheck,
        roles: ["admin", "hse", "pic_k3"],
      },
      {
        name: "Inspeksi K3",
        href: "/inspeksi",
        icon: ClipboardCheck,
        roles: ["admin", "hse", "pic_k3"],
      },
      {
        name: "Peta GIS & Geofence",
        href: "/gis-map",
        icon: MapPin,
        roles: ["admin", "hse", "pic_k3"],
      },
    ],
  },

  // 4. Master Data (Standalone)
  {
    name: "Master Data",
    href: "/master-data",
    icon: Database,
    roles: ["admin", "hse", "ga_dept_head", "ga_div_head"],
  },

  // 5. Profil (Standalone)
  {
    name: "Profil",
    href: "/profile",
    icon: User,
    roles: ["*"],
  },
];

// Helper: Memeriksa apakah role saat ini memiliki akses ke item
function isRoleAllowed(allowedRoles?: string[], currentRole?: string | null): boolean {
  if (!allowedRoles || allowedRoles.includes("*")) return true;
  const rawRole = (currentRole || "pemohon").toLowerCase().trim();
  
  // Normalisasi alias vendor / kontraktor / contractor / pemohon
  const isVendorLike = ["pemohon", "vendor", "kontraktor", "contractor"].includes(rawRole);
  if (isVendorLike && (
    allowedRoles.includes("pemohon") || 
    allowedRoles.includes("vendor") || 
    allowedRoles.includes("kontraktor") || 
    allowedRoles.includes("contractor")
  )) {
    return true;
  }
  
  return allowedRoles.includes(rawRole);
}

// ---------------------------------------------------------------------------
// SIDEBAR COMPONENT
// ---------------------------------------------------------------------------

export function Sidebar() {
  const { isOpen, isPinned, isMobile, closeSidebar } = useSidebar();
  const location = useLocation();
  const pathname = location.pathname;
  const role = auth.getRole();

  // Filter daftar menu berdasarkan izin role pengguna
  const filteredNavItems = useMemo(() => {
    return NAVIGATION_CONFIG.map((item) => {
      if (isParentItem(item)) {
        if (!isRoleAllowed(item.roles, role)) return null;

        // Filter anak yang diizinkan untuk role ini
        const allowedChildren = item.children.filter((child) =>
          isRoleAllowed(child.roles, role)
        );

        // Jika semua anak tidak diizinkan, sembunyikan induknya
        if (allowedChildren.length === 0) return null;

        return {
          ...item,
          children: allowedChildren,
        };
      } else {
        if (!isRoleAllowed(item.roles, role)) return null;
        return item;
      }
    }).filter(Boolean) as NavItem[];
  }, [role]);

  // Status expand/collapse setiap menu induk (accordion)
  const [openParents, setOpenParents] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAVIGATION_CONFIG.forEach((item) => {
      if (isParentItem(item)) {
        const hasActiveChild = item.children.some(
          (child) => pathname === child.href || (child.href !== "/" && pathname.startsWith(child.href))
        );
        if (hasActiveChild) {
          initial[item.name] = true;
        }
      }
    });
    return initial;
  });

  // Otomatis buka menu induk jika salah satu halamannya sedang aktif
  useEffect(() => {
    filteredNavItems.forEach((item) => {
      if (isParentItem(item)) {
        const hasActiveChild = item.children.some(
          (child) => pathname === child.href || (child.href !== "/" && pathname.startsWith(child.href))
        );
        if (hasActiveChild) {
          setOpenParents((prev) => ({
            ...prev,
            [item.name]: true,
          }));
        }
      }
    });
  }, [pathname, filteredNavItems]);

  const toggleParent = (parentName: string) => {
    setOpenParents((prev) => ({
      ...prev,
      [parentName]: !prev[parentName],
    }));
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore network errors on logout
    }
    auth.clearSession();
    window.location.href = "/login";
  };

  const handleNavClick = () => {
    // Tutup sidebar otomatis di mobile atau floating mode saat link halaman diklik
    if (!isPinned || isMobile) {
      closeSidebar();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Header Area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 gap-2 shrink-0">
        <Link to="/dashboard" onClick={handleNavClick} className="flex items-center gap-3 overflow-hidden">
          <img src="/logo.png" alt="HSE Portal Logo" className="h-10 w-auto object-contain scale-125 origin-left ml-1" />
          <div className="truncate">
            <h1 className="text-sm font-bold text-gray-900 leading-tight">HSE Portal</h1>
            <p className="text-[10px] text-gray-500 font-medium">PT Widatra Bhakti</p>
          </div>
        </Link>

        {/* Mobile Close Button only */}
        {isMobile && (
          <button
            type="button"
            onClick={closeSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tutup Menu"
            aria-label="Tutup Menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Nav Items with Accordion Submenu */}
      <nav className="flex-1 px-3 py-3.5 space-y-1.5 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {filteredNavItems.map((item) => {
          if (isParentItem(item)) {
            // RENDER MENU INDUK (ACCORDION / DROPDOWN)
            const isAnyChildActive = item.children.some(
              (child) => pathname === child.href || (child.href !== "/" && pathname.startsWith(child.href))
            );
            const isExpanded = !!openParents[item.name];
            const Icon = item.icon;

            return (
              <div key={item.name} className="space-y-1">
                {/* Tombol Toggle Induk */}
                <button
                  type="button"
                  onClick={() => toggleParent(item.name)}
                  aria-expanded={isExpanded}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none",
                    isAnyChildActive
                      ? "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-2xs"
                      : "text-gray-700 hover:bg-slate-100 hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Icon size={19} className={cn(isAnyChildActive ? "text-primary" : "text-gray-500")} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "shrink-0 transition-transform duration-200",
                      isAnyChildActive ? "text-primary" : "text-gray-400",
                      isExpanded ? "rotate-180" : "rotate-0"
                    )}
                  />
                </button>

                {/* Submenu Accordion dengan Animasi Grid Halus */}
                <div
                  className={cn(
                    "grid transition-all duration-200 ease-in-out overflow-hidden",
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden space-y-1 pl-4 pr-1 pt-1 pb-0.5">
                    <div className="border-l-2 border-slate-200/90 pl-2 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href || (child.href !== "/" && pathname.startsWith(child.href));
                        const ChildIcon = child.icon;

                        return (
                          <Link
                            key={child.name}
                            to={child.href}
                            onClick={handleNavClick}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                              isChildActive
                                ? "bg-primary text-on-primary shadow-xs font-semibold"
                                : "text-gray-600 hover:bg-slate-100 hover:text-gray-900"
                            )}
                          >
                            <ChildIcon
                              size={15}
                              className={cn(isChildActive ? "text-on-primary" : "text-gray-400")}
                            />
                            <span className="truncate">{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          } else {
            // RENDER MENU STANDALONE (BERDIRI SENDIRI)
            const isDashboard = item.href === "/dashboard";
            const isActive = pathname === item.href || (isDashboard && pathname === "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-on-primary shadow-xs font-semibold" 
                    : "text-gray-700 hover:bg-slate-100 hover:text-gray-900"
                )}
              >
                <Icon size={19} className={cn(isActive ? "text-on-primary" : "text-gray-500")} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          }
        })}
      </nav>

      {/* Footer Nav & Shortcut hint */}
      <div className="p-3 border-t border-gray-200 space-y-1 shrink-0">
        <Link
          to="/profile"
          onClick={handleNavClick}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-slate-100 transition-colors"
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
