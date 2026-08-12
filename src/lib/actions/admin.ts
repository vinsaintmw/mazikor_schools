"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { auditor } from "@/lib/audit";
import { enumOf, isSuperAdminSession, toBool, toFloat, toInt, toStr } from "@/lib/server-helpers";
import { slugify } from "@/lib/slug";
import bcrypt from "bcryptjs";

async function getSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!isSuperAdminSession(session)) throw new Error("Super admin access required");
  return session;
}

// ------------------------------------------------------------------
// Schools
// ------------------------------------------------------------------

export async function createSchool(formData: FormData) {
  const session = await getSession();
  const name = toStr(formData.get("name"));
  const code = toStr(formData.get("code"));
  if (!name || !code) throw new Error("School name and code are required");

  const baseSlug = slugify(name) || slugify(code);
  let slug = baseSlug;
  let n = 2;
  while (await db.school.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${n++}`;
  }

  const school = await db.school.create({
    data: {
      name,
      code,
      slug,
      address: toStr(formData.get("address")) || null,
      phone: toStr(formData.get("phone")) || null,
      email: toStr(formData.get("email")) || null,
      website: toStr(formData.get("website")) || null,
      registrationNumber: toStr(formData.get("registrationNumber")) || null,
      motto: toStr(formData.get("motto")) || null,
      isActive: toBool(toStr(formData.get("isActive"))),
    },
  });

  const adminRole = await db.role.findFirst({ where: { key: "school_admin", schoolId: null } });

  // Seed basic roles for the new school (only if the global role set exists).
  const baseRoles = ["super_admin", "school_admin", "principal", "teacher", "accountant", "parent", "student", "librarian", "hr"];
  const existingKeys = new Set((await db.role.findMany({ select: { key: true } })).map((r) => r.key));
  for (const key of baseRoles) {
    if (existingKeys.has(key) && key === "school_admin") {
      // School-admin is a system-wide role, reuse it.
    }
  }

  await auditor(session).log({ action: "CREATE", entity: "school", entityId: school.id, details: { name, code } });
  revalidatePath("/admin/schools");
  revalidatePath("/admin");
}

export async function updateSchool(schoolId: string, formData: FormData) {
  const session = await getSession();
  const existing = await db.school.findUnique({ where: { id: schoolId } });
  if (!existing) throw new Error("School not found");

  await db.school.update({
    where: { id: schoolId },
    data: {
      name: toStr(formData.get("name")) || existing.name,
      code: toStr(formData.get("code")) || existing.code,
      address: toStr(formData.get("address")) || null,
      phone: toStr(formData.get("phone")) || null,
      email: toStr(formData.get("email")) || null,
      website: toStr(formData.get("website")) || null,
      registrationNumber: toStr(formData.get("registrationNumber")) || null,
      motto: toStr(formData.get("motto")) || null,
      isActive: toBool(toStr(formData.get("isActive"))),
    },
  });
  await auditor(session).log({ action: "UPDATE", entity: "school", entityId: schoolId });
  revalidatePath("/admin/schools");
}

export async function toggleSchoolActive(schoolId: string) {
  const session = await getSession();
  const existing = await db.school.findUnique({ where: { id: schoolId } });
  if (!existing) throw new Error("School not found");
  await db.school.update({ where: { id: schoolId }, data: { isActive: !existing.isActive } });
  await auditor(session).log({ action: "TOGGLE", entity: "school", entityId: schoolId });
  revalidatePath("/admin/schools");
}

// ------------------------------------------------------------------
// Plans
// ------------------------------------------------------------------

export async function createPlan(formData: FormData) {
  const session = await getSession();
  const name = toStr(formData.get("name"));
  if (!name) throw new Error("Plan name is required");

  const plan = await db.plan.create({
    data: {
      name,
      description: toStr(formData.get("description")) || null,
      priceMonthly: toFloat(formData.get("priceMonthly"), 0),
      priceYearly: toFloat(formData.get("priceYearly"), 0),
      maxStudents: toInt(formData.get("maxStudents"), 100),
      maxTeachers: toInt(formData.get("maxTeachers"), 10),
      maxStaff: toInt(formData.get("maxStaff"), 10),
      maxAdmins: toInt(formData.get("maxAdmins"), 1),
      maxStorageGB: toInt(formData.get("maxStorageGB"), 5),
      isActive: toBool(toStr(formData.get("isActive"))),
      sortOrder: toInt(formData.get("sortOrder"), 0),
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "plan", entityId: plan.id });
  revalidatePath("/admin/plans");
}

export async function togglePlanActive(planId: string) {
  const session = await getSession();
  const existing = await db.plan.findUnique({ where: { id: planId } });
  if (!existing) throw new Error("Plan not found");
  await db.plan.update({ where: { id: planId }, data: { isActive: !existing.isActive } });
  await auditor(session).log({ action: "TOGGLE", entity: "plan", entityId: planId });
  revalidatePath("/admin/plans");
}

// ------------------------------------------------------------------
// Subscriptions
// ------------------------------------------------------------------

export async function upsertSubscription(formData: FormData) {
  const session = await getSession();
  const schoolId = toStr(formData.get("schoolId"));
  const planId = toStr(formData.get("planId"));
  const status = toStr(formData.get("status"));
  if (!schoolId || !planId || !status) throw new Error("School, plan and status are required");

  const existing = await db.subscription.findUnique({ where: { schoolId } });
  if (existing) {
    await db.subscription.update({
      where: { schoolId },
      data: {
        planId,
        status: enumOf(toStr(formData.get("status")), ["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED"] as const, "TRIAL"),
        renewalDate: toStr(formData.get("renewalDate")) ? new Date(`${toStr(formData.get("renewalDate"))}T00:00:00`) : null,
      },
    });
  } else {
    await db.subscription.create({
      data: {
        schoolId,
        planId,
        status: enumOf(toStr(formData.get("status")), ["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED"] as const, "TRIAL"),
        renewalDate: toStr(formData.get("renewalDate")) ? new Date(`${toStr(formData.get("renewalDate"))}T00:00:00`) : null,
      },
    });
  }
  await auditor(session).log({ action: "UPSERT", entity: "subscription", entityId: schoolId });
  revalidatePath("/admin/subscriptions");
}

// ------------------------------------------------------------------
// Users
// ------------------------------------------------------------------

export async function createAdminUser(formData: FormData) {
  const session = await getSession();
  const name = toStr(formData.get("name"));
  const email = toStr(formData.get("email")).toLowerCase();
  const password = toStr(formData.get("password"));
  const roleKey = toStr(formData.get("roleKey"));
  const schoolId = toStr(formData.get("schoolId")) || null;

  if (!name || !email || !password || !roleKey) throw new Error("All fields are required");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with this email already exists");

  const role = await db.role.findFirst({ where: { key: roleKey, ...(schoolId ? { OR: [{ schoolId }, { schoolId: null }] } : { schoolId: null }) } });
  if (!role) throw new Error("Role not found");

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      roleId: role.id,
      schoolId,
      phone: toStr(formData.get("phone")) || null,
    },
  });
  await auditor(session).log({ action: "CREATE", entity: "user", entityId: user.id, details: { email } });
  revalidatePath("/admin/users");
  revalidatePath("/settings");
}
