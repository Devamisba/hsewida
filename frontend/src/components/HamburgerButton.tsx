import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";

interface HamburgerButtonProps {
  className?: string;
}

export function HamburgerButton({ className }: HamburgerButtonProps) {
  const { isOpen, isPinned, toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      type="button"
      className={cn(
        "relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer select-none",
        "hover:bg-slate-100 active:scale-95 text-slate-700 hover:text-slate-900",
        isOpen && !isPinned ? "bg-slate-100 text-primary" : "",
        className
      )}
      title={`Menu Navigasi Sidebar (Tekan Ctrl + B untuk toggle cepat)`}
      aria-label="Toggle Sidebar Navigation"
      aria-expanded={isOpen}
    >
      {/* Dynamic Animated 3-Bar Hamburger */}
      <div className="w-5 h-4 relative flex flex-col justify-between items-center pointer-events-none">
        {/* Top Bar */}
        <span
          className={cn(
            "w-5 h-0.5 bg-current rounded-full transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-center",
            isOpen ? "translate-y-[7px] rotate-45" : ""
          )}
        />
        {/* Middle Bar */}
        <span
          className={cn(
            "w-5 h-0.5 bg-current rounded-full transition-all duration-200 ease-out origin-left",
            isOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
          )}
        />
        {/* Bottom Bar */}
        <span
          className={cn(
            "w-5 h-0.5 bg-current rounded-full transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-center",
            isOpen ? "-translate-y-[7px] -rotate-45" : ""
          )}
        />
      </div>

      {/* Subtle indicator dot when pinned on desktop */}
      {isPinned && isOpen && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"
          title="Sidebar Terkunci (Pinned)"
        />
      )}
    </button>
  );
}
