import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a money amount in the given ISO currency. */
export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Format an ISO date string as e.g. "12 Jun 2026". */
export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Relative day count to a future date, e.g. "in 30 days" / "overdue by 4 days". */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  // Note: callers pass `today` from the request for deterministic rendering.
  return Math.round((d - Date.now()) / 86_400_000);
}

/** Initials from a full name, e.g. "Mei Lin Chow" -> "MC". */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Stable pseudo-id generator for fixtures / optimistic UI (not crypto). */
export function shortId(prefix = "id") {
  return `${prefix}_${Math.abs(hashString(prefix + performanceNow())).toString(36).slice(0, 8)}`;
}

function performanceNow() {
  return typeof performance !== "undefined" ? performance.now() : 0;
}

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

export function titleCase(s: string) {
  return s.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());
}
