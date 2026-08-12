import { db, ctx, hashPassword, randInt, rand, pick, chance, FIRST_M, FIRST_F, LAST, MALAWI_TOWNS, TEACHER_NAMES, SUBJECT_SPEC, STAFF_DEFS, HOUSES, deptForSpec } from "./helpers";

export async function seedSuperAdmin() {
  const passwordHash = await hashPassword();
  const user = await db.user.create({
    data: {
      name: "Mazikor Super Admin",
      email: "superadmin@mazikor.mw",
      passwordHash,
      roleId: ctx.roles.super_admin,
      schoolId: null,
    },
  });
  ctx.superAdminId = user.id;
  console.log("✓ platform super admin");
}

export async function seedTeachers() {
  const passwordHash = await hashPassword();
  for (let i = 0; i < TEACHER_NAMES.length; i++) {
    const t = TEACHER_NAMES[i];
    const empId = `TCH-${ctx.year}-${String(i + 1).padStart(3, "0")}`;
    const email = `${t.first.toLowerCase()}.${t.last.toLowerCase()}@mazikor.mw`;
    const user = await db.user.create({
      data: {
        name: `${t.first} ${t.last}`,
        email,
        passwordHash,
        roleId: ctx.roles.teacher,
        schoolId: ctx.school.id,
      },
    });
    const teacher = await db.teacher.create({
      data: {
        schoolId: ctx.school.id,
        employeeId: empId,
        userId: user.id,
        firstName: t.first,
        lastName: t.last,
        gender: i % 2 === 0 ? "FEMALE" : "MALE",
        dateOfBirth: new Date(`${ctx.year - randInt(25, 45)}-${randInt(1, 12)}-${randInt(1, 28)}`),
        phone: `+265 99${randInt(1000000, 9999999)}`,
        email,
        address: `${pick(MALAWI_TOWNS)}, Malawi`,
        qualification: pick(["B.Ed", "B.Sc + PGDE", "M.Ed", "B.A + PGDE", "B.Sc (Education)"]),
        specialization: t.spec,
        joiningDate: new Date(`${ctx.year - randInt(1, 12)}-09-01`),
        employmentType: pick(["FULL_TIME", "FULL_TIME", "FULL_TIME", "PART_TIME"]),
        salary: randInt(250000, 550000),
        status: "ACTIVE",
      },
    });
    ctx.teacherIds.push(teacher.id);

    const codes = SUBJECT_SPEC[t.spec] ?? [];
    for (const code of codes) {
      await db.subjectTeacher.create({
        data: {
          schoolId: ctx.school.id,
          teacherId: teacher.id,
          subjectId: ctx.subjects[code],
          classId: ctx.classes[`Form ${randInt(1, 4)}`].id,
        },
      });
    }
  }

  const classTeachers: Record<string, number> = { "Form 1": 0, "Form 2": 1, "Form 3": 2, "Form 4": 3 };
  for (const [className, idx] of Object.entries(classTeachers)) {
    await db.class.update({ where: { id: ctx.classes[className].id }, data: { classTeacherId: ctx.teacherIds[idx] } });
  }
  console.log(`✓ ${ctx.teacherIds.length} teachers`);
}

export async function seedStaff() {
  for (let i = 0; i < STAFF_DEFS.length; i++) {
    const s = STAFF_DEFS[i];
    const empId = `STF-${ctx.year}-${String(i + 1).padStart(3, "0")}`;
    const staff = await db.staff.create({
      data: {
        schoolId: ctx.school.id,
        employeeId: empId,
        firstName: s.first,
        lastName: s.last,
        gender: pick(["MALE", "FEMALE"]),
        phone: `+265 88${randInt(1000000, 9999999)}`,
        address: `${pick(MALAWI_TOWNS)}, Malawi`,
        position: s.position,
        department: s.dept,
        joiningDate: new Date(`${ctx.year - randInt(1, 8)}-01-${randInt(1, 28)}`),
        employmentType: "FULL_TIME",
        salary: randInt(120000, 350000),
      },
    });
    ctx.staffIds.push(staff.id);
  }
  console.log(`✓ ${ctx.staffIds.length} staff`);
}

