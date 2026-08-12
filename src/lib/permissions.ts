import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/constants";
import type { Session } from "next-auth";

export class PermissionError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "PermissionError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "The requested record was not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Returns the current session or redirects to login when unauthenticated. */
export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/** Returns the current session or null. Safe for public pages. */
export async function getSessionOrNull(): Promise<Session | null> {
  const session = await auth();
  return session?.user ? session : null;
}

/** Throws PermissionError unless the user has the given permission. */
export function requirePermission(session: Session, permission: string): void {
  const perms = session.user?.permissions ?? [];
  if (isSuperAdmin(session.user?.roleKey)) return;
  if (!perms.includes(permission)) throw new PermissionError();
}

/** Throws PermissionError unless the user has one of the given permissions. */
export function requireAnyPermission(session: Session, permissions: string[]): void {
  const perms = session.user?.permissions ?? [];
  if (isSuperAdmin(session.user?.roleKey)) return;
  if (!permissions.some((p) => perms.includes(p))) throw new PermissionError();
}

/** Throws PermissionError unless the user has one of the given roles. */
export function requireRole(session: Session, roles: string[]): void {
  if (!roles.includes(session.user?.roleKey ?? "")) throw new PermissionError();
}

/** True when the session belongs to a super admin. */
export function hasSuperAdmin(session: Session | null): boolean {
  return isSuperAdmin(session?.user?.roleKey);
}

export function can(session: Session | null, permission: string): boolean {
  if (!session?.user) return false;
  if (isSuperAdmin(session.user.roleKey)) return true;
  return (session.user.permissions ?? []).includes(permission);
}
