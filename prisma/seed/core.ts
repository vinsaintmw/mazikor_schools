import { db, ctx, SCHOOL_INFO, SUBJECT_DEFS, type SeedCtx } from "./helpers";
import { ROLE_PERMISSIONS, type RoleKey } from "../../src/lib/constants";

export async function seedRoles() {
  const roleDefinitions: { key: RoleKey; name: string; description: string }[] = [
    { key: "super_admin", name: "Super Admin", description: "Platform administrator with access to all schools" },
    { key: "school_admin", name: "School Administrator", description: "Manages the entire school" },
    { key: "principal", name: "Head Teacher / Principal", description: "Academic operations manager" },
    { key: "teacher", name: "Teacher", description: "Teaches classes and manages student records" },
    { key: "accountant", name: "Accountant", description: "Manages fees, payments and expenses" },
    { key: "parent", name: "Parent / Guardian", description: "Follows child progress" },
    { key: "student", name: "Student", description: "Views own results and records" },
    { key: "librarian", name: "Librarian", description: "Manages library operations" },
    { key: "hr", name: "HR / Admin Staff", description: "Manages staff and payroll" },
  ];

  for (const def of roleDefinitions) {
    const role = await db.role.create({
      data: {
        name: def.name,
        key: def.key,
        description: def.description,
        isSystem: true,
        schoolId: null,
        permissions: { create: (ROLE_PERMISSIONS[def.key] ?? []).map((permission) => ({ permission })) },
      },
    });
    ctx.roles[def.key] = role.id;
  }
  console.log(`✓ ${Object.keys(ctx.roles).length} roles`);
}

export async function seedPlans() {
  const planDefs = [
    { name: "Starter", priceMonthly: 25000, priceYearly: 260000, maxStudents: 200, maxTeachers: 20, maxStaff: 10, maxAdmins: 1, maxStorageGB: 5, sortOrder: 1, description: "Perfect for small schools getting started." },
    { name: "Professional", priceMonthly: 65000, priceYearly: 650000, maxStudents: 800, maxTeachers: 60, maxStaff: 40, maxAdmins: 3, maxStorageGB: 25, sortOrder: 2, description: "For growing schools that need the full toolkit." },
    { name: "Enterprise", priceMonthly: 150000, priceYearly: 1500000, maxStudents: 5000, maxTeachers: 300, maxStaff: 200, maxAdmins: 10, maxStorageGB: 100, sortOrder: 3, description: "Large institutions and multi-campus schools." },
  ];
  for (const p of planDefs) {
    const plan = await db.plan.create({ data: p });
    ctx.plans[p.name] = plan.id;
  }
  console.log(`✓ ${Object.keys(ctx.plans).length} plans`);
}

export async function seedSchool() {
  const school = await db.school.create({ data: SCHOOL_INFO });
  ctx.school = { id: school.id, name: school.name };

  const start = new Date(`${ctx.year}-01-10`);
  await db.subscription.create({
    data: {
      schoolId: school.id,
      planId: ctx.plans.Professional,
      status: "ACTIVE",
      startDate: start,
      renewalDate: new Date(`${ctx.year + 1}-01-10`),
    },
  });
  console.log("✓ school + subscription");
}

