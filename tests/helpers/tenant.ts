import { createRequire } from "node:module";
import { db } from "../../src/lib/db";

const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Session + module interception
//
// The actions run through tsx's CommonJS transform, so `require("@/lib/auth")`
// bypasses Node's ESM `mock.module`. We intercept `Module._load` instead so a
// server action's `auth()` returns the session chosen by the current test.
// `revalidatePath` from `next/cache` is stubbed to a no-op because it requires
// a Next.js request context.
// ---------------------------------------------------------------------------

export type TestSession = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    roleId: string;
    roleKey: string;
    roleName: string;
    schoolId: string | null;
    schoolName: string | null;
    permissions: string[];
  };
};

let currentSession: TestSession | null | undefined;

export function setSession(session: TestSession | null | undefined): void {
  currentSession = session;
}

let installed = false;

export function installMocks(): void {
  if (installed) return;
  installed = true;

  const Module = require("node:module") as { _load: (request: string, parent: unknown, isMain: boolean) => unknown };
  const originalLoad = Module._load;
  Module._load = function (request: string, parent: unknown, isMain: boolean) {
    if (request === "@/lib/auth") {
      return {
        auth: async () => currentSession,
        handlers: {},
        signIn: {},
        signOut: {},
        resolvePermissions: () => [],
      };
    }
    if (request === "next/cache") {
      const real = originalLoad.call(this, request, parent, isMain) as Record<string, unknown>;
      return { ...real, revalidatePath: () => {} };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
}

// ---------------------------------------------------------------------------
// Tenant factory
// ---------------------------------------------------------------------------

export interface Tenant {
  label: string;
  schoolId: string;
  userId: string;
  roleId: string;
  academicYearId: string;
  termId: string;
  classId: string;
  streamId: string;
  subjectId: string;
  teacherId: string;
  parentId: string;
  studentId: string;
  feeId: string;
  invoiceId: string;
  paymentId: string;
  expenseId: string;
  examId: string;
  examSubjectId: string;
  subjectTeacherId: string;
  noticeId: string;
  eventId: string;
  documentId: string;
  notificationId: string;
}

export async function createTenant(label: string): Promise<Tenant> {
  const suffix = `${label.toLowerCase()}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

  await db.school.create({
    data: {
      id: `s_${suffix}`,
      slug: `mz-${suffix}`,
      code: (label.slice(0, 4) + suffix).toUpperCase(),
      name: `${label} School`,
    },
  });
  await db.role.create({
    data: { id: `r_${suffix}`, key: "test_admin", name: `${label} Admin`, schoolId: `s_${suffix}` },
  });
  await db.user.create({
    data: {
      id: `u_${suffix}`,
      name: `${label} Admin`,
      email: `${suffix}@mz-tenant.test`,
      passwordHash: "test-only",
      roleId: `r_${suffix}`,
      schoolId: `s_${suffix}`,
      isActive: true,
    },
  });

  const year = await db.academicYear.create({
    data: {
      schoolId: `s_${suffix}`,
      name: "2026",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      isCurrent: true,
    },
  });
  const term = await db.term.create({
    data: {
      schoolId: `s_${suffix}`,
      academicYearId: year.id,
      name: "Term 1",
      termNumber: 1,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      isCurrent: true,
    },
  });
  const cls = await db.class.create({ data: { schoolId: `s_${suffix}`, name: "Standard 1", level: 1 } });
  const stream = await db.stream.create({ data: { schoolId: `s_${suffix}`, classId: cls.id, name: "A" } });
  const subject = await db.subject.create({
    data: { schoolId: `s_${suffix}`, code: `MAT-${suffix.slice(0, 6)}`, name: "Mathematics" },
  });
  const teacher = await db.teacher.create({
    data: {
      schoolId: `s_${suffix}`,
      employeeId: `TEA-${suffix}`,
      firstName: "Test",
      lastName: `Teacher${label}`,
      gender: "MALE",
    },
  });
  const parent = await db.parent.create({
    data: {
      schoolId: `s_${suffix}`,
      firstName: "Test",
      lastName: `Parent${label}`,
      phone: `+2650${suffix.slice(-7)}`,
      relationship: "Father",
    },
  });
  const student = await db.student.create({
    data: {
      schoolId: `s_${suffix}`,
      admissionNumber: `STU-${suffix}`,
      firstName: "Test",
      lastName: `Student${label}`,
      gender: "FEMALE",
      streamId: stream.id,
    },
  });
  await db.studentParent.create({
    data: { schoolId: `s_${suffix}`, studentId: student.id, parentId: parent.id },
  });
  await db.enrollment.create({
    data: { schoolId: `s_${suffix}`, studentId: student.id, classId: cls.id, streamId: stream.id, termId: term.id },
  });

  const fee = await db.feeStructure.create({
    data: { schoolId: `s_${suffix}`, name: "Tuition", category: "TUITION", amount: 1000 },
  });
  const invoice = await db.invoice.create({
    data: {
      schoolId: `s_${suffix}`,
      number: `INV-${suffix}`,
      studentId: student.id,
      termId: term.id,
      academicYearId: year.id,
      items: { create: [{ schoolId: `s_${suffix}`, description: "Tuition", amount: 1000 }] },
    },
  });
  const payment = await db.payment.create({
    data: {
      schoolId: `s_${suffix}`,
      receiptNumber: `RCP-${suffix}`,
      invoiceId: invoice.id,
      studentId: student.id,
      amount: 500,
      method: "CASH",
      receivedById: `u_${suffix}`,
    },
  });
  const expense = await db.expense.create({
    data: {
      schoolId: `s_${suffix}`,
      number: `EXP-${suffix}`,
      category: "UTILITIES",
      description: "Water bill",
      amount: 100,
    },
  });

  const exam = await db.exam.create({
    data: {
      schoolId: `s_${suffix}`,
      name: "Mid Term",
      type: "MID_TERM",
      academicYearId: year.id,
      termId: term.id,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-05"),
    },
  });
  const examSubject = await db.examSubject.create({
    data: {
      schoolId: `s_${suffix}`,
      examId: exam.id,
      subjectId: subject.id,
      classId: cls.id,
      maxMark: 100,
      passMark: 40,
    },
  });
  const subjectTeacher = await db.subjectTeacher.create({
    data: {
      schoolId: `s_${suffix}`,
      teacherId: teacher.id,
      subjectId: subject.id,
      classId: cls.id,
    },
  });

  const notice = await db.notice.create({
    data: {
      schoolId: `s_${suffix}`,
      title: `Notice ${label}`,
      content: `${label} notice content`,
      audience: "EVERYONE",
      createdById: `u_${suffix}`,
    },
  });
  const event = await db.event.create({
    data: {
      schoolId: `s_${suffix}`,
      title: `Event ${label}`,
      type: "GENERAL",
      startDate: new Date("2026-05-01"),
      createdById: `u_${suffix}`,
    },
  });
  const document = await db.document.create({
    data: {
      schoolId: `s_${suffix}`,
      entityType: "student",
      entityId: student.id,
      studentId: student.id,
      name: `Doc ${label}`,
      fileType: "pdf",
      url: "https://example.com/d.pdf",
    },
  });
  const notification = await db.notification.create({
    data: { schoolId: `s_${suffix}`, userId: `u_${suffix}`, title: `Notif ${label}` },
  });

  return {
    label,
    schoolId: `s_${suffix}`,
    userId: `u_${suffix}`,
    roleId: `r_${suffix}`,
    academicYearId: year.id,
    termId: term.id,
    classId: cls.id,
    streamId: stream.id,
    subjectId: subject.id,
    teacherId: teacher.id,
    parentId: parent.id,
    studentId: student.id,
    feeId: fee.id,
    invoiceId: invoice.id,
    paymentId: payment.id,
    expenseId: expense.id,
    examId: exam.id,
    examSubjectId: examSubject.id,
    subjectTeacherId: subjectTeacher.id,
    noticeId: notice.id,
    eventId: event.id,
    documentId: document.id,
    notificationId: notification.id,
  };
}

export async function deleteTenant(tenants: Tenant[]): Promise<void> {
  await db.user.deleteMany({
    where: { id: { in: tenants.filter((t) => t).map((t) => t.userId) } },
  });
  for (const t of tenants) {
    if (t) await db.school.delete({ where: { id: t.schoolId } }).catch(() => {});
  }
}

export function makeSession(tenant: Tenant, permissions: string[]): TestSession {
  return {
    user: {
      id: tenant.userId,
      name: `${tenant.label} Admin`,
      email: `${tenant.label.toLowerCase()}@mz-tenant.test`,
      image: null,
      roleId: tenant.roleId,
      roleKey: "school_admin",
      roleName: "School Admin",
      schoolId: tenant.schoolId,
      schoolName: `${tenant.label} School`,
      permissions,
    },
  };
}
