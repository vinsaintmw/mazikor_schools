import { db } from "@/lib/db";

/**
 * In-app notification helper. SMS/email are handled by provider abstractions
 * (see src/lib/sms.ts) so that no notification is faked when no provider is set.
 */
export async function createNotification(input: {
  schoolId: string;
  userId: string;
  title: string;
  body?: string;
  type?: string;
  link?: string;
}) {
  try {
    await db.notification.create({
      data: {
        schoolId: input.schoolId,
        userId: input.userId,
        title: input.title,
        body: input.body,
        type: input.type ?? "INFO",
        link: input.link,
      },
    });
  } catch {
    // notifications must never break the primary flow
  }
}

/** Creates notifications for every user of a school (optionally filtered by role). */
export async function notifySchool(input: {
  schoolId: string;
  title: string;
  body?: string;
  type?: string;
  link?: string;
  roleKeys?: string[];
}) {
  try {
    const users = await db.user.findMany({
      where: {
        schoolId: input.schoolId,
        isActive: true,
        ...(input.roleKeys?.length ? { role: { key: { in: input.roleKeys } } } : {}),
      },
      select: { id: true },
    });
    await db.notification.createMany({
      data: users.map((u) => ({
        schoolId: input.schoolId,
        userId: u.id,
        title: input.title,
        body: input.body,
        type: input.type ?? "INFO",
        link: input.link,
      })),
    });
  } catch {
    // ignore
  }
}
