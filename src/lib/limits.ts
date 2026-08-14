import { db } from "@/lib/db";

/**
 * Plan limits are configured on the Plan model (per plan) and may be
 * overridden per subscription via `Subscription.customLimits`.
 *
 * A limit of `0` or a negative value means "unlimited" (e.g. the
 * Enterprise / custom plan). Values are NEVER hard-coded in the UI.
 */
export type LimitKind = "students" | "teachers" | "staff";

export interface EffectiveLimits {
  maxStudents: number | null;
  maxTeachers: number | null;
  maxStaff: number | null;
  maxStorageGB: number | null;
  planName: string | null;
  subscriptionStatus: string | null;
}

export type PlanLike = {
  name: string;
  maxStudents: number | null;
  maxTeachers: number | null;
  maxStaff: number | null;
  maxStorageGB: number | null;
};

/**
 * Pure resolution of effective limits from a plan and its custom overrides.
 * `null` means "unlimited". A custom override of `<= 0` also means unlimited.
 */
export function resolveEffectiveLimits(
  plan: PlanLike | null | undefined,
  customLimits: Record<string, unknown>
): Omit<EffectiveLimits, "subscriptionStatus"> {
  const resolve = (base: number | null | undefined, customValue: unknown): number | null => {
    if (typeof customValue === "number" && Number.isFinite(customValue)) {
      return customValue <= 0 ? null : Math.floor(customValue);
    }
    if (base == null) return null;
    return base <= 0 ? null : base;
  };

  return {
    maxStudents: resolve(plan?.maxStudents, customLimits.maxStudents),
    maxTeachers: resolve(plan?.maxTeachers, customLimits.maxTeachers),
    maxStaff: resolve(plan?.maxStaff, customLimits.maxStaff),
    maxStorageGB: resolve(plan?.maxStorageGB, customLimits.maxStorageGB),
    planName: plan?.name ?? null,
  };
}

export async function getEffectiveLimits(schoolId: string): Promise<EffectiveLimits> {
  const subscription = await db.subscription.findUnique({
    where: { schoolId },
    include: { plan: true },
  });
  const resolved = resolveEffectiveLimits(
    subscription?.plan,
    (subscription?.customLimits ?? {}) as Record<string, unknown>
  );
  return {
    ...resolved,
    subscriptionStatus: subscription?.status ?? null,
  };
}

/**
 * Server-side guard: returns a friendly error string when the school has
 * reached the configured limit for the given entity kind, or `null` when
 * the operation may proceed.
 */
export async function enforceLimit(schoolId: string, kind: LimitKind): Promise<string | null> {
  const limits = await getEffectiveLimits(schoolId);
  const max =
    kind === "students" ? limits.maxStudents : kind === "teachers" ? limits.maxTeachers : limits.maxStaff;
  if (max == null) return null;

  const count =
    kind === "students"
      ? await db.student.count({ where: { schoolId } })
      : kind === "teachers"
        ? await db.teacher.count({ where: { schoolId } })
        : await db.staff.count({ where: { schoolId } });

  if (count >= max) {
    return `You have reached the ${max.toLocaleString()} ${kind} limit on your current plan. Contact support to upgrade.`;
  }
  return null;
}
