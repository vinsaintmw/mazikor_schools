// Formatting + validation helpers

// Accepts plain numbers/strings as well as Prisma's Decimal (structural { toNumber() }).
export type NumericInput = number | string | { toNumber(): number } | null | undefined;

function toNumber(v: NumericInput): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (typeof v === "number") return v;
  return v.toNumber();
}

export function formatMoney(amount: NumericInput, currency = "MK"): string {
  return `${currency} ${new Intl.NumberFormat("en-MW", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(toNumber(amount))}`;
}

export function formatNumber(n: NumericInput): string {
  return new Intl.NumberFormat("en-MW").format(toNumber(n));
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-MW", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-MW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function toDecimal(value: string | number): number {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

export function fullName(first?: string | null, middle?: string | null, last?: string | null): string {
  return [first, middle, last].filter(Boolean).join(" ") || "—";
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isPhoneMW(v: string): boolean {
  return /^(\+?265|0)?[0-9]{9}$/.test(v.replace(/[\s-]/g, ""));
}

export function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}

export function paginationDefaults(searchParams: { [key: string]: string | string[] | undefined }) {
  const sp = (k: string, fallback = "") => {
    const v = searchParams[k];
    return Array.isArray(v) ? v[0] : (v ?? fallback);
  };
  const page = Math.max(1, parseInt(sp("page", "1"), 10) || 1);
  const perPage = Math.min(100, Math.max(5, parseInt(sp("perPage", "10"), 10) || 10));
  const search = sp("search", "").trim();
  const status = sp("status", "");
  const q = sp("q", "");
  return { page, perPage, search: search || q, status, skip: (page - 1) * perPage };
}
