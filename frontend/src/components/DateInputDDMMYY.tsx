import { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { Calendar } from "lucide-react";
import { cn, formatDateDDMMYY } from "@/lib/utils";

interface DateInputDDMMYYProps {
  id?: string;
  value?: string; // Format ISO: YYYY-MM-DD
  onChange: (e: any) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// Helper: parse string dd/mm/yy or dd/mm/yyyy into ISO yyyy-mm-dd
function parseDDMMYYToISO(text: string): string | null {
  const clean = text.trim();
  // Match DD/MM/YY or DD/MM/YYYY or DD-MM-YY or DD-MM-YYYY
  const match = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  let year = parseInt(match[3], 10);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // Convert 2-digit year to 4-digit (e.g. 26 -> 2026)
  if (year < 100) {
    year = 2000 + year;
  }

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const iso = `${year}-${mm}-${dd}`;

  // Validate actual date
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;

  return iso;
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
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  // Local text input state for free typing
  const [inputText, setInputText] = useState<string>(() => {
    return value ? formatDateDDMMYY(value) : "";
  });

  // Sync whenever parent value changes externally
  useEffect(() => {
    if (value) {
      setInputText(formatDateDDMMYY(value));
    } else {
      setInputText("");
    }
  }, [value]);

  // Handle open native calendar picker
  const handleOpenCalendar = () => {
    if (disabled) return;
    if (hiddenDateRef.current) {
      try {
        if (typeof (hiddenDateRef.current as any).showPicker === "function") {
          (hiddenDateRef.current as any).showPicker();
        } else {
          hiddenDateRef.current.focus();
          hiddenDateRef.current.click();
        }
      } catch {
        hiddenDateRef.current.focus();
      }
    }
  };

  // When date is chosen from calendar
  const handleNativeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newIso = e.target.value;
    onChange({ target: { value: newIso, id, name: id } });
    setInputText(newIso ? formatDateDDMMYY(newIso) : "");
  };

  // When user types manually in the text input
  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);

    // Try parsing if user typed complete date
    const parsedIso = parseDDMMYYToISO(raw);
    if (parsedIso) {
      onChange({ target: { value: parsedIso, id, name: id } });
    } else if (raw === "") {
      onChange({ target: { value: "", id, name: id } });
    }
  };

  // On blur, format nicely if valid, or restore previous valid state
  const handleBlur = () => {
    if (!inputText.trim()) {
      onChange({ target: { value: "", id, name: id } });
      setInputText("");
      return;
    }

    const parsedIso = parseDDMMYYToISO(inputText);
    if (parsedIso) {
      onChange({ target: { value: parsedIso, id, name: id } });
      setInputText(formatDateDDMMYY(parsedIso));
    } else if (value) {
      // Revert to valid value if typed text was invalid
      setInputText(formatDateDDMMYY(value));
    }
  };

  return (
    <div className="relative flex items-center">
      {/* Hidden Native Date Input for Datepicker Window */}
      <input
        ref={hiddenDateRef}
        type="date"
        id={id ? `${id}-native` : undefined}
        value={value || ""}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        onChange={handleNativeChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Visible Interactive Text Input (User can TYPE or click calendar) */}
      <input
        type="text"
        id={id}
        name={id}
        value={inputText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="off"
        className={cn(
          "w-full pl-3.5 pr-20 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs",
          disabled && "bg-slate-100 cursor-not-allowed opacity-60 text-slate-500",
          className
        )}
      />

      {/* Calendar Button & Badge at Right */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
        <span className="text-[10px] font-mono font-semibold px-1 py-0.5 bg-slate-100 rounded text-slate-500 select-none hidden sm:inline-block">
          dd/mm/yy
        </span>
        <button
          type="button"
          onClick={handleOpenCalendar}
          disabled={disabled}
          title="Buka kalender pemilih tanggal"
          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
        >
          <Calendar size={18} />
        </button>
      </div>
    </div>
  );
}
