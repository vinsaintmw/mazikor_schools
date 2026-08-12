import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { Session } from "next-auth";

/** Writes an audit log entry. Safe to call anywhere (never throws). */
export async function auditLog(entry: {
  schoolId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
}) {
  try {
    await db.auditLog.create({
      data: {
        schoolId: entry.schoolId ?? null,
        userId: entry.userId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        details: (entry.details ?? null) as unknown as
          | Prisma.NullableJsonNullValueInput
          | Prisma.InputJsonValue,
      },
    });
  } catch {
    // audit logging must never break the primary flow
  }
}

export function auditor(session: Session | null) {
  const userId = session?.user?.id ?? null;
  const schoolId = session?.user?.schoolId ?? null;
  return {
    log: (entry: Omit<Parameters<typeof auditLog>[0], "userId" | "schoolId">) =>
      auditLog({ ...entry, userId, schoolId }),
  };
}