export async function seedAcademicStructure() {
  const ay = await db.academicYear.create({
    data: {
      schoolId: ctx.school.id,
      name: String(ctx.year),
      startDate: new Date(`${ctx.year}-01-05`),
      endDate: new Date(`${ctx.year}-12-15`),
      isCurrent: true,
    },
  });
  ctx.academicYear = { id: ay.id, name: ay.name };

  const termDefs = [
    { name: "Term 1", termNumber: 1, start: `${ctx.year}-01-06`, end: `${ctx.year}-04-10`, current: false },
    { name: "Term 2", termNumber: 2, start: `${ctx.year}-05-04`, end: `${ctx.year}-08-14`, current: true },
    { name: "Term 3", termNumber: 3, start: `${ctx.year}-09-07`, end: `${ctx.year}-12-11`, current: false },
  ];
  for (const t of termDefs) {
    const term = await db.term.create({
      data: {
        schoolId: ctx.school.id,
        academicYearId: ay.id,
        name: t.name,
        termNumber: t.termNumber,
        startDate: new Date(t.start),
        endDate: new Date(t.end),
        isCurrent: t.current,
      },
    });
    ctx.terms[t.name] = term.id;
  }

  const scale = await db.gradeScale.create({
    data: {
      schoolId: ctx.school.id,
      name: "Default (Malawi) A–F",
      isDefault: true,
      bands: {
        create: [
          { min: 80, max: 100, grade: "A", points: 1, remark: "Excellent" },
          { min: 70, max: 79, grade: "B", points: 2, remark: "Very Good" },
          { min: 60, max: 69, grade: "C", points: 3, remark: "Good" },
          { min: 50, max: 59, grade: "D", points: 4, remark: "Fair" },
          { min: 40, max: 49, grade: "E", points: 5, remark: "Pass" },
          { min: 0, max: 39, grade: "F", points: 6, remark: "Fail" },
        ],
      },
    },
  });
  ctx.gradeScale = { id: scale.id };

  const departments = await db.$transaction(
    ["Sciences", "Humanities", "Languages", "Mathematics", "Business", "Agriculture"].map((name) =>
      db.department.create({ data: { schoolId: ctx.school.id, name } })
    )
  );
  ctx.departments = Object.fromEntries(departments.map((d) => [d.name, d.id]));

  for (const s of SUBJECT_DEFS) {
    const subject = await db.subject.create({
      data: {
        schoolId: ctx.school.id,
        code: s.code,
        name: s.name,
        departmentId: ctx.departments[s.dept as keyof typeof ctx.departments],
        passMark: s.passMark,
        maxMark: 100,
      },
    });
    ctx.subjects[s.code] = subject.id;
  }

  const formSubjects: Record<number, string[]> = {
    1: ["ENG", "CHI", "MTH", "SOC", "AGR", "LSC", "RST", "CMP"],
    2: ["ENG", "CHI", "MTH", "SOC", "AGR", "LSC", "RST", "CMP"],
    3: ["ENG", "CHI", "MTH", "BIO", "PSC", "HIS", "GEO", "AGR", "CMP", "BUS", "ACC", "FRN"],
    4: ["ENG", "CHI", "MTH", "BIO", "PSC", "HIS", "GEO", "AGR", "CMP", "BUS", "ACC", "FRN"],
  };

  for (let level = 1; level <= 4; level++) {
    const name = `Form ${level}`;
    const cls = await db.class.create({
      data: { schoolId: ctx.school.id, name, level, capacity: 40, room: `R-${10 + level}` },
    });
    const streamMap: Record<string, string> = {};
    for (const sname of ["A", "B"]) {
      const streamName = `Form ${level}${sname}`;
      const stream = await db.stream.create({
        data: { schoolId: ctx.school.id, classId: cls.id, name: streamName },
      });
      streamMap[sname] = stream.id;
    }
    ctx.classes[name] = { id: cls.id, streams: streamMap };

    for (const code of formSubjects[level]) {
      await db.classSubject.create({
        data: { schoolId: ctx.school.id, classId: cls.id, subjectId: ctx.subjects[code] },
      });
    }
  }
  console.log("✓ academic years, terms, grade scale, departments, subjects, classes");
}

export async function getFormSubjects(level: number): Promise<string[]> {
  const map: Record<number, string[]> = {
    1: ["ENG", "CHI", "MTH", "SOC", "AGR", "LSC", "RST", "CMP"],
    2: ["ENG", "CHI", "MTH", "SOC", "AGR", "LSC", "RST", "CMP"],
    3: ["ENG", "CHI", "MTH", "BIO", "PSC", "HIS", "GEO", "AGR", "CMP", "BUS", "ACC", "FRN"],
    4: ["ENG", "CHI", "MTH", "BIO", "PSC", "HIS", "GEO", "AGR", "CMP", "BUS", "ACC", "FRN"],
  };
  return map[level] ?? [];
}
