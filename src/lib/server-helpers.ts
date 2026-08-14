import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { db } from "@/lib/db";
import { NotFoundError, PermissionError } from "@/lib/permissions";

/** Returns the schoolId scoped to the session, or null for super admins. */
export function schoolIdOf(session: Session | null): string | null {
  return session?.user?.schoolId ?? null;
}

/** Like schoolIdOf but redirects non-super-admin users without a school. */
export function getSchoolId(session: Session): string {
  const schoolId = session.user.schoolId;
  if (!schoolId) redirect("/admin");
  return schoolId;
}

export function isSuperAdminSession(session: Session): boolean {
  return session.user.roleKey === "super_admin";
}

/** Throws unless the record belongs to the given school (or the user is a super admin). */
export function assertSchoolScoped(schoolId: string | null, recordSchoolId: string | undefined): void {
  if (!schoolId) return;
  if (recordSchoolId !== schoolId) throw new NotFoundError();
}

export function toBool(v: unknown): boolean {
  return v === "true" || v === "on" || v === "1";
}

export function toInt(v: unknown, fallback = 0): number {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function toFloat(v: unknown, fallback = 0): number {
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

export function toStr(v: unknown): string {
  return String(v ?? "").trim();
}

export function toDate(v: unknown): Date | null {
  const s = toStr(v);
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Casts a string to one of the allowed enum values (with fallback). */
export function enumOf<T extends readonly string[]>(
  value: string,
  allowed: T,
  fallback: T[number]
): T[number] {
  return allowed.includes(value) ? (value as T[number]) : fallback;
}

/** True when the value is empty or a valid http(s) URL. */
export function isValidHttpUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  try {
    const url = new URL(v);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function assertPermission(session: Session, permission: string): void {
  const perms = session.user?.permissions ?? [];
  if (session.user.roleKey === "super_admin") return;
  if (!perms.includes(permission)) throw new PermissionError();
}

/** Current academic year + term for a school (falls back to any). */
export async function getCurrentYearAndTerm(schoolId: string) {
  const year = await db.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
    orderBy: { createdAt: "desc" },
  });
  const term = await db.term.findFirst({
    where: { schoolId, academicYearId: year?.id ?? undefined, isCurrent: true },
    orderBy: { createdAt: "desc" },
  });
  return { year, term };
}