export async function seedStudents() {
  let counter = 0;
  for (let level = 1; level <= 4; level++) {
    for (const streamKey of ["A", "B"]) {
      const streamId = ctx.classes[`Form ${level}`].streams[streamKey];
      const count = randInt(13, 16);
      for (let s = 0; s < count; s++) {
        counter++;
        const gender = pick(["MALE", "FEMALE"] as const);
        const first = gender === "MALE" ? pick(FIRST_M) : pick(FIRST_F);
        const last = pick(LAST);
        const admissionNumber = `MSS/${ctx.year}/${String(counter).padStart(4, "0")}`;
        const student = await db.student.create({
          data: {
            schoolId: ctx.school.id,
            admissionNumber,
            firstName: first,
            middleName: chance(0.4) ? pick(LAST) : null,
            lastName: last,
            gender,
            dateOfBirth: new Date(`${ctx.year - level - 12}-${randInt(1, 12)}-${randInt(1, 28)}`),
            nationality: "Malawian",
            address: `${randInt(1, 200)} ${pick(MALAWI_TOWNS)} Road, ${pick(MALAWI_TOWNS)}`,
            phone: chance(0.5) ? `+265 99${randInt(1000000, 9999999)}` : null,
            email: chance(0.4) ? `${first.toLowerCase()}.${last.toLowerCase()}${randInt(10, 99)}@student.mazikor.mw` : null,
            admissionDate: new Date(`${ctx.year - randInt(0, 3)}-01-${randInt(5, 25)}`),
            streamId,
            house: pick(HOUSES),
            previousSchool: chance(0.6)
              ? pick(["St. Andrews", "Lilongwe Girls", "Kamuzu Academy", "Bishop Mackenzie", "Malawi School of Excellence", "Chizongwe Secondary"])
              : null,
            medicalNotes: chance(0.15)
              ? pick(["Asthma — carries inhaler", "Allergic to peanuts", "Wears glasses", "Peanut allergy", "Epilepsy — stable"])
              : null,
            status: "ACTIVE",
          },
        });
        await db.enrollment.create({
          data: {
            schoolId: ctx.school.id,
            studentId: student.id,
            classId: ctx.classes[`Form ${level}`].id,
            streamId,
            termId: ctx.terms["Term 1"],
          },
        });
        ctx.students.push({
          id: student.id,
          first,
          last,
          gender: String(gender),
          streamId,
          className: `Form ${level}`,
          level,
        });
      }
    }
  }
  ctx.studentIds = ctx.students.map((s) => s.id);
  console.log(`✓ ${ctx.students.length} students`);
}

export async function seedParents() {
  const seen = new Set<string>();
  for (const st of ctx.students) {
    if (seen.size >= 90) break;
    if (!chance(0.75)) continue;
    const phone = `+265 99${randInt(1000000, 9999999)}`;
    if (seen.has(phone)) continue;
    seen.add(phone);
    const gender = pick(["MALE", "FEMALE"] as const);
    const parent = await db.parent.create({
      data: {
        schoolId: ctx.school.id,
        firstName: gender === "MALE" ? pick(FIRST_M) : pick(FIRST_F),
        lastName: st.last,
        phone,
        email: chance(0.7) ? `${st.last.toLowerCase()}.${randInt(100, 999)}@gmail.com` : null,
        address: `${pick(MALAWI_TOWNS)}, Malawi`,
        occupation: pick(["Teacher", "Farmer", "Business Owner", "Nurse", "Driver", "Civil Servant", "Market Trader", "Accountant", "Pastor", "Mechanic"]),
        relationship: gender === "MALE" ? "Father" : "Mother",
        isEmergency: chance(0.4),
      },
    });
    ctx.parentIds.push(parent.id);
  }

  const byLastName = new Map<string, string[]>();
  for (const st of ctx.students) {
    const arr = byLastName.get(st.last) ?? [];
    arr.push(st.id);
    byLastName.set(st.last, arr);
  }
  for (const pid of ctx.parentIds) {
    const parent = await db.parent.findUnique({ where: { id: pid } });
    if (!parent) continue;
    const children = byLastName.get(parent.lastName) ?? [];
    for (const cid of children.slice(0, 2)) {
      await db.studentParent.upsert({
        where: { studentId_parentId: { studentId: cid, parentId: pid } },
        update: {},
        create: { schoolId: ctx.school.id, studentId: cid, parentId: pid },
      });
    }
  }
  console.log(`✓ ${ctx.parentIds.length} parents`);
}

export async function seedEmployees() {
  const passwordHash = await hashPassword();
  for (let i = 0; i < TEACHER_NAMES.length; i++) {
    const t = TEACHER_NAMES[i];
    const email = `${t.first.toLowerCase()}.${t.last.toLowerCase()}@mazikor.mw`;
    await db.employee.create({
      data: {
        schoolId: ctx.school.id,
        firstName: t.first,
        lastName: t.last,
        gender: i % 2 === 0 ? "FEMALE" : "MALE",
        email,
        phone: `+265 99${randInt(1000000, 9999999)}`,
        position: "Teacher",
        departmentId: deptForSpec(t.spec, ctx.departments),
        salary: randInt(250000, 550000),
        joiningDate: new Date(`${ctx.year - randInt(1, 12)}-09-01`),
      },
    });
  }
  const secretarialRole = ctx.roles.school_admin;
  for (const s of STAFF_DEFS) {
    const email = `${s.first.toLowerCase()}.${s.last.toLowerCase()}@mazikor.mw`;
    const user = await db.user.create({
      data: {
        name: `${s.first} ${s.last}`,
        email,
        passwordHash,
        roleId: secretarialRole,
        schoolId: ctx.school.id,
      },
    });
    await db.employee.create({
      data: {
        schoolId: ctx.school.id,
        userId: user.id,
        firstName: s.first,
        lastName: s.last,
        gender: pick(["MALE", "FEMALE"]),
        email,
        phone: `+265 88${randInt(1000000, 9999999)}`,
        position: s.position,
        departmentId: ctx.departments.Administration,
        salary: randInt(120000, 350000),
        joiningDate: new Date(`${ctx.year - randInt(1, 8)}-01-${randInt(1, 28)}`),
      },
    });
  }
  const emps = await db.employee.findMany({ where: { schoolId: ctx.school.id }, select: { id: true } });
  ctx.employeeIds = emps.map((e) => e.id);
  console.log(`✓ ${ctx.employeeIds.length} employees`);
}
