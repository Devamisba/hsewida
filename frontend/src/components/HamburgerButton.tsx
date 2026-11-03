import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import { Menu, PanelLeftClose } from "lucide-react";

interface HamburgerButtonProps {
  className?: string;
}

export function HamburgerButton({ className }: HamburgerButtonProps) {
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      type="button"
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 cursor-pointer select-none",
        "text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 border border-slate-200/60 shadow-2xs",
        isOpen ? "bg-slate-100 text-slate-900" : "bg-white",
        className
      )}
      title={isOpen ? "Sembunyikan Sidebar Navigasi (Ctrl + B)" : "Tampilkan Sidebar Navigasi (Ctrl + B)"}
      aria-label="Toggle Sidebar Navigation"
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <PanelLeftClose size={19} className="text-slate-700" />
      ) : (
        <Menu size={19} className="text-slate-700" />
      )}
    </button>
  );
}
