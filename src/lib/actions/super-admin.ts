"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { auditor, auditLog } from "@/lib/audit";
import { isSuperAdminSession, toStr } from "@/lib/server-helpers";
import { slugify } from "@/lib/slug";
import { updateSchool } from "@/lib/actions/admin";
import { error, success } from "@/lib/action-result";

const INVITE_TTL_DAYS = 7;

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function getSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!isSuperAdminSession(session)) throw new Error("Super admin access required");
  return session;
}

function hexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

const SUB_STATUSES = ["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED"] as const;
const SCHOOL_TYPES = ["PRIMARY", "SECONDARY", "COLLEGE", "TERTIARY", "OTHER"] as const;

// ------------------------------------------------------------------
// Create school (onboarding wizard)
// ------------------------------------------------------------------

export async function createSchoolOnboarding(formData: FormData) {
  const session = await getSession();

  const name = toStr(formData.get("name"));
  if (!name) return error("School name is required", { name: "School name is required" });

  const code = toStr(formData.get("code")).toUpperCase();
  if (!code) return error("School code is required", { code: "School code is required" });

  const email = toStr(formData.get("email"));
  if (email && !z.string().email().safeParse(email).success) {
    return error("School email must be a valid email address", { email: "Enter a valid email address" });
  }

  const website = toStr(formData.get("website"));
  if (website && !z.string().url().safeParse(website).success) {
    return error("Website must be a valid URL", { website: "Enter a valid URL including https://" });
  }

  const logo = toStr(formData.get("logo"));
  if (logo && !z.string().url().safeParse(logo).success) {
    return error("Logo must be a valid URL", { logo: "Enter a valid http(s) URL" });
  }

  const primaryColor = toStr(formData.get("primaryColor")) || "#1d4ed8";
  const secondaryColor = toStr(formData.get("secondaryColor")) || "#059669";
  if (!hexColor(primaryColor)) return error("Primary colour must be a valid hex value", { primaryColor: "Use a #RRGGBB colour" });
  if (!hexColor(secondaryColor)) return error("Secondary colour must be a valid hex value", { secondaryColor: "Use a #RRGGBB colour" });

  // ---- Administrator -------------------------------------------------
  const adminName = toStr(formData.get("adminName"));
  const adminEmail = toStr(formData.get("adminEmail")).toLowerCase();
  if (!adminName) return error("Administrator name is required", { adminName: "Administrator name is required" });
  if (!z.string().email().safeParse(adminEmail).success) {
    return error("Administrator email must be a valid email address", { adminEmail: "Enter a valid email address" });
  }

  // ---- Plan & subscription -------------------------------------------
  const planId = toStr(formData.get("planId"));
  if (!planId) return error("A subscription plan is required", { planId: "Select a plan" });

  // ---- Academic year (optional) --------------------------------------
  const ayName = toStr(formData.get("ayName"));
  const ayStart = toStr(formData.get("ayStart"));
  const ayEnd = toStr(formData.get("ayEnd"));
  const hasAy = Boolean(ayName || ayStart || ayEnd);
  if (hasAy && (!ayName || !ayStart || !ayEnd)) {
    return error("Provide the academic year name, start and end dates to set one up", {
      ...(!ayName ? { ayName: "Academic year name is required" } : {}),
      ...(!ayStart ? { ayStart: "Start date is required" } : {}),
      ...(!ayEnd ? { ayEnd: "End date is required" } : {}),
    });
  }
  if (hasAy && new Date(`${ayEnd}T00:00:00`) < new Date(`${ayStart}T00:00:00`)) {
    return error("Academic year end date must be after the start date", { ayEnd: "End date must be after the start date" });
  }

  // ---- Uniqueness -----------------------------------------------------
  const slugBase = slugify(toStr(formData.get("slug"))) || slugify(name) || slugify(code);
  if (!slugBase) return error("School slug is required", { slug: "School slug is required" });

  const [codeTaken, emailTaken, slugTaken] = await Promise.all([
    db.school.findUnique({ where: { code }, select: { id: true } }),
    db.user.findUnique({ where: { email: adminEmail }, select: { id: true } }),
    db.school.findUnique({ where: { slug: slugBase }, select: { id: true } }),
  ]);
  if (codeTaken) return error("A school with this code already exists", { code: "This code is already in use" });
  if (emailTaken) return error("A user with this email already exists", { adminEmail: "This email is already in use" });

  let slug = slugBase;
  let n = 2;
  while (slugTaken || (await db.school.findUnique({ where: { slug } }))) {
    slug = `${slugBase}-${n++}`;
  }

  const adminRole = await db.role.findFirst({ where: { key: "school_admin", schoolId: null } });
  if (!adminRole) return error("The school administrator role is not configured on this platform");

  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan) return error("Selected plan not found", { planId: "Select a valid plan" });

  const subStatus = SUB_STATUSES.includes(toStr(formData.get("status")) as never)
    ? (toStr(formData.get("status")) as (typeof SUB_STATUSES)[number])
    : "TRIAL";

  // ---- Transactional creation -----------------------------------------
  const rawToken = crypto.randomBytes(32).toString("hex");
  const unusableHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);

  const created = await db.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: {
        name,
        code,
        slug,
        type: SCHOOL_TYPES.includes(toStr(formData.get("type")) as never)
          ? (toStr(formData.get("type")) as string)
          : null,
        address: toStr(formData.get("address")) || null,
        district: toStr(formData.get("district")) || null,
        region: toStr(formData.get("region")) || null,
        country: toStr(formData.get("country")) || null,
        timezone: toStr(formData.get("timezone")) || null,
        phone: toStr(formData.get("phone")) || null,
        email: email || null,
        website: website || null,
        registrationNumber: toStr(formData.get("registrationNumber")) || null,
        motto: toStr(formData.get("motto")) || null,
        currency: toStr(formData.get("currency")) || "MWK",
        currencySymbol: toStr(formData.get("currencySymbol")) || "MK",
        primaryColor,
        secondaryColor,
        isActive: true,
      },
    });

    await tx.subscription.create({
      data: {
        schoolId: school.id,
        planId: plan.id,
        status: subStatus,
        renewalDate: subStatus === "TRIAL"
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null,
      },
    });

    const admin = await tx.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash: unusableHash,
        phone: toStr(formData.get("adminPhone")) || null,
        roleId: adminRole.id,
        schoolId: school.id,
      },
    });

    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
    await tx.schoolInvitation.create({
      data: {
        schoolId: school.id,
        email: adminEmail,
        name: adminName,
        roleKey: "school_admin",
        tokenHash: hashToken(rawToken),
        expiresAt,
      },
    });

    if (hasAy) {
      await tx.academicYear.create({
        data: {
          schoolId: school.id,
          name: ayName,
          startDate: new Date(`${ayStart}T00:00:00`),
          endDate: new Date(`${ayEnd}T00:00:00`),
          isCurrent: true,
        },
      });
    }

    return { schoolId: school.id, adminId: admin.id, slug: school.slug };
  });

  await auditor(session).log({
    action: "CREATE",
    entity: "school",
    entityId: created.schoolId,
    details: {
      name,
      code,
      slug: created.slug,
      plan: plan.name,
      adminEmail,
      setupTokenIssued: true,
    },
  });

  revalidatePath("/admin/schools");
  revalidatePath("/admin");

  return success({ schoolId: created.schoolId, token: rawToken, setupUrl: `/setup/${rawToken}` });
}

