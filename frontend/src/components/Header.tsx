import { useState, useEffect } from "react";
import { Bell, HardHat } from "lucide-react";
import { Link } from "react-router-dom";
import { auth } from "@/lib/auth";
import { HamburgerButton } from "@/components/HamburgerButton";

interface HeaderProps {
  title?: string;
  onMobileMenuToggle?: () => void;
}

export function Header({ title = "HSE Portal" }: HeaderProps) {
  const [user, setUser] = useState<any>(() => auth.getUser());
  const [role, setRole] = useState<string | null>(() => auth.getRole());
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const handleUserUpdate = (e: any) => {
      setUser(e.detail || auth.getUser());
      setRole(auth.getRole());
      setImgError(false);
    };

    window.addEventListener("auth:user-updated", handleUserUpdate);
    return () => {
      window.removeEventListener("auth:user-updated", handleUserUpdate);
    };
  }, []);

  const displayName = user?.name || 'Pengguna';
  const displayRole = user?.role?.name || user?.company_name || role || 'User';

  return (
    <header className="h-16 flex items-center justify-between px-3 sm:px-6 bg-white border-b border-gray-200 select-none z-10 flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
        {/* Smart Animated Hamburger Button */}
        <HamburgerButton />
        <h2 className="text-sm sm:text-lg font-bold text-gray-900 truncate tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-5 flex-shrink-0">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:bg-surface-variant rounded-full transition-colors cursor-pointer">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[9px] font-bold text-on-error ring-2 ring-white">
            1
          </span>
        </button>

        {/* Profile */}
        <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 font-bold">
              {displayRole}
            </p>
          </div>
          {user?.avatar && !imgError ? (
            <img 
              src={user.avatar} 
              alt={displayName} 
              onError={() => setImgError(true)}
              className="h-10 w-10 rounded-full object-cover shadow-sm border border-gray-200 ring-2 ring-primary/20"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary font-bold shadow-sm">
              <HardHat size={20} />
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
