import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateInclusiveDays(startDate?: string, endDate?: string): number {
  if (!startDate || !endDate) return 0;
  try {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
  } catch {
    return 0;
  }
}

export function formatPermitStatus(status?: string | null): string {
  if (!status) return "";
  if (status === "Menunggu PIC Vendor") return "Menunggu PIC Widatra";
  return status;
}

export function formatDateDDMMYY(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const clean = String(dateStr).slice(0, 10);
    const parts = clean.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      const yy = year.length === 4 ? year.slice(-2) : year;
      return `${day}/${month}/${yy}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = String(d.getFullYear()).slice(-2);
      return `${dd}/${mm}/${yy}`;
    }
    return dateStr;
  } catch {
    return dateStr || "-";
  }
}
