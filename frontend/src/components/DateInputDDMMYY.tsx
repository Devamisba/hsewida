import { useRef } from "react";
import type { ChangeEvent } from "react";
import { Calendar } from "lucide-react";
import { cn, formatDateDDMMYY } from "@/lib/utils";

interface DateInputDDMMYYProps {
  id?: string;
  value?: string; // Format ISO: YYYY-MM-DD
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DateInputDDMMYY({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = "dd/mm/yy",
  required = false,
  disabled = false,
  className,
}: DateInputDDMMYYProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const displayFormatted = value ? formatDateDDMMYY(value) : "";

  const handleOpenPicker = () => {
    if (disabled) return;
    if (dateInputRef.current) {
      try {
        if (typeof (dateInputRef.current as any).showPicker === "function") {
          (dateInputRef.current as any).showPicker();
        } else {
          dateInputRef.current.focus();
          dateInputRef.current.click();
        }
      } catch {
        dateInputRef.current.focus();
      }
    }
  };

  return (
    <div className="relative group">
      {/* Hidden Native Date Input for Accessibility & Native Datepicker */}
      <input
        ref={dateInputRef}
        type="date"
        id={id ? `${id}-hidden` : undefined}
        value={value || ""}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        onChange={onChange}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 pointer-events-auto"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Visible Formatted Input displaying strictly dd/mm/yy */}
      <div
        onClick={handleOpenPicker}
        className={cn(
          "w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white group-hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 flex items-center justify-between transition-colors shadow-2xs cursor-pointer select-none",
          disabled && "bg-slate-100 cursor-not-allowed opacity-60",
          className
        )}
      >
        <span
          className={cn(
            "text-sm font-medium font-sans tracking-wide",
            displayFormatted ? "text-slate-900 font-semibold" : "text-slate-400"
          )}
        >
          {displayFormatted || placeholder}
        </span>

        <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0">
          <span className="text-[10px] font-mono font-semibold px-1 py-0.5 bg-slate-100 rounded text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
            dd/mm/yy
          </span>
          <Calendar size={18} />
        </div>
      </div>
    </div>
  );
}
