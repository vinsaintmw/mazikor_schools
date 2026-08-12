import { db, ctx, hashPassword, pick, randInt, FIRST_M, FIRST_F, LAST } from "./helpers";

export async function seedDemoUsers() {
  const passwordHash = await hashPassword();

  // School admin
  await createUser("Administrator", "Banda", "admin", "school_admin");

  // Principal
  await createUser("Elizabeth", "Mkandawire", "principal", "principal");

  // Accountant
  await createUser("Mwiza", "Chavula", "accountant", "accountant");

  // HR
  await createUser("Chikondi", "Kapanda", "hr", "hr");

  // Librarian
  await createUser("Tadala", "Lunga", "librarian", "librarian");

  // A teacher account (link to teacher record)
  const teacher = await db.teacher.findFirst({
    where: { schoolId: ctx.school.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  if (teacher?.user) {
    await db.user.update({
      where: { id: teacher.user.id },
      data: { passwordHash, roleId: ctx.roles.teacher, isActive: true },
    });
  }

  // Parent account (link to a parent record)
  const parent = await db.parent.findFirst({ where: { schoolId: ctx.school.id }, orderBy: { createdAt: "asc" } });
  if (parent) {
    const user = await createUser(parent.firstName, parent.lastName, "parent", "parent");
    await db.parent.update({ where: { id: parent.id }, data: { userId: user.id } });
  }

  // Student account (link to a student record)
  const student = await db.student.findFirst({ where: { schoolId: ctx.school.id }, orderBy: { createdAt: "asc" } });
  if (student) {
    const user = await createUser(student.firstName, student.lastName, "student", "student");
    await db.student.update({ where: { id: student.id }, data: { userId: user.id } });
  }

  console.log("✓ demo user accounts");
}

async function createUser(first: string, last: string, slug: string, roleKey: string) {
  const passwordHash = await hashPassword();
  const email = `${slug}@mazikor.mw`;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return existing;
  return db.user.create({
    data: {
      name: `${first} ${last}`,
      email,
      passwordHash,
      roleId: ctx.roles[roleKey],
      schoolId: ctx.school.id,
    },
  });
}

export async function seedNotificationsAndAudit() {
  const admin = await db.user.findFirst({ where: { schoolId: ctx.school.id, roleId: ctx.roles.school_admin } });
  const userId = admin?.id ?? ctx.superAdminId;

  await db.notification.createMany({
    data: [
      { schoolId: ctx.school.id, userId, title: "New payment received", body: "A payment of MK 245,000.00 was recorded for Chisomo Banda.", type: "PAYMENT", link: "/payments" },
      { schoolId: ctx.school.id, userId, title: "Fee overdue reminder", body: "12 invoices are now overdue. Review the list.", type: "WARNING", link: "/invoices?status=OVERDUE" },
      { schoolId: ctx.school.id, userId, title: "Exam results published", body: "Mid-year examination results are now published.", type: "ACADEMIC", link: "/results" },
      { schoolId: ctx.school.id, userId, title: "New notice published", body: "Sports Day has been announced for all students.", type: "NOTICE", link: "/notices" },
      { schoolId: ctx.school.id, userId, title: "Leave request pending approval", body: "A leave request is awaiting your approval.", type: "HR", link: "/hr/leave" },
    ],
  });

  const auditEntries = [
    { action: "recorded a payment", entity: "Payment", entityId: "RCT-2026-00001", details: { amount: 245000 } },
    { action: "created", entity: "Student", entityId: "MSS/2026/0001", details: { admissionNumber: "MSS/2026/0001" } },
    { action: "entered exam results", entity: "Result", entityId: "Mid-Year Examinations 2026", details: { exam: "Mid-Year" } },
    { action: "updated", entity: "Class", entityId: "Form 3", details: { change: "capacity" } },
    { action: "published a notice", entity: "Notice", entityId: "Sports Day Announced", details: {} },
    { action: "generated report card", entity: "ReportCard", entityId: "Chisomo Banda", details: { term: "Term 2" } },
  ];
  for (const e of auditEntries) {
    await db.auditLog.create({
      data: {
        schoolId: ctx.school.id,
        userId,
        action: e.action,
        entity: e.entity,
        entityId: e.entityId,
        details: e.details,
      },
    });
  }
  console.log("✓ notifications + audit logs");
}

export async function seedDocuments() {
  const students = await db.student.findMany({ where: { schoolId: ctx.school.id }, take: 6, select: { id: true, firstName: true, lastName: true } });
  for (const s of students) {
    await db.document.create({
      data: {
        schoolId: ctx.school.id,
        entityType: "STUDENT",
        entityId: s.id,
        name: `${s.firstName} ${s.lastName} — Admission Form`,
        fileType: "application/pdf",
        url: "",
        size: randInt(50000, 400000),
      },
    });
  }
  console.log(`✓ ${6} student documents`);
}