// ------------------------------------------------------------------
// Invitations / setup links
// ------------------------------------------------------------------

/** Creates a fresh setup link for an existing school (super admin only). */
export async function createSetupLink(formData: FormData) {
  const session = await getSession();
  const schoolId = toStr(formData.get("schoolId"));
  const email = toStr(formData.get("email")).toLowerCase();
  const name = toStr(formData.get("name"));
  const roleKey = toStr(formData.get("roleKey")) || "school_admin";

  if (!schoolId) return error("School is required");
  if (!z.string().email().safeParse(email).success) return error("A valid email is required", { email: "Enter a valid email address" });
  if (!name) return error("Name is required", { name: "Name is required" });

  const school = await db.school.findUnique({ where: { id: schoolId } });
  if (!school) return error("School not found");

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.$transaction(async (tx) => {
    await tx.schoolInvitation.updateMany({
      where: { schoolId, email, revokedAt: null, usedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.schoolInvitation.create({
      data: { schoolId, email, name, roleKey, tokenHash, expiresAt },
    });
  });

  await auditor(session).log({ action: "CREATE", entity: "invitation", entityId: schoolId, details: { email, roleKey } });
  revalidatePath(`/admin/schools/${schoolId}`);

  return success({ setupUrl: `/setup/${rawToken}` });
}

// ------------------------------------------------------------------
// Invitee password setup (public, token-based)
// ------------------------------------------------------------------

export async function setInvitedPassword(formData: FormData) {
  const token = toStr(formData.get("token"));
  const password = toStr(formData.get("password"));
  const confirmPassword = toStr(formData.get("confirmPassword"));

  if (!token) return error("This setup link is invalid");
  if (password.length < 8) return error("Password must be at least 8 characters", { password: "Use at least 8 characters" });
  if (password !== confirmPassword) {
    return error("Passwords do not match", { confirmPassword: "Passwords do not match" });
  }

  const invitation = await db.schoolInvitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { school: true },
  });
  if (!invitation || invitation.revokedAt) return error("This setup link is invalid or has been revoked");
  if (invitation.usedAt) return error("This setup link has already been used. Please contact your school administrator.");
  if (invitation.expiresAt < new Date()) return error("This setup link has expired. Please contact your school administrator.");
  if (!invitation.school.isActive) return error("This school account has been suspended. Please contact support.");

  const user = await db.user.findUnique({ where: { email: invitation.email } });
  if (!user) return error("Account not found for this setup link");

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        name: toStr(formData.get("name")) || user.name,
        phone: toStr(formData.get("phone")) || user.phone,
        passwordHash: await bcrypt.hash(password, 10),
        emailVerified: new Date(),
        isActive: true,
      },
    });
    await tx.schoolInvitation.update({ where: { id: invitation.id }, data: { usedAt: new Date() } });
  });

  await auditLog({
    schoolId: invitation.schoolId,
    userId: user.id,
    action: "UPDATE",
    entity: "user",
    entityId: user.id,
    details: { event: "password-set", email: invitation.email },
  });

  revalidatePath("/login");
  return success();
}

// ------------------------------------------------------------------
// School lifecycle (FormData wrappers for the admin UI)
// ------------------------------------------------------------------

export async function suspendOrActivateSchool(formData: FormData) {
  const session = await getSession();
  const schoolId = toStr(formData.get("schoolId"));
  if (!schoolId) return error("School is required");

  const existing = await db.school.findUnique({ where: { id: schoolId } });
  if (!existing) return error("School not found");

  await db.school.update({ where: { id: schoolId }, data: { isActive: !existing.isActive } });
  await auditor(session).log({
    action: existing.isActive ? "SUSPEND" : "ACTIVATE",
    entity: "school",
    entityId: schoolId,
  });
  revalidatePath("/admin/schools");
  revalidatePath(`/admin/schools/${schoolId}`);
  return success();
}

export async function updateSchoolSettings(formData: FormData) {
  const schoolId = toStr(formData.get("schoolId"));
  if (!schoolId) return error("School is required");
  const result = await updateSchool(schoolId, formData);
  revalidatePath(`/admin/schools/${schoolId}`);
  return result;
}
